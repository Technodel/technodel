"""
Fast parallel image re-scraper using ThreadPoolExecutor.
1. Tests all image URLs in parallel (50 workers)
2. For broken ones with sourceUrl → scrapes og:image from the product page
3. Updates DB
"""
import sqlite3, json, urllib.request, urllib.parse, re, time, random
from concurrent.futures import ThreadPoolExecutor, as_completed

DB = '/var/www/technodel.net/new/prisma/dev.db'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

def test_url(url, timeout=4):
    try:
        host = urllib.parse.urlparse(url).netloc
        req = urllib.request.Request(url, method='HEAD', headers={
            **HEADERS,
            'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            'Referer': f'https://{host}/',
        })
        with urllib.request.urlopen(req, timeout=timeout) as r:
            ct = r.headers.get('content-type', '')
            return r.status < 400 and ('image' in ct or ct == '')
    except:
        return False

def scrape_og_image(src_url, timeout=7):
    try:
        req = urllib.request.Request(src_url, headers={
            **HEADERS,
            'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        })
        with urllib.request.urlopen(req, timeout=timeout) as r:
            html = r.read(200_000).decode('utf-8', errors='ignore')  # read max 200KB
    except:
        return None

    # og:image (two attribute orderings)
    for pat in [
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
    ]:
        m = re.search(pat, html, re.IGNORECASE)
        if m:
            c = m.group(1).strip()
            if c.startswith('http'):
                return c

    # WooCommerce gallery img src
    m = re.search(r'class=["\'][^"\']*woocommerce-product-gallery[^"\']*["\'][^>]*>.*?<img[^>]+src=["\']([^"\']+)["\']', html, re.IGNORECASE | re.DOTALL)
    if m:
        c = m.group(1).strip()
        if c.startswith('http'):
            return c

    # wp-content uploads (largest filename = full-size)
    matches = re.findall(r'(https?://[^\s"\'<>]+/wp-content/uploads/[^\s"\'<>]+\.(?:jpg|jpeg|png|webp))', html, re.IGNORECASE)
    if matches:
        large = [u for u in matches if not re.search(r'-\d+x\d+\.', u)]
        return large[0] if large else matches[0]

    return None

# ── Load products ──────────────────────────────────────────────────────────────
db = sqlite3.connect(DB)
db.row_factory = sqlite3.Row
c = db.cursor()

products = c.execute("""
    SELECT id, title, images, sourceUrl FROM Product
    WHERE images NOT IN ('[]','') AND images IS NOT NULL
""").fetchall()

# Extract (id, title, first_img_url, sourceUrl)
work = []
for p in products:
    try:
        imgs = json.loads(p['images'])
        url = imgs[0] if imgs else None
    except:
        url = None
    if url:
        work.append({'id': p['id'], 'title': p['title'], 'img': url, 'src': p['sourceUrl']})

print(f"Products with image URLs: {len(work)}")
print("Testing URLs in parallel (50 workers)...\n")

# ── Phase 1: parallel URL test ─────────────────────────────────────────────────
broken = []
done = 0

def check(item):
    ok = test_url(item['img'])
    return item, ok

with ThreadPoolExecutor(max_workers=50) as ex:
    futures = {ex.submit(check, item): item for item in work}
    for fut in as_completed(futures):
        item, ok = fut.result()
        done += 1
        if done % 500 == 0:
            print(f"  Tested {done}/{len(work)} ...", flush=True)
        if not ok:
            broken.append(item)

print(f"\nBroken: {len(broken)}")
with_src = [p for p in broken if p['src']]
without_src = [p for p in broken if not p['src']]
print(f"  With sourceUrl (fixable): {len(with_src)}")
print(f"  Without sourceUrl (demo/seed): {len(without_src)}\n")

# ── Phase 2: scrape fresh images for broken products with sourceUrl ────────────
fixed = 0
fail = 0

def fix_one(item):
    img = scrape_og_image(item['src'])
    return item, img

print("Scraping product pages for fresh images (30 workers)...\n")
with ThreadPoolExecutor(max_workers=30) as ex:
    futures = {ex.submit(fix_one, item): item for item in with_src}
    for fut in as_completed(futures):
        item, new_img = fut.result()
        if new_img:
            db.execute("UPDATE Product SET images = ? WHERE id = ?",
                       (json.dumps([new_img]), item['id']))
            db.commit()
            print(f"  ✅ {item['title'][:50]:50s} → {new_img[:60]}")
            fixed += 1
        else:
            fail += 1

# ── Summary ───────────────────────────────────────────────────────────────────
print(f"\n=== Done: {fixed} fixed, {fail} could not fix, {len(without_src)} demo products skipped ===")
db.close()
