import sqlite3

DB = '/var/www/technodel.net/new/prisma/dev.db'
conn = sqlite3.connect(DB)
c = conn.cursor()

keywords = [
    '%iPhone 16 Pro Max%',
    '%Galaxy S25%',
    '%MacBook Pro 16%',
    '%PS5 Pro%',
    '%AirPods Max%',
    '%iPad Pro 13%'
]

where_demo = ' OR '.join(['title LIKE ?' for _ in keywords])

total = c.execute('SELECT COUNT(*) FROM Product').fetchone()[0]
no_source = c.execute("SELECT COUNT(*) FROM Product WHERE sourceUrl IS NULL OR TRIM(sourceUrl) = ''").fetchone()[0]
demo_no_source = c.execute(
    f"SELECT COUNT(*) FROM Product WHERE (sourceUrl IS NULL OR TRIM(sourceUrl) = '') AND ({where_demo})",
    keywords,
).fetchone()[0]
img_empty = c.execute("SELECT COUNT(*) FROM Product WHERE images IS NULL OR TRIM(images) = '' OR images = '[]'").fetchone()[0]

print('AUDIT_TOTAL', total)
print('AUDIT_NO_SOURCE', no_source)
print('AUDIT_DEMO_NO_SOURCE', demo_no_source)
print('AUDIT_IMAGES_EMPTY', img_empty)

conn.close()
