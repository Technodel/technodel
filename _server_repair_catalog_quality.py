import json
import os
import re
import sqlite3
from urllib.parse import urlparse, unquote

TECHNODEL_DB = os.getenv('TECHNODEL_DB', '/var/www/technodel.net/new/prisma/dev.db')
ALLMALL_DB = os.getenv('ALLMALL_DB', '/var/www/all-mall/dev.db')
DRY_RUN = os.getenv('DRY_RUN', 'false').lower() == 'true'

MOJIBAKE = [
    ('â€”', '-'),
    ('â€“', '-'),
    ('—', '-'),
    ('–', '-'),
    ('â€˜', "'"),
    ('â€™', "'"),
    ('â€œ', '"'),
    ('â€�', '"'),
    ('Â', ''),
    ('&#8211;', '-'),
    ('&#8212;', '-'),
    ('&#x2013;', '-'),
    ('&#x2014;', '-'),
    ('&amp;', '&'),
    ('&quot;', '"'),
]


def clean_text(v):
    t = str(v or '')
    for a, b in MOJIBAKE:
        t = t.replace(a, b)
    t = re.sub(r'\s+', ' ', t).strip()
    return t


def title_from_source_url(source_url):
    s = str(source_url or '').strip()
    if not s:
        return ''
    try:
        path = urlparse(s).path.strip('/')
        if not path:
            return ''
        last = unquote(path.split('/')[-1])
        last = re.sub(r'\.(html?|php)$', '', last, flags=re.I)
        last = last.replace('_', ' ').replace('-', ' ')
        last = re.sub(r'\b(8211|8212|x2013|x2014)\b', '-', last, flags=re.I)
        last = re.sub(r'\s+', ' ', last).strip()
        if not last:
            return ''

        words = []
        keep_upper = {'USB', 'HDMI', 'SSD', 'HDD', 'RGB', 'IPS', 'FHD', 'QHD', '4K', '5K'}
        for w in last.split(' '):
            uw = w.upper()
            if uw in keep_upper:
                words.append(uw)
            elif re.match(r'^[A-Z0-9-]{1,4}$', w):
                words.append(uw)
            else:
                words.append(w[:1].upper() + w[1:].lower())
        return ' '.join(words)
    except Exception:
        return ''


def canonical_title(title, brand, source_url):
    t = clean_text(title)
    b = clean_text(brand)
    generic = (not t) or len(t) < 4 or t.lower() in {'product', 'item', 'untitled'} or (b and t.lower() == b.lower())
    if generic:
        inferred = title_from_source_url(source_url)
        if inferred:
            t = inferred
    return clean_text(t or 'Product')


def canonical_short(title):
    return f"{title} - Available at Technodel Lebanon with warranty."


def canonical_description(existing, title):
    d = clean_text(existing)
    if len(d) >= 80:
        return d
    return f"<p>{title}.</p><p>Available at Technodel Lebanon with warranty and fast delivery across Lebanon.</p>"


def parse_first_image(raw):
    if raw is None:
        return ''
    t = str(raw).strip()
    if not t:
        return ''
    try:
        j = json.loads(t)
        if isinstance(j, list):
            return str(j[0]).strip() if j else ''
    except Exception:
        pass
    parts = [p.strip() for p in re.split(r'[\n,;|]+', t) if p.strip()]
    return parts[0] if parts else ''


def get_source_domain(url):
    try:
        return urlparse(str(url or '')).netloc.lower().replace('www.', '')
    except Exception:
        return ''


def build_allmall_image_map():
    m = {}
    if not ALLMALL_DB:
        return m
    src = sqlite3.connect(ALLMALL_DB)
    src.row_factory = sqlite3.Row
    c = src.cursor()
    rows = c.execute(
        """
        SELECT sourceId, sourceUrl, imageUrls
        FROM Product
        WHERE (sourceUrl IS NOT NULL AND TRIM(sourceUrl) <> '')
           OR (sourceId IS NOT NULL AND TRIM(sourceId) <> '')
        """
    ).fetchall()
    for r in rows:
        img = parse_first_image(r['imageUrls'])
        if not img:
            continue
        sid = clean_text(r['sourceId']).lower()
        surl = clean_text(r['sourceUrl']).lower()
        if sid and sid not in m:
            m[sid] = img
        if surl and surl not in m:
            m[surl] = img
    src.close()
    return m


def main():
    allmall_img = build_allmall_image_map()

    db = sqlite3.connect(TECHNODEL_DB)
    db.row_factory = sqlite3.Row
    c = db.cursor()

    rows = c.execute(
        """
        SELECT id, title, brand, shortDescription, description, seoTitle, seoDescription,
               sourceId, sourceUrl, images
        FROM Product
        """
    ).fetchall()

    updated_copy = 0
    updated_images = 0

    for r in rows:
        pid = r['id']
        source_url = clean_text(r['sourceUrl'])
        source_id = clean_text(r['sourceId']).lower()

        new_title = canonical_title(r['title'], r['brand'], source_url)
        new_short = canonical_short(new_title)
        new_desc = canonical_description(r['description'], new_title)
        new_seo_title = clean_text(r['seoTitle']) or f"Buy {new_title} in Lebanon | Technodel"
        new_seo_desc = clean_text(r['seoDescription']) or f"{new_title} with fast delivery and warranty in Lebanon."

        if (
            (r['title'] or '') != new_title
            or (r['shortDescription'] or '') != new_short
            or (r['description'] or '') != new_desc
            or (r['seoTitle'] or '') != new_seo_title
            or (r['seoDescription'] or '') != new_seo_desc
        ):
            updated_copy += 1
            if not DRY_RUN:
                c.execute(
                    """
                    UPDATE Product
                    SET title = ?, shortDescription = ?, description = ?, seoTitle = ?, seoDescription = ?, updatedAt = datetime('now')
                    WHERE id = ?
                    """,
                    (new_title, new_short, new_desc, new_seo_title, new_seo_desc, pid),
                )

        source_key_url = source_url.lower()
        target_img = ''
        if source_key_url and source_key_url in allmall_img:
            target_img = allmall_img[source_key_url]
        elif source_id and source_id in allmall_img:
            target_img = allmall_img[source_id]

        if target_img:
            current_img = parse_first_image(r['images'])
            current_domain = get_source_domain(current_img)
            source_domain = get_source_domain(source_url)
            should_replace = (not current_img) or (source_domain and current_domain and current_domain != source_domain)
            if should_replace and current_img != target_img:
                updated_images += 1
                if not DRY_RUN:
                    c.execute(
                        "UPDATE Product SET images = ?, updatedAt = datetime('now') WHERE id = ?",
                        (json.dumps([target_img]), pid),
                    )

    if not DRY_RUN:
        db.commit()

    print('TOTAL_PRODUCTS', len(rows))
    print('UPDATED_COPY', updated_copy)
    print('UPDATED_IMAGES', updated_images)
    print('DRY_RUN', DRY_RUN)

    db.close()


if __name__ == '__main__':
    main()
