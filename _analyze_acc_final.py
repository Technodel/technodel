import sqlite3
import re
from collections import Counter

DB_PATH = "/var/www/technodel.net/new/prisma/dev.db"

STOPWORDS = {"a", "an", "the", "and", "or", "but", "in", "on", "at", "with", "for", "to", "from", "by", "of", "is", "are", "was", "were", "this", "that", "these", "those", "it", "its", "up", "down", "under", "over", "etc", "i", "can", "only", "about", "be", "has", "have", "had", "do", "does", "did", "as", "if", "then", "else", "not", "no", "yes", "some", "any", "all", "each", "every", "other", "such", "new", "used", "black", "white", "blue", "red", "green", "silver", "gold"}

def analyze():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id FROM Category WHERE name = 'Accessories'")
    res = c.fetchone()
    if not res: return
    acc_id = res[0]
    
    c.execute("SELECT title FROM Product WHERE categoryId = ?", (acc_id,))
    titles = [row[0] for row in c.fetchall()]
    print(f"Total: {len(titles)}")
    
    tokens = []
    for t in titles:
        tokens.extend([w for w in re.findall(r"\b[a-z]{2,}\b", t.lower()) if w not in STOPWORDS])
    
    print("\nTop 120 Tokens:")
    top = Counter(tokens).most_common(120)
    for i in range(0, 120, 5):
        print(", ".join([f"{k} ({v})" for k, v in top[i:i+5]]))
        
    patterns = {
        "smartphones": r"phone|iphone|galaxy|xiaomi|redmi|pixel|mobile|smartphone",
        "laptops": r"laptop|notebook|macbook|thinkpad|ideapad|vivobook|chromebook",
        "tablets": r"tablet|ipad|\btab\b|galaxy tab",
        "gaming": r"ps[45]|xbox|nintendo|switch|gaming|joystick|controller",
        "audio": r"headphone|headset|earbud|earphone|speaker|microphone|\bmic\b|airpods",
        "networking": r"router|modem|wifi|wi-fi|access point|mesh|\bswitch\b|cat6|ethernet",
        "cameras": r"camera|webcam|cctv|dvr|nvr|\blens\b|tripod",
        "printers": r"printer|toner|cartridge|\bink\b|scanner",
        "smart-home": r"smart lock|smart bulb|doorbell|ip camera|sensor",
        "storage": r"ssd|hdd|nvme|usb flash|flash drive|micro sd|sd card|memory card|\bram\b|ddr[34]?",
        "wearables": r"smartwatch|smart watch|\bwatch\b|fitbit|garmin"
    }
    
    for group, p in patterns.items():
        regex = re.compile(p, re.IGNORECASE)
        matches = [t for t in titles if regex.search(t)]
        print(f"\n{group.upper()} ({len(matches)}):")
        for m in matches[:10]: print(f" - {m}")
    conn.close()

if __name__ == "__main__": analyze()
