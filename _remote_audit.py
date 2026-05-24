import sqlite3
DB = '/var/www/technodel.net/new/prisma/dev.db'
db = sqlite3.connect(DB)
c = db.cursor()
print('Total:', c.execute('SELECT COUNT(*) FROM Product').fetchone()[0])
print('With images:', c.execute("SELECT COUNT(*) FROM Product WHERE images NOT IN ('[]','') AND images IS NOT NULL").fetchone()[0])
print('No comparePrice:', c.execute('SELECT COUNT(*) FROM Product WHERE comparePrice IS NULL').fetchone()[0])
print('Bad comparePrice:', c.execute('SELECT COUNT(*) FROM Product WHERE comparePrice IS NOT NULL AND comparePrice <= displayPrice').fetchone()[0])
rows = c.execute("SELECT sku,displayPrice,title FROM Product WHERE lower(title) LIKE '%copybook%' OR lower(title) LIKE '%notebook%' OR lower(title) LIKE '%antoine%' LIMIT 15").fetchall()
print('Antoine/copybook count:', len(rows))
for r in rows: print(' ', r[0], r[1], r[2][:65])
