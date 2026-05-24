import sqlite3
import re
from collections import Counter

DB_PATH = "/var/www/technodel.net/new/prisma/dev.db"

STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "with", "for", "to", "from", "by", "of", "is", "are", 
    "was", "were", "with", "for", "with", "without", "this", "that", "these", "those", "it", "its", "up", "down", 
    "under", "over", "etc", "i", "can", "only", "about", "be", "has", "have", "had", "do", "does", "did", "as", 
    "if", "then", "else", "not", "no", "yes", "some", "any", "all", "each", "every", "other", "such", "only", 
    "new", "used", "black", "white", "blue", "red", "green", "silver", "gold"
}

def analyze():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Get Category ID for 'Accessories'
    c.execute("SELECT id FROM Category WHERE name = 'Accessories'")
    res = c.fetchone()
    if not res:
        print("Category 'Accessories' not found")
        return
    acc_id = res[0]

    # 1) Total Accessories count
    c.execute("SELECT COUNT(*) FROM Product WHERE categoryId = ?", (acc_id,))
    total_acc = c.fetchone()[0]
    print(f"Total Accessories: {total_acc}")

    # Fetch titles
    c.execute("SELECT title, id FROM Product WHERE categoryId = ?", (acc_id,))
    products = c.fetchall()

    # 2) Top 120 keyword tokens
    all_tokens = []
    for title, _ in products:
        # Tokenize: alpha-numeric, lowercase
        tokens = re.findall(r'\b[a-z]{2,}\b', title.lower())
        for t in tokens:
            if t not in STOPWORDS and not t.isdigit():
                all_tokens.append(t)
    
    counts = Counter(all_tokens)
    print("\nTop 120 Tokens:")
    top_120 = counts.most_common(120)
    for i in range(0, len(top_120), 5):
        line = ", ".join([f"{k} ({v})" for k, v in top_120[i:i+5]])
        print(line)

    # 3) Misfit patterns
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

    print("\nMisfit Pattern Analysis (Accessories only):")
    for group, pattern in patterns.items():
        matches = []
        regex = re.compile(pattern, re.IGNORECASE)
        for title, pid in products:
            if regex.search(title):
                matches.append(title)
        
        print(f"\n[{group.upper()}] Count: {len(matches)}")
        for m in matches[:10]:
            print(f" - {m}")

    conn.close()

if __name__ == "__main__":
    analyze()
