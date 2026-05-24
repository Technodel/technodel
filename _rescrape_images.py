"""
Re-scrape product images for products with broken image URLs.
Strategy:
  1. Test each product's first image URL
  2. If broken AND has a sourceUrl → scrape the product page for og:image
  3. Update the DB with the fresh image URL
  4. For products with no sourceUrl and broken images → leave as-is (gradient placeholder)
"""
import sqlite3, json, urllib.request, re, time, random

DB = '/var/www/technodel.net/new/prisma/dev.db'
db = sqlite3.connect(DB)
db.row_factory = sqlite3.Row

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

def test_url(url, timeout=5):
    """Returns True if URL returns a 200-range image content."""
    try:
        host = urllib.parse.urlparse(url).netloc if hasattr(urllib, 'parse') else url.split('/')[2]
        req = urllib.request.Request(url, method='HEAD', headers={
            **HEADERS,
            'Referer': f'https://{host}/',
        })
        with urllib.request.urlopen(req, timeout=timeout) as r:
            ct = r.headers.get('content-type', '')
            return r.status < 400 and 'image' in ct
    except:
        return False

import urllib.parse

def scrape_og_image(url, timeout=8):
    """Fetch a product page and extract the first usable image URL."""
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            html = r.read().decode('utf-8', errors='ignore')
    except Exception as e:
        return None

    # Priority 1: og:image
    m = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', html, re.IGNORECASE)
    if not m:
        m = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', html, re.IGNORECASE)
    if m:
        candidate = m.group(1).strip()
        if candidate.startswith('http'):
            return candidate

    # Priority 2: WooCommerce gallery first image
    m = re.search(r'woocommerce-product-gallery[^>]*>.*?<img[^>]+src=["\']([^"\']+)["\']', html, re.IGNORECASE | re.DOTALL)
    if m:
        candidate = m.group(1).strip()
        if candidate.startswith('http'):
            return candidate

    # Priority 3: first large product image (wp-content/uploads)
    matches = re.findall(r'https?://[^\s"\'<>]+/wp-content/uploads/[^\s"\'<>]+\.(?:jpg|jpeg|png|webp)', html, re.IGNORECASE)
    if matches:
        # Prefer larger images (avoid thumbnails)
        large = [u for u in matches if not re.search(r'-\d+x\d+\.', u)]
        return large[0] if large else matches[0]

    return None

# ── Main loop ──────────────────────────────────────────────────────────────────
c = db.cursor()
all_products = c.execute("""
    SELECT id, title, images, sourceUrl FROM Product
    WHERE images NOT IN ('[]','') AND images IS NOT NULL
""").fetchall()

print(f"Testing {len(all_products)} products with stored images...\n")

broken = []
for p in all_products:
    try:
        imgs = json.loads(p['images'])
        url = imgs[0] if imgs else None
    except:
        url = None
    if not url:
        continue
    if not test_url(url):
        broken.append(p)

print(f"Broken images: {len(broken)}")
print(f"Of those with sourceUrl: {sum(1 for p in broken if p['sourceUrl'])}")
print()

fixed = 0
skipped = 0

for i, p in enumerate(broken):
    src_url = p['sourceUrl']
    if not src_url:
        skipped += 1
        continue

    print(f"[{i+1}/{len(broken)}] {p['title'][:55]}")
    print(f"         src: {src_url[:70]}")

    new_img = scrape_og_image(src_url)
    if new_img:
        print(f"         ✅ found: {new_img[:80]}")
        db.execute(
            "UPDATE Product SET images = ? WHERE id = ?",
            (json.dumps([new_img]), p['id'])
        )
        db.commit()
        fixed += 1
    else:
        print(f"         ❌ no image found")
        skipped += 1

    # Polite crawl delay
    time.sleep(random.uniform(0.5, 1.2))

print(f"\n=== Done: {fixed} fixed, {skipped} skipped ===")
db.close()
