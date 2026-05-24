import sqlite3

conn = sqlite3.connect('/var/www/technodel.net/new/prisma/dev.db')
c = conn.cursor()

comp = c.execute("""
SELECT id, name, url
FROM Competitor
WHERE LOWER(name) = 'comparts' OR LOWER(url) LIKE '%comparts%'
LIMIT 1
""").fetchone()

if not comp:
    print('COMPARTS_RECORD_MISSING')
else:
    cid = comp[0]
    total = c.execute('SELECT COUNT(*) FROM Product WHERE competitorId = ?', (cid,)).fetchone()[0]
    same = c.execute(
        'SELECT COUNT(*) FROM Product WHERE competitorId = ? AND ABS(COALESCE(displayPrice,0)-COALESCE(sourcePrice,0)) < 0.0001',
        (cid,),
    ).fetchone()[0]
    diff = total - same

    print('COMPARTS_ID', cid)
    print('COMPARTS_NAME', comp[1])
    print('COMPARTS_URL', comp[2])
    print('COMPARTS_PRODUCTS', total)
    print('PRICE_MATCH_COUNT', same)
    print('PRICE_DIFF_COUNT', diff)

conn.close()
