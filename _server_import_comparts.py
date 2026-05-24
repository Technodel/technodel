import sqlite3
import json
import re
from urllib.parse import urlparse

SRC_DB = '/var/www/all-mall/dev.db'
DST_DB = '/var/www/technodel.net/new/prisma/dev.db'
SUPPLIER_KEY = 'comparts'

CAMERA_DEVICE_RE = re.compile(r'\b(webcam|conference\s*camera|video\s*conferencing|video\s*conference|conferencecam|ptz|rally\s*bar|rally\s*camera|meetup|streamcam|brio|logitech\s*c\d{3}|ip\s*camera|security\s*camera)\b', re.I)
LAPTOP_DEVICE_RE = re.compile(r'\b(laptop|notebook|macbook|ultrabook|chromebook|thinkpad|ideapad|vivobook|zenbook)\b', re.I)

def is_likely_camera_conferencing_product(title: str) -> bool:
    text = (title or '').strip().lower()
    if not text:
        return False
    return bool(CAMERA_DEVICE_RE.search(text)) and not bool(LAPTOP_DEVICE_RE.search(text))

def slugify(text: str) -> str:
    s = (text or '').lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = re.sub(r'-{2,}', '-', s).strip('-')
    return (s or 'product')[:90]

def parse_images(raw):
    if raw is None:
        return []
    t = str(raw).strip()
    if not t:
        return []
    try:
        j = json.loads(t)
        if isinstance(j, list):
            return [u for u in j if isinstance(u, str) and u.startswith('http')]
    except Exception:
        pass
    return [p.strip() for p in re.split(r'[\n,;|]+', t) if p.strip().startswith('http')]

src = sqlite3.connect(SRC_DB)
src.row_factory = sqlite3.Row
s = src.cursor()

dst = sqlite3.connect(DST_DB)
dst.row_factory = sqlite3.Row
d = dst.cursor()

# Build source query based on available columns in ALL-MALL
src_cols = {r['name'] for r in s.execute('PRAGMA table_info(Product)').fetchall()}

def col(name, alias=None):
    if name in src_cols:
        return f'{name} AS {alias or name}'
    return f'NULL AS {alias or name}'

query = f"""
SELECT
  {col('id')},
  {col('title')},
  {col('slug')},
  {col('brand')},
  {col('description')},
  {col('shortDescription')},
  {col('displayPrice')},
  {col('sourcePrice')},
  {col('currency')},
  {col('imageUrls', 'imagesRaw')},
  {col('sourceUrl')},
  {col('sourceId')},
  {col('categoryId')}
FROM Product
WHERE sourceUrl IS NOT NULL
  AND TRIM(sourceUrl) <> ''
  AND LOWER(sourceUrl) LIKE '%{SUPPLIER_KEY}%'
"""
rows = s.execute(query).fetchall()

if not rows:
    print('COMPARTS_FOUND 0')
    src.close()
    dst.close()
    raise SystemExit(0)

# Detect canonical supplier URL from most common source host
host_count = {}
for r in rows:
    su = (r['sourceUrl'] or '').strip()
    try:
        host = urlparse(su).netloc.lower()
    except Exception:
        host = ''
    if host:
        host_count[host] = host_count.get(host, 0) + 1

best_host = sorted(host_count.items(), key=lambda kv: kv[1], reverse=True)[0][0] if host_count else 'comparts.com'
supplier_url = f'https://{best_host}'

# Ensure competitor record exists
comp = d.execute('SELECT id FROM Competitor WHERE LOWER(name)=? OR LOWER(url)=?', ('comparts', supplier_url.lower())).fetchone()
if comp:
    competitor_id = comp['id']
    d.execute('UPDATE Competitor SET name=?, url=?, status=?, markupPct=?, markupMode=?, markupFlat=?, updatedAt=datetime(\'now\') WHERE id=?',
              ('Comparts', supplier_url, 'active', 0, 'percent', 0, competitor_id))
else:
    # create id manually to avoid relying on cuid in raw sqlite insert
    import uuid
    competitor_id = uuid.uuid4().hex
    d.execute('''
      INSERT INTO Competitor (
        id, name, url, status, markupPct, markupFlat, markupMode, currency, scrapeMethod, createdAt, updatedAt
      ) VALUES (?, ?, ?, 'active', 0, 0, 'percent', 'USD', 'cheerio', datetime('now'), datetime('now'))
    ''', (competitor_id, 'Comparts', supplier_url))

# Existing records in Technodel
existing_source = {r[0] for r in d.execute("SELECT sourceUrl FROM Product WHERE sourceUrl IS NOT NULL AND TRIM(sourceUrl) <> ''").fetchall()}
existing_slug = {r[0] for r in d.execute('SELECT slug FROM Product').fetchall()}
used_sku = {r[0] for r in d.execute("SELECT sku FROM Product WHERE sku IS NOT NULL AND TRIM(sku) <> ''").fetchall()}

