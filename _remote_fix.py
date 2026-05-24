"""
Remote fix script — runs on the VPS to:
  1. Delete Antoine / stationery products
  2. Set comparePrice = displayPrice * random(1.05, 1.10) for ALL products
  3. Show sample image URLs so we know if they're hotlink-broken
"""
import sqlite3, random, json, os

DB = '/var/www/technodel.net/new/prisma/dev.db'
db = sqlite3.connect(DB)
db.row_factory = sqlite3.Row
c = db.cursor()

# ── 1. Delete Antoine / stationery products ──────────────────────────────────
STATIONERY_KEYWORDS = [
    '%copybook%', '%copy book%', '%notebook%', '%spiral%',
    '%molang%', '%antoine%', '%sketchbook%', '%exercise book%',
    '%ruled book%', '%ring binder%', '%furry book%',
]
STATIONERY_MAX_PRICE = 30   # a real laptop/device never costs < $30

where_clauses = " OR ".join(
    ["lower(title) LIKE '" + kw + "'" for kw in STATIONERY_KEYWORDS]
)
stationery_sql = f"""
    SELECT p.id FROM Product p
    JOIN Category c ON c.id = p.categoryId
    WHERE ({where_clauses})
      AND p.displayPrice < {STATIONERY_MAX_PRICE}
"""
stationery_ids = [r['id'] for r in c.execute(stationery_sql).fetchall()]
print(f"[1] Stationery/Antoine products to delete: {len(stationery_ids)}")

if stationery_ids:
    placeholders = ','.join('?' * len(stationery_ids))
    # Cascade manually (no FK cascade in SQLite here)
    for tbl in ('CartItem', 'WishlistItem', 'Review', 'Variant'):
        c.execute(f"DELETE FROM {tbl} WHERE productId IN ({placeholders})", stationery_ids)
    c.execute(f"DELETE FROM Product WHERE id IN ({placeholders})", stationery_ids)
    print(f"    ✅ Deleted {len(stationery_ids)} stationery products")
else:
    print("    nothing to delete")

# ── 2. Set comparePrice = displayPrice * random 1.05..1.10 ───────────────────
all_products = c.execute("SELECT id, displayPrice FROM Product WHERE displayPrice > 0").fetchall()
print(f"\n[2] Setting comparePrice on {len(all_products)} products (5–10% above display)...")

random.seed()
update = db.cursor()
updated = 0
for p in all_products:
    factor = round(random.uniform(1.05, 1.10), 4)
    compare = round(p['displayPrice'] * factor, 2)
    update.execute(
        "UPDATE Product SET comparePrice = ? WHERE id = ?",
        (compare, p['id'])
    )
    updated += 1

print(f"    ✅ Updated {updated} products")

# ── 3. Sample image URLs to diagnose hotlink issue ───────────────────────────
print("\n[3] Sample image URLs (first 5 products with images):")
rows = c.execute(
    "SELECT title, images FROM Product WHERE images NOT IN ('[]','') AND images IS NOT NULL LIMIT 5"
).fetchall()
for r in rows:
    try:
        imgs = json.loads(r['images'])
        url = imgs[0] if imgs else '(empty array)'
    except Exception:
        url = r['images'][:80]
    print(f"    {r['title'][:50]}")
    print(f"    → {url}")

db.commit()
db.close()
print("\n✅ Done.")
