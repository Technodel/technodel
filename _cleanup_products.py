import sqlite3
import os

DB_PATH = "/var/www/technodel.net/new/prisma/dev.db"

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'Competitor%'")
    res = cursor.fetchone()
    comp_table = res[0] if res else "Competitor"

    cursor.execute("SELECT COUNT(*) FROM Product WHERE isVisible = 1")
    visible_before = cursor.fetchone()[0]

    cursor.execute(f"""
        UPDATE Product 
        SET isVisible = 0 
        WHERE isVisible = 1 AND id NOT IN (
            SELECT p.id 
            FROM Product p
            LEFT JOIN {comp_table} c ON p.competitorId = c.id
            WHERE 
                LOWER(COALESCE(c.name, '')) LIKE '%ayoub%' OR
                LOWER(COALESCE(c.name, '')) LIKE '%ezone%' OR
                LOWER(COALESCE(c.name, '')) LIKE '%pacmax%' OR
                LOWER(COALESCE(c.name, '')) LIKE '%comparts%' OR
                LOWER(COALESCE(c.name, '')) LIKE '%jak%' OR
                LOWER(COALESCE(p.sourceUrl, '')) LIKE '%ayoub%' OR
                LOWER(COALESCE(p.sourceUrl, '')) LIKE '%ezone%' OR
                LOWER(COALESCE(p.sourceUrl, '')) LIKE '%pacmax%' OR
                LOWER(COALESCE(p.sourceUrl, '')) LIKE '%comparts%' OR
                LOWER(COALESCE(p.sourceUrl, '')) LIKE '%jak-lb%' OR
                LOWER(COALESCE(p.sourceUrl, '')) LIKE '%jak.com.lb%'
        )
    """)
    hidden_by_supplier = cursor.rowcount

    nontech_terms = ['perfume', 'parfum', 'eau de parfum', 'cup', 'saucer', 'pencil', 'bag', 'backpack', 'zipper', 'tissue', 'cosmetic', 'makeup']
    total_hidden_nontech = 0
    for term in nontech_terms:
        cursor.execute("UPDATE Product SET isVisible = 0 WHERE isVisible = 1 AND LOWER(title) LIKE ?", (f'%{term}%',))
        total_hidden_nontech += cursor.rowcount

    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM Product WHERE isVisible = 1")
    visible_after = cursor.fetchone()[0]

    print(f"visible_before: {visible_before}")
    print(f"hidden_by_supplier: {hidden_by_supplier}")
    print(f"hidden_by_nontech: {total_hidden_nontech}")
    print(f"visible_after: {visible_after}")

    print("\n--- suspicious_visible_after ---")
    for term in ['perfume', 'parfum', 'cup', 'saucer', 'bag', 'zipper']:
        cursor.execute("SELECT COUNT(*) FROM Product WHERE isVisible = 1 AND LOWER(title) LIKE ?", (f'%{term}%',))
        print(f"{term}: {cursor.fetchone()[0]}")

    print("\n--- supplier_visible_breakdown ---")
    cursor.execute(f"SELECT COALESCE(c.name, 'Unknown'), COUNT(p.id) FROM Product p LEFT JOIN {comp_table} c ON p.competitorId = c.id WHERE p.isVisible = 1 GROUP BY 1 ORDER BY 2 DESC LIMIT 10")
    for r in cursor.fetchall(): print(f"{r[0]}: {r[1]}")
    conn.close()

if __name__ == '__main__': main()