# Seed SKU counter from max SK######
sk_counter = 0
for (sku,) in d.execute("SELECT sku FROM Product WHERE sku LIKE 'SK%'").fetchall():
    m = re.match(r'^SK(\d+)$', sku or '')
    if m:
        sk_counter = max(sk_counter, int(m.group(1)))

# Category fallback
fallback_cat = d.execute('SELECT id FROM Category WHERE isVisible = 1 ORDER BY sortOrder ASC LIMIT 1').fetchone()
if not fallback_cat:
    fallback_cat = d.execute('SELECT id FROM Category LIMIT 1').fetchone()
if not fallback_cat:
    print('ERROR_NO_CATEGORY')
    src.close()
    dst.close()
    raise SystemExit(1)

laptops_cat = d.execute("SELECT id FROM Category WHERE slug = 'laptops' LIMIT 1").fetchone()
cameras_cat = d.execute("SELECT id FROM Category WHERE slug = 'cameras' LIMIT 1").fetchone()
laptops_cat_id = laptops_cat[0] if laptops_cat else None
cameras_cat_id = cameras_cat[0] if cameras_cat else None

created = 0
skipped_existing = 0
skipped_bad = 0

for r in rows:
    source_url = (r['sourceUrl'] or '').strip()
    if not source_url or source_url in existing_source:
        skipped_existing += 1
        continue

    title = (r['title'] or '').strip() or 'Untitled Product'

    # Same price as ALL-MALL for this supplier
    base_price = r['displayPrice'] if r['displayPrice'] is not None else r['sourcePrice']
    try:
        base_price = float(base_price or 0)
    except Exception:
        base_price = 0.0
    if base_price <= 0:
        skipped_bad += 1
        continue

    imgs = parse_images(r['imagesRaw'])
    if not imgs:
        skipped_bad += 1
        continue

    base_slug = slugify((r['slug'] or '').strip() or title)
    slug = base_slug
    i = 1
    while slug in existing_slug:
        i += 1
        slug = f'{base_slug}-{i}'

    sk_counter += 1
    sku = f'SK{sk_counter:06d}'
    while sku in used_sku:
        sk_counter += 1
        sku = f'SK{sk_counter:06d}'

    # Category mapping: reuse if exists in target, else fallback
    category_id = r['categoryId']
    cat_ok = d.execute('SELECT id FROM Category WHERE id = ?', (category_id,)).fetchone() if category_id else None
    if not cat_ok:
        category_id = fallback_cat[0]

    # Guard against camera/conferencing products ending up in laptops.
    if category_id == laptops_cat_id and cameras_cat_id and is_likely_camera_conferencing_product(title):
        category_id = cameras_cat_id

    brand = (r['brand'] or None)
    short_desc = (r['shortDescription'] or '').strip() or f"{(brand + ' ') if brand else ''}{title} - Available at Technodel Lebanon."
    description = (r['description'] or '').strip() or f'<p>{title}</p><p>Available at Technodel Lebanon.</p>'

    import uuid
    pid = uuid.uuid4().hex

    d.execute('''
      INSERT INTO Product (
        id, slug, sku, title, shortDescription, description, highlights, specs, schemaJson,
        costPrice, priceFormula, displayPrice, comparePrice, currency, images,
        categoryId, attributes, brand, sourceId, sourceUrl, sourcePrice, competitorId,
        isVisible, isFeatured, featuredOrder, isNew, stock, lowStockThresh,
        seoEnriched, viewCount, orderCount, rating, reviewCount, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        1, 0, 0, 1, 999, 5,
        0, 0, 0, 0, 0, datetime('now'), datetime('now')
      )
    ''', (
      pid,
      slug,
      sku,
      title,
      short_desc,
      description,
      json.dumps(['Official Warranty', 'Fast Delivery', 'Best Price in Lebanon']),
      json.dumps([]),
      '',
      base_price,
      '',
      base_price,         # same price as ALL-MALL
      None,
      r['currency'] or 'USD',
      json.dumps(imgs[:5]),
      category_id,
      json.dumps({}),
      brand,
      r['sourceId'] or None,
      source_url,
      base_price,         # keep source price same too
      competitor_id,
    ))

    existing_source.add(source_url)
    existing_slug.add(slug)
    used_sku.add(sku)
    created += 1

# Commit all
dst.commit()

final_comparts = d.execute("SELECT COUNT(*) FROM Product WHERE competitorId = ?", (competitor_id,)).fetchone()[0]
final_total = d.execute('SELECT COUNT(*) FROM Product').fetchone()[0]

print('COMPARTS_FOUND', len(rows))
print('COMPARTS_COMPETITOR_URL', supplier_url)
print('COMPARTS_CREATED', created)
print('COMPARTS_SKIPPED_EXISTING', skipped_existing)
print('COMPARTS_SKIPPED_BAD', skipped_bad)
print('COMPARTS_TOTAL_IN_TECHNODEL', final_comparts)
print('TOTAL_PRODUCTS_AFTER', final_total)

src.close()
dst.close()
