
import sqlite3
db=sqlite3.connect("/var/www/technodel.net/new/prisma/dev.db")
db.row_factory=sqlite3.Row
print([dict(r)["title"] for r in db.execute("SELECT title FROM Product WHERE categoryId='cmpe8m47w0003l3iokktejy3m' LIMIT 30").fetchall()])

