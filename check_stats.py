import sqlite3, json, urllib.parse
DB='/var/www/technodel.net/new/prisma/dev.db'
conn=sqlite3.connect(DB); c=conn.cursor()
empty=c.execute("SELECT COUNT(*) FROM Product WHERE images IS NULL OR images='' OR images='[]'").fetchone()[0]
logo=c.execute("SELECT COUNT(*) FROM Product WHERE ogImage='/new/logo.png'").fetchone()[0]
pac=0
for (im,) in c.execute("SELECT images FROM Product"):
    try:
        arr=json.loads(im or '[]'); fi=arr[0] if isinstance(arr,list) and arr else ''
        if 'pacmax.me' in urllib.parse.urlparse(fi).netloc.lower(): pac+=1
    except: pass
print(f'empty_images_count: {empty}')
print(f'logo_first_image_count: {logo}')
print(f'pacmax_first_image_count: {pac}')
conn.close()
