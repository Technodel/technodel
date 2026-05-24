import sqlite3
import json
import re
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

SRC_DB = '/var/www/all-mall/dev.db'
DST_DB = '/var/www/technodel.net/new/prisma/dev.db'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
}

def test_image(url, timeout=6):
    if not url or not url.startswith('http'):
        return False
    try:
        host = urllib.parse.urlparse(url).netloc
        req = urllib.request.Request(url, method='HEAD', headers={
            **HEADERS,
            'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            'Referer': f'https://{host}/',
        })
        with urllib.request.urlopen(req, timeout=timeout) as r:
            ct = (r.headers.get('content-type') or '').lower()
            return r.status < 400 and ('image' in ct or ct == '')
    except Exception:
        return False

def parse_images(raw):
    if not raw:
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

def scrape_from_html(source_url, timeout=10):
    try:
        req = urllib.request.Request(source_url, headers={
            **HEADERS,
            'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        })
        with urllib.request.urlopen(req, timeout=timeout) as r:
            html = r.read(500_000).decode('utf-8', errors='ignore')
    except Exception:
        return []

    candidates = []

    patterns = [
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
        r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']twitter:image["\']',
        r'"image"\s*:\s*"(https?://[^"\\]+)"',
        r'"image"\s*:\s*\[(.*?)\]',
        r'<img[^>]+(?:src|data-src)=["\'](https?://[^"\']+)["\']',
    ]

    for pat in patterns[:4]:
        for m in re.finditer(pat, html, re.IGNORECASE):
            u = m.group(1).strip().replace('\\/', '/')
            if u.startswith('http'):
                candidates.append(u)

    for m in re.finditer(patterns[4], html, re.IGNORECASE):
        u = m.group(1).strip().replace('\\/', '/')
        if u.startswith('http'):
            candidates.append(u)

    for m in re.finditer(patterns[5], html, re.IGNORECASE | re.DOTALL):
        inside = m.group(1)
        for u in re.findall(r'"(https?://[^"\\]+)"', inside):
            candidates.append(u.replace('\\/', '/'))

    for m in re.finditer(patterns[6], html, re.IGNORECASE):
        candidates.append(m.group(1).strip())

    # rank likely product images first
    def score(u):
        lu = u.lower()
        s = 0
        if any(x in lu for x in ['product', 'wp-content/uploads', 'cdn', 'image', 'gallery']):
            s += 2
        if any(x in lu for x in ['logo', 'icon', 'avatar', 'placeholder']):
            s -= 3
        return s

    uniq = []
    seen = set()
    for u in sorted(candidates, key=score, reverse=True):
        if u not in seen:
            seen.add(u)
            uniq.append(u)
    return uniq[:20]

# connect DBs
src = sqlite3.connect(SRC_DB)
src.row_factory = sqlite3.Row
s = src.cursor()

dst = sqlite3.connect(DST_DB)
dst.row_factory = sqlite3.Row
d = dst.cursor()

rows = d.execute('''
SELECT id, title, images, sourceUrl
FROM Product
WHERE sourceUrl IS NOT NULL AND TRIM(sourceUrl) <> ''
''').fetchall()

work = []
for r in rows:
    imgs = parse_images(r['images'])
    first = imgs[0] if imgs else ''
    if not first or not test_image(first, timeout=4):
        work.append({'id': r['id'], 'title': r['title'], 'sourceUrl': r['sourceUrl']})

# preload all-mall map by sourceUrl
src_map = {}
for rr in s.execute("SELECT sourceUrl, imageUrls FROM Product WHERE sourceUrl IS NOT NULL AND TRIM(sourceUrl) <> '' AND imageUrls IS NOT NULL AND TRIM(imageUrls) <> ''"):
    src_map[rr['sourceUrl']] = parse_images(rr['imageUrls'])

fixed_from_allmall = 0
fixed_from_scrape = 0
failed = 0

def repair(item):
    su = item['sourceUrl']
    # 1) all-mall direct by sourceUrl
    cand = src_map.get(su, [])
    for u in cand[:5]:
        if test_image(u, timeout=5):
            return item, [u], 'allmall'

    # 2) scrape source page deeply
    for u in scrape_from_html(su):
        if test_image(u, timeout=5):
            return item, [u], 'scrape'

    return item, None, 'fail'

with ThreadPoolExecutor(max_workers=25) as ex:
    futs = [ex.submit(repair, it) for it in work]
    for i, fut in enumerate(as_completed(futs), 1):
        item, imgs, mode = fut.result()
        if imgs:
            d.execute('UPDATE Product SET images = ? WHERE id = ?', (json.dumps(imgs), item['id']))
            if mode == 'allmall':
                fixed_from_allmall += 1
            else:
                fixed_from_scrape += 1
        else:
            failed += 1
        if i % 200 == 0:
            dst.commit()
            print('PROGRESS', i, len(work))

dst.commit()
print('FIX_TARGETS', len(work))
print('FIX_FROM_ALLMALL', fixed_from_allmall)
print('FIX_FROM_SCRAPE', fixed_from_scrape)
print('FIX_FAILED', failed)

src.close()
dst.close()
