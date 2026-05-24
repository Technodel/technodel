import sqlite3

SRC_DB = '/var/www/all-mall/dev.db'
DST_DB = '/var/www/technodel.net/new/prisma/dev.db'

src = sqlite3.connect(SRC_DB)
src.row_factory = sqlite3.Row
s = src.cursor()

dst = sqlite3.connect(DST_DB)
dst.row_factory = sqlite3.Row
d = dst.cursor()

# 1) Count Comparts URLs in ALL-MALL
allmall_urls = {
    r['sourceUrl']
    for r in s.execute("""
      SELECT sourceUrl
      FROM Product
      WHERE sourceUrl IS NOT NULL
        AND TRIM(sourceUrl) <> ''
        AND LOWER(sourceUrl) LIKE '%comparts%'
    """).fetchall()
}

# 2) Ensure Comparts competitor exists
comp = d.execute("SELECT id, name, url FROM Competitor WHERE LOWER(name)='comparts' OR LOWER(url) LIKE '%comparts%' LIMIT 1").fetchone()
if comp:
    comp_id = comp['id']
else:
    import uuid
    comp_id = uuid.uuid4().hex
    d.execute('''
      INSERT INTO Competitor (
        id, name, url, status, markupPct, markupFlat, markupMode, currency, scrapeMethod, createdAt, updatedAt
      ) VALUES (?, 'Comparts', 'https://compartslb.com', 'active', 0, 0, 'percent', 'USD', 'cheerio', datetime('now'), datetime('now'))
    ''', (comp_id,))

# 3) Count existing Technodel rows with comparts sourceUrl
tech_rows = d.execute("""
  SELECT id, competitorId, displayPrice, sourcePrice
  FROM Product
  WHERE sourceUrl IS NOT NULL
    AND TRIM(sourceUrl) <> ''
    AND LOWER(sourceUrl) LIKE '%comparts%'
""").fetchall()

# 4) Assign all comparts-source rows to Comparts competitor and align same-price policy
tagged = 0
price_aligned = 0
for r in tech_rows:
    if r['competitorId'] != comp_id:
        d.execute("UPDATE Product SET competitorId = ? WHERE id = ?", (comp_id, r['id']))
        tagged += 1

    # keep same price policy when sourcePrice exists
    if r['sourcePrice'] is not None and r['displayPrice'] != r['sourcePrice']:
        d.execute("UPDATE Product SET displayPrice = ? WHERE id = ?", (r['sourcePrice'], r['id']))
        price_aligned += 1

# 5) Find missing URLs (present in ALL-MALL but absent in Technodel)
tech_urls = {
    r['sourceUrl']
    for r in d.execute("""
      SELECT sourceUrl
      FROM Product
      WHERE sourceUrl IS NOT NULL
        AND TRIM(sourceUrl) <> ''
        AND LOWER(sourceUrl) LIKE '%comparts%'
    """).fetchall()
}
missing_urls = allmall_urls - tech_urls

# Optional: print small sample of missing
sample_missing = list(missing_urls)[:10]

# 6) Final counts
final_comparts_products = d.execute("SELECT COUNT(*) FROM Product WHERE competitorId = ?", (comp_id,)).fetchone()[0]
final_comparts_source = d.execute("""
  SELECT COUNT(*)
  FROM Product
  WHERE sourceUrl IS NOT NULL AND TRIM(sourceUrl) <> ''
    AND LOWER(sourceUrl) LIKE '%comparts%'
""").fetchone()[0]

dst.commit()

print('ALLMALL_COMPARTS_URLS', len(allmall_urls))
print('TECH_COMPARTS_SOURCE_ROWS', len(tech_rows))
print('RECON_TAGGED_TO_COMPARTS', tagged)
print('RECON_PRICE_ALIGNED', price_aligned)
print('MISSING_URLS_NOT_IN_TECH', len(missing_urls))
print('FINAL_COMPARTS_COMPETITOR_PRODUCTS', final_comparts_products)
print('FINAL_COMPARTS_SOURCE_ROWS', final_comparts_source)
if sample_missing:
    print('MISSING_SAMPLE_START')
    for u in sample_missing:
        print(u)
    print('MISSING_SAMPLE_END')

src.close()
dst.close()
