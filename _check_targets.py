import sqlite3, json

db = sqlite3.connect('/var/www/technodel.net/new/prisma/dev.db')
db.row_factory = sqlite3.Row
c = db.cursor()

patterns = [
    '%Samsung Galaxy S25 Ultra%',
    '%MacBook Pro 16%M4%',
    '%PS5 Pro%',
    '%AirPods Max%',
    '%iPad Pro 13%M4%'
]

rows = c.execute('''
SELECT title, images, sourceUrl
FROM Product
WHERE title LIKE ? OR title LIKE ? OR title LIKE ? OR title LIKE ? OR title LIKE ?
LIMIT 50
''', patterns).fetchall()

for r in rows:
    try:
        imgs = json.loads(r['images'] or '[]')
    except Exception:
        imgs = []
    first = imgs[0] if imgs else ''
    print('---')
    print(r['title'])
    print('img:', first)
    print('sourceUrl:', r['sourceUrl'])

print('\ncount:', len(rows))
db.close()
