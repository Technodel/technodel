
import sqlite3
import json
import re

SRC_DB = "/var/www/all-mall/dev.db"
DST_DB = "/var/www/technodel.net/new/prisma/dev.db"

def parse_images(raw):
    if raw is None:
        return []
    t = str(raw).strip()
    if not t:
        return []
    try:
        j = json.loads(t)
        if isinstance(j, list):
            return [u for u in j if isinstance(u, str) and u.startswith("http")]
    except Exception:
        pass
    return [p.strip() for p in re.split(r"[\n,;|]+", t) if p.strip().startswith("http")]

src = sqlite3.connect(SRC_DB)
src.row_factory = sqlite3.Row

dst = sqlite3.connect(DST_DB)
dst.row_factory = sqlite3.Row

# Get all mall data
src_data = {}
for r in src.execute("SELECT sourceUrl, imageUrls, displayPrice, sourcePrice FROM Product WHERE sourceUrl IS NOT NULL"):
    imgs = parse_images(r["imageUrls"])
    src_data[r["sourceUrl"].strip()] = {
        "images": imgs[:5],
        "displayPrice": r["displayPrice"],
        "sourcePrice": r["sourcePrice"]
    }

print(f"Loaded {len(src_data)} all-mall products")

d = dst.cursor()
rows = d.execute("SELECT id, sourceUrl, images, displayPrice, sourcePrice FROM Product WHERE sourceUrl IS NOT NULL").fetchall()

updated = 0
for r in rows:
    su = r["sourceUrl"].strip()
    if not su or su not in src_data:
        continue
        
    sdata = src_data[su]
    new_imgs = json.dumps(sdata["images"])
    new_dp = sdata["displayPrice"]
    new_sp = sdata["sourcePrice"]
    
    dirty = False
    
    if r["images"] != new_imgs: dirty = True
    if r["displayPrice"] != new_dp: dirty = True
    if r["sourcePrice"] != new_sp: dirty = True
    
    if dirty:
        d.execute("UPDATE Product SET images=?, displayPrice=?, sourcePrice=? WHERE id=?", 
                  (new_imgs, new_dp, new_sp, r["id"]))
        updated += 1

dst.commit()
print(f"Updated {updated} records in Technodel matched by sourceUrl.")

