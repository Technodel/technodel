import sqlite3; db = sqlite3.connect("/var/www/all-mall/dev.db"); db.row_factory = sqlite3.Row; print(dict(db.execute("SELECT * FROM Site LIMIT 1").fetchone()))
