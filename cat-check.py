
import sqlite3
db=sqlite3.connect("/var/www/technodel.net/new/prisma/dev.db")
db.row_factory=sqlite3.Row
print([dict(r) for r in db.execute("SELECT id, name, slug FROM Category").fetchall()])

