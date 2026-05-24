import sqlite3
import html
import re
import json

db_path = "/var/www/technodel.net/new/prisma/dev.db"

def clean_text(text):
    if not text:
        return text
    prev = ""
    curr = text
    for _ in range(3):
        curr = html.unescape(curr)
        if curr == prev:
            break
        prev = curr
    # Collapse whitespace
    curr = re.sub(r'\s+', ' ', curr).strip()
    return curr

def find_entities(text):
    if not text: return False
    # Common patterns: &#...; &...;
    patterns = [r'&#\d+;', r'&#x[0-9a-fA-F]+;', r'&nbsp;', r'&amp;', r'&quot;', r'&lt;', r'&gt;']
    for p in patterns:
        if re.search(p, text, re.IGNORECASE):
            return True
    return False

def main():
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # 1. Identify rows with entities
    fields = ["title", "shortDescription", "seoTitle", "seoDescription"]
    query = f"SELECT id, {', '.join(fields)} FROM Product"
    c.execute(query)
    rows = c.fetchall()

    to_update = []
    samples = []
    
    for row in rows:
        rid, title, short_desc, seo_title, seo_desc = row
        has_entity = any(find_entities(f) for f in [title, short_desc, seo_title, seo_desc])
        
        if has_entity:
            if len(samples) < 20:
                samples.append((rid, title))
            
            new_title = clean_text(title)
            new_short = clean_text(short_desc)
            new_seo_t = clean_text(seo_title)
            new_seo_d = clean_text(seo_desc)
            
            if (new_title != title or new_short != short_desc or 
                new_seo_t != seo_title or new_seo_d != seo_desc):
                to_update.append((new_title, new_short, new_seo_t, new_seo_d, rid))

    print(f"Sample rows before cleanup ({len(samples)}):")
    for rid, title in samples:
        print(f"  ID: {rid} | Title: {title}")

    # 3. Perform cleanup
    if to_update:
        c.executemany("UPDATE Product SET title=?, shortDescription=?, seoTitle=?, seoDescription=? WHERE id=?", to_update)
        conn.commit()
    
    print(f"\nCleanup Stats:")
    print(f"  Rows identified with entities: {len(samples) if len(to_update) > 0 else 0} (limit 20 shown)") # This is slightly misleading in the print, better use len(to_update)
    print(f"  Total rows updated: {len(to_update)}")

    # 5. Query specific products
    fragments = [
        "Lenovo V15 G5",
        "Laptop Core I9 13900H ASUS",
        "Edimax AC450 Wi-Fi USB Adapter for MacBook",
        "HP OMEN 16 Gaming Laptop i9-14900HX"
    ]
    
    print("\nTarget Product Query Results:")
    for frag in fragments:
        c.execute("SELECT id, title, images, ogImage, sourceUrl FROM Product WHERE title LIKE ?", (f"%{frag}%",))
        matches = c.fetchall()
        for m in matches:
            print(f"  Match: {m[1]}")
            print(f"    ID: {m[0]}")
            print(f"    Images: {m[2]}")
            print(f"    ogImage: {m[3]}")
            print(f"    Source: {m[4]}")

    # 6. Global counts
    c.execute("SELECT images FROM Product")
    all_images = c.fetchall()
    
    empty_images = 0
    external_first = 0
    malformed_json = 0
    
    for (img_val,) in all_images:
        if not img_val or img_val == '[]' or img_val.strip() == '':
            empty_images += 1
            continue
            
        try:
            imgs = json.loads(img_val)
            if isinstance(imgs, list) and len(imgs) > 0:
                first = str(imgs[0])
                if first.startswith('http'):
                    external_first += 1
            elif not isinstance(imgs, list):
                malformed_json += 1
        except:
            malformed_json += 1

    print("\nGlobal Image Stats:")
    print(f"  Products with empty/null images: {empty_images}")
    print(f"  Products with external first image: {external_first}")
    print(f"  Products with malformed images JSON: {malformed_json}")

    conn.close()

if __name__ == '__main__':
    main()
