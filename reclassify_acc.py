import sqlite3
import re

DB_PATH = "/var/www/technodel.net/new/prisma/dev.db"

def reclassify():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # 1. Get Categories
    categories = {row["slug"]: row["id"] for row in c.execute("SELECT slug, id FROM Category").fetchall()}
    acc_id = categories.get("accessories")
    if not acc_id:
        print("Accessories category not found.")
        return

    # 2. Define rules
    rules = [
        ("tablets", r"\b(ipad|tablet|galaxy tab|tab s\d|tab a\d?)\b"),
        ("smartphones", r"\b(iphone|smartphone|galaxy s\d|redmi|xiaomi|pixel)\b"),
        ("laptops", r"\b(laptop|notebook|macbook|thinkpad|ideapad|vivobook|chromebook)\b"),
        ("gaming", r"\b(ps5|ps4|playstation|xbox|nintendo|switch oled|gamepad|joystick|gaming mouse|gaming keyboard|gaming headset)\b"),
        ("audio", r"\b(headphone|headset|earbud|earphone|airpods|speaker|microphone|podcast mic|soundbar)\b"),
        ("networking", r"\b(router|modem|wi-?fi|access point|mesh|ethernet|cat6|rj45|network switch|poe switch|gigabit switch)\b"),
        ("cameras", r"\b(webcam|cctv|camera lens|tripod|dvr|nvr|gopro)\b"),
        ("printers", r"\b(printer|toner|cartridge|inkjet|laserjet|scanner|drum unit)\b"),
        ("smart-home", r"\b(smart lock|smart bulb|video doorbell|smart sensor|home automation)\b"),
        ("storage", r"\b(ssd|hdd|nvme|flash drive|usb drive|micro sd|sd card|memory card|ddr3|ddr4|ddr5|ram memory|external hard|hard disk)\b"),
        ("wearables", r"\b(smartwatch|smart watch|fitbit|garmin watch|apple watch|mi band)\b")
    ]

    # Special smartphone exclusions/inclusions
    phone_include = r"phone case|screen protector|phone holder"
    phone_exclude = r"\bcorded\b|\bcordless\b|\blandline\b|\bdesk phone\b"

    # 3. Read Accessories
    products = c.execute("SELECT id, title, slug, sourceUrl FROM Product WHERE categoryId = ?", (acc_id,)).fetchall()
    
    moves = []
    stats = {}

    for p in products:
        haystack = f"{p['title']} {p['slug']} {p['sourceUrl'] or ''}".lower()
        
        target_slug = None
        for slug, pattern in rules:
            if re.search(pattern, haystack):
                # Extra check for smartphones
                if slug == "smartphones":
                    if re.search(phone_exclude, haystack):
                        continue
                target_slug = slug
                break
            
            # Additional check for smartphones patterns
            if slug == "smartphones" and re.search(phone_include, haystack):
                if not re.search(phone_exclude, haystack):
                    target_slug = "smartphones"
                    break
        
        if target_slug and target_slug != "accessories":
            moves.append((categories[target_slug], p["id"], p["title"], target_slug))
            stats[target_slug] = stats.get(target_slug, 0) + 1

    # 4. Dry run stats
    print("Dry-run moved count by target:")
    for slug, count in stats.items():
        print(f"  {slug}: {count}")

    # 5. Apply updates
    if moves:
        c.executemany("UPDATE Product SET categoryId = ? WHERE id = ?", [(m[0], m[1]) for m in moves])
        conn.commit()
        print(f"\nTotal rows moved: {len(moves)}")
    else:
        print("\nNo rows to move.")

    # 6. Remaining
    rem = c.execute("SELECT COUNT(*) FROM Product WHERE categoryId = ?", (acc_id,)).fetchone()[0]
    print(f"Remaining accessories count: {rem}")

    # 7. Sample
    if moves:
        print("\nSample 5 moved rows:")
        for m in moves[:5]:
            print(f"  - {m[2][:50]}... -> {m[3]}")

    conn.close()

reclassify()
