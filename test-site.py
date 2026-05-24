import sqlite3; db = sqlite3.connect("/var/www/all-mall/dev.db"); db.row_factory = sqlite3.Row; [print(dict(r)) for r in db.execute("SELECT name, url, markup, priceFormula FROM Site").fetchall()]
