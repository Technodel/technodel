import sqlite3, json, re, urllib.parse, sys
from collections import defaultdict

TD_DB='/var/www/technodel.net/new/prisma/dev.db'
AM_DB='/var/www/all-mall/dev.db'

def first_image(images):
    try:
        arr=json.loads(images or '[]')
        return arr[0] if isinstance(arr,list) and arr else ''
    except:
        return ''

def parse_images(images):
    try:
        arr=json.loads(images or '[]')
        if isinstance(arr,list):
            return [x for x in arr if isinstance(x,str) and x.strip()]
    except:
        return []

def host(url):
    try: return urllib.parse.urlparse(url).netloc.lower()
    except: return ''

def norm(s):
    return re.sub(r'\s+',' ', (s or '').strip().lower())

def tokens(s):
    return re.findall(r'[a-z0-9]+(?:-[a-z0-9]+)?', (s or '').lower())

def strong_tokens(s):
    out=[]
    for t in tokens(s):
        if len(t)>=4 and (any(c.isdigit() for c in t) or '-' in t):
            out.append(t)
    return out

def jacc(a,b):
    A=set(a); B=set(b)
    if not A or not B: return 0.0
    return len(A&B)/len(A|B)

try:
    td=sqlite3.connect(TD_DB); tdc=td.cursor()
    am=sqlite3.connect(AM_DB); amc=am.cursor()

    targets=[]
    for pid,title,brand,cat,surl,imgs,og in tdc.execute('SELECT id,title,brand,categoryId,sourceUrl,images,ogImage FROM Product'):
        fi=first_image(imgs)
        if og=='/new/logo.png' or fi=='/new/logo.png' or not fi:
            targets.append({
                'id':pid,'title':title or '', 'brand':(brand or '').strip().lower(), 'cat':cat,
                'surl':surl or '', 'title_norm':norm(title), 'tok':set(tokens(title)), 'strong':set(strong_tokens(title))
            })

    cand=[]
    for pid,title,brand,cat,imgs in tdc.execute('SELECT id,title,brand,categoryId,images FROM Product WHERE images IS NOT NULL AND images!=\'\' AND images!=\'[]\''):
        fi=first_image(imgs)
        h=host(fi)
        if fi and fi!='/new/logo.png' and 'pacmax.me' not in h:
            cand.append({'img':fi,'title':title or '', 'brand':(brand or '').strip().lower(), 'cat':cat,
                         'title_norm':norm(title), 'tok':set(tokens(title)), 'strong':set(strong_tokens(title))})

    for title,brand,srcCat,imageUrls in amc.execute('SELECT title,brand,sourceCategory,imageUrls FROM Product WHERE imageUrls IS NOT NULL AND imageUrls!=\'\' AND imageUrls!=\'[]\''):
        imgs=parse_images(imageUrls)
        fi=''
        for u in imgs:
            if u and host(u) and ('pacmax.me' not in host(u)):
                fi=u; break
        if not fi: continue
        cand.append({'img':fi,'title':title or '', 'brand':(brand or '').strip().lower(), 'cat':None,
                     'title_norm':norm(title), 'tok':set(tokens(title)), 'strong':set(strong_tokens(title))})

    by_title=defaultdict(list)
    by_brand_title=defaultdict(list)
    by_brand=defaultdict(list)
    for c in cand:
        by_title[c['title_norm']].append(c)
        if c['brand']:
            by_brand[c['brand']].append(c)
            by_brand_title[(c['brand'], c['title_norm'])].append(c)

    updates=[]
    exact_brand=exact_title=brand_model=global_model=0

    def pick_best(t, pool, min_score):
        best=None; bs=0.0
        for c in pool:
            so=len(t['strong'] & c['strong'])
            if so==0: continue
            score=so*2.2 + jacc(t['tok'], c['tok'])
            if t['brand'] and c['brand'] and t['brand']==c['brand']: score += 0.8
            if score>bs: bs=score; best=c
        if best and bs>=min_score: return best, bs
        return None, 0.0

    for t in targets:
        p=None
        if t['brand'] and t['title_norm'] and (t['brand'], t['title_norm']) in by_brand_title:
            p=by_brand_title[(t['brand'], t['title_norm'])][0]; exact_brand += 1
        elif t['title_norm'] and t['title_norm'] in by_title:
            p=by_title[t['title_norm']][0]; exact_title += 1
        elif t['brand'] and t['strong']:
            p,_=pick_best(t, by_brand.get(t['brand'], []), 2.2)
            if p: brand_model += 1
        elif t['strong']:
            p,_=pick_best(t, cand, 2.7)
            if p: global_model += 1

        if p:
            updates.append((json.dumps([p['img']]), p['img'], t['id']))

    for i in range(0, len(updates), 100):
        tdc.executemany("UPDATE Product SET images=?, ogImage=? WHERE id=?", updates[i:i+100])
    td.commit()

    remaining=tdc.execute("SELECT COUNT(*) FROM Product WHERE ogImage='/new/logo.png' OR images LIKE '%/new/logo.png%' OR images='[]' OR images IS NULL").fetchone()[0]
    print(f'targets_before: {len(targets)}')
    print(f'updated_exact_brand: {exact_brand}')
    print(f'updated_exact_title: {exact_title}')
    print(f'updated_brand_model: {brand_model}')
    print(f'updated_global_model: {global_model}')
    print(f'total_updated: {len(updates)}')
    print(f'remaining_logo_or_empty: {remaining}')
    
    samples = tdc.execute("SELECT id, title, brand FROM Product WHERE ogImage='/new/logo.png' LIMIT 5").fetchall()
    if samples:
        print("Unresolved samples:")
        for s in samples: print(f"  {s[0]} | {s[1]} | {s[2]}")

    td.close(); am.close()
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
