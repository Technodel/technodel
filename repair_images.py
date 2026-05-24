import sqlite3, json, re, urllib.request, urllib.parse, html, sys
from collections import Counter
DB='/var/www/technodel.net/new/prisma/dev.db'
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
def first_image(images):
    try:
        arr=json.loads(images or '[]')
        return arr[0] if isinstance(arr,list) and arr else ''
    except: return ''
def first_host(images):
    u=first_image(images)
    try: return urllib.parse.urlparse(u).netloc.lower()
    except: return ''
def fetch(url, timeout=12):
    req=urllib.request.Request(url, headers={'User-Agent':UA,'Accept':'text/html,application/xhtml+xml'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode('utf-8','ignore')
def is_image_ok(url, timeout=8):
    if not url or not url.startswith('http'): return False
    try:
        req=urllib.request.Request(url, headers={'User-Agent':UA,'Accept':'image/*,*/*;q=0.8'})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            ct=(r.headers.get('Content-Type') or '').lower()
            return r.status==200 and ct.startswith('image/')
    except Exception:
        return False
def extract(page, base):
    out=[]
    pats=[
      r'property=["\'](?:og:image|twitter:image)["\']\s+content=["\']([^"\']+)["\']',
      r'content=["\']([^"\']+)["\']\s+property=["\'](?:og:image|twitter:image)["\']',
      r'"image"\s*:\s*"(http[^"]+)"',
      r'<img[^>]+(?:src|data-src|data-lazy-src)=["\']([^"\']+)["\']'
    ]
    for p in pats:
        out.extend(re.findall(p, page, flags=re.I))
    seen=set(); cand=[]
    for u in out:
        u=html.unescape((u or '').strip())
        if not u: continue
        full=urllib.parse.urljoin(base,u)
        if not full.startswith('http'): continue
        if full in seen: continue
        seen.add(full)
        cand.append(full)
    return cand
try:
    conn=sqlite3.connect(DB)
    c=conn.cursor()
    rows=c.execute("SELECT id,title,sourceUrl,images FROM Product WHERE ogImage='/new/logo.png' OR images LIKE '%/new/logo.png%' OR images='[]' OR images IS NULL OR images=''").fetchall()
    pool={}
    for t,imgs in c.execute("SELECT title,images FROM Product WHERE title IS NOT NULL AND title!='' AND images IS NOT NULL AND images!='' AND images!='[]'"):
        fi=first_image(imgs)
        h=first_host(imgs)
        if fi and fi!='/new/logo.png' and 'pacmax.me' not in h and t not in pool:
            pool[t]=fi
    targets=len(rows)
    scraped, dup, unchanged = 0, 0, 0
    reasons=Counter()
    updates=[]
    for pid,title,surl,imgs in rows:
        updated=False
        if surl and surl.startswith('http'):
            try:
                page=fetch(surl)
                found = extract(page,surl)
                for u in found:
                    if 'pacmax.me' in urllib.parse.urlparse(u).netloc.lower():
                        continue
                    if is_image_ok(u):
                        updates.append((json.dumps([u]),u,pid))
                        scraped+=1
                        updated=True
                        break
                if not updated:
                    reasons['scrape_no_valid_image']+=1
            except Exception:
                reasons['scrape_fetch_failed']+=1
        else:
            reasons['missing_or_bad_sourceUrl']+=1
        if (not updated) and title and title in pool:
            u=pool[title]
            updates.append((json.dumps([u]),u,pid))
            dup+=1
            updated=True
        if not updated:
            unchanged+=1
    if updates:
        c.executemany("UPDATE Product SET images=?, ogImage=? WHERE id=?", updates)
        conn.commit()
    logo_count=c.execute("SELECT COUNT(*) FROM Product WHERE ogImage='/new/logo.png' OR images LIKE '%/new/logo.png%'").fetchone()[0]
    empty_count=c.execute("SELECT COUNT(*) FROM Product WHERE images IS NULL OR images='' OR images='[]'").fetchone()[0]
    pac=0
    c2=conn.cursor()
    for (im,) in c2.execute("SELECT images FROM Product"):
        h=first_host(im)
        if 'pacmax.me' in h: pac+=1
    total=c.execute("SELECT COUNT(*) FROM Product").fetchone()[0]
    print('targets',targets)
    print('scraped_success',scraped)
    print('duplicate_success',dup)
    print('total_updated',len(updates))
    print('unchanged',unchanged)
    print('logo_first_image_count',logo_count)
    print('empty_images_count',empty_count)
    print('pacmax_first_image_count',pac)
    print('total_products_count',total)
    print('top_reasons', dict(reasons.most_common(5)))
    print('unresolved_samples:')
    for r in c.execute("SELECT id,title,COALESCE(sourceUrl,'NO_URL') FROM Product WHERE ogImage='/new/logo.png' LIMIT 5").fetchall():
        print(f"{r[0]} | {(r[1] or '')[:60]} | {r[2]}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)