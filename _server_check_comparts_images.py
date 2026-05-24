import sqlite3
import json
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

DB = '/var/www/technodel.net/new/prisma/dev.db'
conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row
c = conn.cursor()

comp = c.execute("""
SELECT id, name, url
FROM Competitor
WHERE LOWER(name) = 'comparts' OR LOWER(url) LIKE '%comparts%'
LIMIT 1
""").fetchone()

if not comp:
    print('COMPARTS_NOT_FOUND')
    conn.close()
    raise SystemExit(0)

cid = comp['id']
rows = c.execute('SELECT id, title, images FROM Product WHERE competitorId = ?', (cid,)).fetchall()

with_images = 0
without_images = 0
first_urls = []

for r in rows:
    imgs = []
    raw = r['images'] or ''
    if raw.strip():
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                imgs = [u for u in parsed if isinstance(u, str) and u.startswith('http')]
        except Exception:
            imgs = [u.strip() for u in raw.split(',') if u.strip().startswith('http')]

    if imgs:
        with_images += 1
        first_urls.append(imgs[0])
    else:
        without_images += 1


def is_ok(url: str) -> bool:
    try:
        host = urllib.parse.urlparse(url).netloc
        req = urllib.request.Request(
            url,
            method='HEAD',
            headers={
                'User-Agent': 'Mozilla/5.0',
                'Referer': f'https://{host}/'
            }
        )
        with urllib.request.urlopen(req, timeout=6) as r:
            ct = (r.headers.get('content-type') or '').lower()
            return r.status < 400 and ('image' in ct or ct == '')
    except Exception:
        return False

ok = 0
bad = 0
if first_urls:
    with ThreadPoolExecutor(max_workers=20) as ex:
        futures = [ex.submit(is_ok, u) for u in first_urls]
        for f in as_completed(futures):
            if f.result():
                ok += 1
            else:
                bad += 1

print('COMPARTS_TOTAL', len(rows))
print('COMPARTS_WITH_IMAGES', with_images)
print('COMPARTS_WITHOUT_IMAGES', without_images)
print('COMPARTS_FIRST_IMAGE_OK', ok)
print('COMPARTS_FIRST_IMAGE_BAD', bad)

conn.close()
