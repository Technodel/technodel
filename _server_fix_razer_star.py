import json
import sqlite3

DB = '/var/www/technodel.net/new/prisma/dev.db'
SLUG = 'razer-razer-star'
TARGET_TITLE = 'Razer StarCraft Mouse'
TARGET_IMAGE = 'https://pacmax.me/wp-content/uploads/2024/12/PERSPECTRRAZER-1.webp'


def first_image(images_raw: str) -> str:
    try:
        imgs = json.loads(images_raw or '[]')
        if isinstance(imgs, list) and imgs:
            return str(imgs[0])
    except Exception:
        pass
    return ''


def main() -> None:
    db = sqlite3.connect(DB)
    db.row_factory = sqlite3.Row
    c = db.cursor()

    row = c.execute(
        """
        SELECT id, slug, title, shortDescription, description, seoTitle, seoDescription,
               images, sourceUrl, sourceId, competitorId
        FROM Product
        WHERE lower(slug) = lower(?)
        LIMIT 1
        """,
        (SLUG,),
    ).fetchone()

    if not row:
        print('NOT_FOUND', SLUG)
        db.close()
        return

    before_img = first_image(row['images'])

    # Keep existing long description (it already describes the mouse correctly)
    # and only normalize identity + image fields.
    new_short = f"{TARGET_TITLE} - Available at Technodel Lebanon with warranty."
    new_seo_title = f"Buy {TARGET_TITLE} in Lebanon | Technodel"
    new_seo_desc = f"{TARGET_TITLE} with fast delivery and warranty in Lebanon."

    pacmax_comp = c.execute(
        "SELECT id FROM Competitor WHERE lower(name) LIKE '%pacmax%' OR lower(url) LIKE '%pacmax%' LIMIT 1"
    ).fetchone()
    competitor_id = pacmax_comp['id'] if pacmax_comp else row['competitorId']

    c.execute(
        """
        UPDATE Product
        SET title = ?,
            shortDescription = ?,
            seoTitle = ?,
            seoDescription = ?,
            images = ?,
            brand = COALESCE(NULLIF(brand, ''), 'Razer'),
            competitorId = ?,
            updatedAt = datetime('now')
        WHERE id = ?
        """,
        (
            TARGET_TITLE,
            new_short,
            new_seo_title,
            new_seo_desc,
            json.dumps([TARGET_IMAGE]),
            competitor_id,
            row['id'],
        ),
    )

    db.commit()

    after = c.execute(
        "SELECT id, slug, title, shortDescription, seoTitle, seoDescription, images, competitorId FROM Product WHERE id = ?",
        (row['id'],),
    ).fetchone()

    print('FIXED_ID', row['id'])
    print('BEFORE_TITLE', row['title'])
    print('AFTER_TITLE', after['title'])
    print('BEFORE_IMAGE', before_img)
    print('AFTER_IMAGE', first_image(after['images']))
    print('COMPETITOR_ID', after['competitorId'])

    db.close()


if __name__ == '__main__':
    main()
