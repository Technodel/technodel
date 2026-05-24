"""Check images from actual suppliers (Ezone, Ayoub, etc.) vs demo products"""
import sqlite3, json, urllib.request

DB = '/var/www/technodel.net/new/prisma/dev.db'
db = sqlite3.connect(DB)
c = db.cursor()

# Supplier products (have sourceUrl)
print("=== Supplier product image URLs (first 8) ===")
rows = c.execute("""
    SELECT title, images, sourceUrl FROM Product
    WHERE images NOT IN ('[]','') AND images IS NOT NULL
      AND sourceUrl IS NOT NULL
    LIMIT 8
""").fetchall()

for title, images_str, sourceUrl in rows:
    try:
        imgs = json.loads(images_str)
        url = imgs[0] if imgs else None
    except:
        url = None
    print(f"\n  {title[:55]}")
    print(f"  Source: {(sourceUrl or '')[:60]}")
    print(f"  Image:  {url}")
    if url:
        try:
            req = urllib.request.Request(url, method='HEAD', headers={
                'User-Agent': 'Mozilla/5.0'
            })
            with urllib.request.urlopen(req, timeout=5) as resp:
                print(f"  → HTTP {resp.status} ✅")
        except Exception as e:
            print(f"  → FAIL ❌ {str(e)[:60]}")

# Count working vs broken for supplier products
print("\n=== Testing 50 random supplier product images ===")
rows2 = c.execute("""
    SELECT images FROM Product
    WHERE images NOT IN ('[]','') AND images IS NOT NULL
      AND sourceUrl IS NOT NULL
    ORDER BY RANDOM() LIMIT 50
""").fetchall()

ok = 0
fail = 0
for (images_str,) in rows2:
    try:
        imgs = json.loads(images_str)
        url = imgs[0] if imgs else None
    except:
        url = None
    if not url:
        continue
    try:
        req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=4) as resp:
            if resp.status == 200:
                ok += 1
            else:
                fail += 1
    except:
        fail += 1

print(f"Working: {ok}/50  Broken: {fail}/50")
db.close()
