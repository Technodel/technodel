import sqlite3

slug = 'lenovo-v15-g5-i7-13620h-512gb-ssd-16gb-ddr5-15-6-business-laptop-lenovo-v15'
db = sqlite3.connect('/var/www/technodel.net/new/prisma/dev.db')
db.row_factory = sqlite3.Row
c = db.cursor()
r = c.execute(
    'SELECT id, title, slug, displayPrice, sourcePrice, comparePrice, sourceUrl, images, competitorId FROM Product WHERE slug = ?',
    (slug,),
).fetchone()

if not r:
    print('NOT_FOUND')
else:
    for k in r.keys():
        print(f'{k}: {r[k]}')

db.close()
