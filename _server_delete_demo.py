import sqlite3

DB = '/var/www/technodel.net/new/prisma/dev.db'
conn = sqlite3.connect(DB)
c = conn.cursor()

before_total = c.execute('SELECT COUNT(*) FROM Product').fetchone()[0]
before_no_source = c.execute("SELECT COUNT(*) FROM Product WHERE sourceUrl IS NULL OR TRIM(sourceUrl) = ''").fetchone()[0]

# Delete all no-source products (demo/seed/manual entries without supplier trace)
deleted = c.execute("DELETE FROM Product WHERE sourceUrl IS NULL OR TRIM(sourceUrl) = ''").rowcount
conn.commit()

after_total = c.execute('SELECT COUNT(*) FROM Product').fetchone()[0]
after_no_source = c.execute("SELECT COUNT(*) FROM Product WHERE sourceUrl IS NULL OR TRIM(sourceUrl) = ''").fetchone()[0]

print('DELETE_BEFORE_TOTAL', before_total)
print('DELETE_BEFORE_NO_SOURCE', before_no_source)
print('DELETE_DELETED', deleted)
print('DELETE_AFTER_TOTAL', after_total)
print('DELETE_AFTER_NO_SOURCE', after_no_source)

conn.close()
