import sqlite3
import json
import random
import re
import uuid

SRC_DB = '/var/www/all-mall/dev.db'
DST_DB = '/var/www/technodel.net/new/prisma/dev.db'
IMPORT_LIMIT = 300

ALLOWED = (
    'ezone',
    'ayoub',
    'pacmax',
    'dslr',
    'jak',
    'ishtari',
    'mzone',
    'freeshoplebanon',
)

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
    if isinstance(raw, str):
        t = raw.strip()
        if not t:
            return []
        try:
            j = json.loads(t)
            if isinstance(j, list):
                return [u for u in j if isinstance(u, str) and u.startswith('http')]
        except Exception:
            pass
        parts = re.split(r'[\n,;|]+', t)
        return [p.strip() for p in parts if p.strip().startswith('http')]
    return []

src = sqlite3.connect(SRC_DB)
src.row_factory = sqlite3.Row
s = src.cursor()

dst = sqlite3.connect(DST_DB)
dst.row_factory = sqlite3.Row
d = dst.cursor()

# build source columns dynamically to avoid schema mismatch
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
  AND imageUrls IS NOT NULL
  AND TRIM(imageUrls) <> ''
"""
rows = s.execute(query).fetchall()

# Keep only allowed suppliers
candidates = []
for r in rows:
    su = (r['sourceUrl'] or '').lower()
    if any(k in su for k in ALLOWED):
        candidates.append(r)

random.shuffle(candidates)

existing_source = {r[0] for r in d.execute("SELECT sourceUrl FROM Product WHERE sourceUrl IS NOT NULL AND TRIM(sourceUrl) <> ''").fetchall()}
existing_slug = {r[0] for r in d.execute("SELECT slug FROM Product").fetchall()}
used_sku = {r[0] for r in d.execute("SELECT sku FROM Product WHERE sku IS NOT NULL AND TRIM(sku) <> ''").fetchall()}

max_sk = d.execute("SELECT sku FROM Product WHERE sku LIKE 'SK%' ORDER BY sku DESC LIMIT 1").fetchone()
sk_counter = 0
if max_sk and max_sk[0]:
    m = re.search(r'^(?:SK)(\d+)$', max_sk[0])
    if m:
        sk_counter = int(m.group(1))

laptops_cat = d.execute("SELECT id FROM Category WHERE slug = 'laptops' LIMIT 1").fetchone()
cameras_cat = d.execute("SELECT id FROM Category WHERE slug = 'cameras' LIMIT 1").fetchone()
laptops_cat_id = laptops_cat[0] if laptops_cat else None
cameras_cat_id = cameras_cat[0] if cameras_cat else None

created = 0
skipped_dup = 0

for r in candidates:
    if created >= IMPORT_LIMIT:
        break

    source_url = (r['sourceUrl'] or '').strip()
    if not source_url or source_url in existing_source:
        skipped_dup += 1
        continue

    title = (r['title'] or '').strip() or 'Untitled Product'
    base_slug = slugify((r['slug'] or '').strip() or title)
    slug = base_slug
    i = 1
    while slug in existing_slug:
        i += 1
        slug = f"{base_slug}-{i}"

    imgs = parse_images(r['imagesRaw'])
    if not imgs:
        skipped_dup += 1
        continue

    display = r['displayPrice'] if r['displayPrice'] is not None else r['sourcePrice']
    try:
        display = float(display or 0)
    except Exception:
        display = 0.0
    if display <= 0:
        skipped_dup += 1
        continue

    compare = round(display * (1.05 + random.random() * 0.05), 2)

    sk_counter += 1
    sku = f"SK{sk_counter:06d}"
    while sku in used_sku:
        sk_counter += 1
        sku = f"SK{sk_counter:06d}"

    short_desc = (r['shortDescription'] or '').strip()
    if not short_desc:
        brand = (r['brand'] or '').strip()
        short_desc = f"{brand + ' ' if brand else ''}{title} - Available at Technodel Lebanon."

    description = (r['description'] or '').strip() or f"<p>{title}</p><p>Available at Technodel Lebanon.</p>"

    # try preserving category, fallback to first visible category
    cat_id = r['categoryId']
    valid_cat = None
    if cat_id:
        valid_cat = d.execute('SELECT id FROM Category WHERE id = ?', (cat_id,)).fetchone()
    if not valid_cat:
        valid_cat = d.execute('SELECT id FROM Category WHERE isVisible = 1 ORDER BY sortOrder ASC LIMIT 1').fetchone()
    if not valid_cat:
        # as ultimate fallback any category
        valid_cat = d.execute('SELECT id FROM Category LIMIT 1').fetchone()
    if not valid_cat:
        break
    final_category_id = valid_cat[0]

    # Guard against camera/conferencing products ending up in laptops.
    if final_category_id == laptops_cat_id and cameras_cat_id and is_likely_camera_conferencing_product(title):
        final_category_id = cameras_cat_id

    now = d.execute("SELECT datetime('now')").fetchone()[0]
    pid = uuid.uuid4().hex

    d.execute(
        '''
        INSERT INTO Product (
            id, title, slug, sku, shortDescription, description, highlights, specs, schemaJson,
            displayPrice, comparePrice, sourcePrice, costPrice, currency,
            images, brand, stock, rating, reviewCount,
            isVisible, isFeatured, featuredOrder, isNew,
            categoryId, sourceId, sourceUrl, competitorId,
            seoTitle, seoDescription, seoKeywords, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (
            pid,
            title,
            slug,
            sku,
            short_desc,
            description,
            json.dumps(["Official Warranty", "Fast Delivery", "Best Price in Lebanon"]),
            json.dumps([]),
            '',
            display,
            compare,
            r['sourcePrice'] if r['sourcePrice'] is not None else display,
            0,
            (r['currency'] or 'USD'),
            json.dumps(imgs[:5]),
            (r['brand'] or None),
            999,
            0,
            0,
            1,
            0,
            0,
            1,
            final_category_id,
            (r['sourceId'] or None),
            source_url,
            None,
            title,
            short_desc,
            (r['brand'] or ''),
            now,
            now,
        )
    )

    existing_source.add(source_url)
    existing_slug.add(slug)
    used_sku.add(sku)
    created += 1


dst.commit()

total_dst = d.execute('SELECT COUNT(*) FROM Product').fetchone()[0]
no_source_dst = d.execute("SELECT COUNT(*) FROM Product WHERE sourceUrl IS NULL OR TRIM(sourceUrl) = ''").fetchone()[0]
img_empty_dst = d.execute("SELECT COUNT(*) FROM Product WHERE images IS NULL OR TRIM(images) = '' OR images = '[]'").fetchone()[0]

print('IMPORT_CREATED', created)
print('IMPORT_SKIPPED', skipped_dup)
print('FINAL_TOTAL', total_dst)
print('FINAL_NO_SOURCE', no_source_dst)
print('FINAL_IMAGES_EMPTY', img_empty_dst)

src.close()
dst.close()
