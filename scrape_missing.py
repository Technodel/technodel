import sqlite3, json, re, urllib.parse, sys, time, urllib.request

DB_PATH = '/var/www/technodel.net/new/prisma/dev.db'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

def get_html(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        with urllib.request.urlopen(req, timeout=12) as response:
            return response.read().decode('utf-8', errors='ignore')
    except: return None

def scrape_image(url):
    html_content = get_html(url)
    if not html_content: return None
    
    # Try og:image first
    m = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', html_content)
    if not m: m = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', html_content)
    
    candidates = []
    if m: candidates.append(m.group(1))
    
    # Try structured image data
    candidates += re.findall(r'"image":\s*"(http[^"]+)"', html_content)
    
    # Try all reasonable img tags
    imgs = re.findall(r'<img[^>]+(?:src|data-src|data-lazy-src)=["\']([^"\']+)["\']', html_content)
    candidates += imgs
    
    for c in candidates:
        full_url = urllib.parse.urljoin(url, c)
        parsed = urllib.parse.urlparse(full_url)
        host = parsed.netloc.lower()
        if host and 'pacmax.me' not in host and any(full_url.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp']):
            return full_url
            
    # Fallback to first non-pacmax URL if no extension match
    for c in candidates:
        full_url = urllib.parse.urljoin(url, c)
        if 'http' in full_url and 'pacmax.me' not in full_url:
            return full_url
    return None

try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Fetch targets: logo or empty
    targets = cursor.execute("SELECT id, title, sourceUrl FROM Product WHERE ogImage='/new/logo.png' OR images IS NULL OR images='' OR images='[]'").fetchall()
    print(f"Scraping {len(targets)} targets...")
    
    updates = []
    for pid, title, surl in targets:
        if not surl or 'http' not in surl: continue
        
        # Rate limit slightly
        time.sleep(0.5)
        img = scrape_image(surl)
        if img:
            updates.append((json.dumps([img]), img, pid))
            print(f"Found image for {pid}: {img[:60]}...")
            if len(updates) >= 50: break # Process in batches or limit for now

    if updates:
        cursor.executemany("UPDATE Product SET images=?, ogImage=? WHERE id=?", updates)
        conn.commit()
        print(f"Updated {len(updates)} products via scraping.")
    else:
        print("No images found via scraping.")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
