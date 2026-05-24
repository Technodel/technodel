"""Check full image URLs and test if they actually load"""
import sqlite3, json, urllib.request

DB = '/var/www/technodel.net/new/prisma/dev.db'
db = sqlite3.connect(DB)
c = db.cursor()

# Get 10 sample image URLs
rows = c.execute(
    "SELECT title, images FROM Product WHERE images NOT IN ('[]','') AND images IS NOT NULL LIMIT 10"
).fetchall()

print("=== Full image URLs ===")
broken = 0
working = 0
for title, images_str in rows:
    try:
        imgs = json.loads(images_str)
        url = imgs[0] if imgs else None
    except:
        url = None

    if not url:
        print(f"  NO URL: {title[:50]}")
        continue

    print(f"\n  {title[:55]}")
    print(f"  URL: {url}")

    # Try to HEAD request the URL
    try:
        req = urllib.request.Request(url, method='HEAD', headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        with urllib.request.urlopen(req, timeout=5) as resp:
            print(f"  STATUS: {resp.status} ✅")
            working += 1
    except Exception as e:
        print(f"  STATUS: FAIL ❌ ({str(e)[:60]})")
        broken += 1

print(f"\n=== Results: {working} working, {broken} broken ===")
db.close()
