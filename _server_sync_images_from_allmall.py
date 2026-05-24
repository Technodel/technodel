import sqlite3
import json
import re

SRC_DB = '/var/www/all-mall/dev.db'
DST_DB = '/var/www/technodel.net/new/prisma/dev.db'


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

# Build ALL-MALL sourceUrl -> image list map
src_map = {}
for r in s.execute("SELECT sourceUrl, imageUrls FROM Product WHERE sourceUrl IS NOT NULL AND TRIM(sourceUrl) <> '' AND imageUrls IS NOT NULL AND TRIM(imageUrls) <> ''"):
    imgs = parse_images(r['imageUrls'])
    if imgs:
        src_map[r['sourceUrl']] = imgs[:5]

rows = d.execute("SELECT id, sourceUrl, images FROM Product WHERE sourceUrl IS NOT NULL AND TRIM(sourceUrl) <> ''").fetchall()

updated = 0
unchanged = 0
missing_in_allmall = 0

for r in rows:
    su = r['sourceUrl']
    imgs = src_map.get(su)
    if not imgs:
        missing_in_allmall += 1
        continue

    new_json = json.dumps(imgs)
    old_json = r['images'] or ''
    if old_json == new_json:
        unchanged += 1
        continue

    d.execute('UPDATE Product SET images = ? WHERE id = ?', (new_json, r['id']))
    updated += 1


dst.commit()

# Count current source-backed records with empty image arrays
empty_after = d.execute("""
SELECT COUNT(*)
FROM Product
WHERE sourceUrl IS NOT NULL AND TRIM(sourceUrl) <> ''
  AND (images IS NULL OR TRIM(images) = '' OR images = '[]')
""").fetchone()[0]

print('SYNC_UPDATED', updated)
print('SYNC_UNCHANGED', unchanged)
print('SYNC_MISSING_IN_ALLMALL', missing_in_allmall)
print('SYNC_EMPTY_AFTER', empty_after)

src.close()
dst.close()
