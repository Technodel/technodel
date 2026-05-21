import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ShopClient from "./ShopClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop All Products – Laptops, Smartphones & More | Technodel Lebanon",
  description: "Browse 5000+ tech products at Lebanon's #1 tech store. Shop laptops, smartphones, gaming gear, accessories and more at unbeatable prices with fast delivery.",
  openGraph: {
    title: "Shop All Products – Technodel Lebanon",
    description: "Browse 5000+ tech products at Lebanon's #1 tech store.",
    url: "https://technodel.net/shop",
    siteName: "Technodel",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop All Products – Technodel Lebanon",
    description: "Browse 5000+ tech products at Lebanon's #1 tech store.",
  },
  alternates: { canonical: "https://technodel.net/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const page = parseInt(sp.page || "1");
  const sort = sp.sort || "featured";
  const featured = sp.featured === "1";
  const isNew = sp.new === "1";
  const category = sp.category;
  const brand = sp.brand;
  const q = sp.q;
  const minPrice = parseFloat(sp.minPrice || "0");
  const maxPrice = parseFloat(sp.maxPrice || "999999");
  const limit = 24;

  const where: any = { isVisible: true };
  if (category) where.category = { slug: category };
  if (brand) where.brand = { contains: brand };
  if (featured) where.isFeatured = true;
  if (isNew) where.isNew = true;
  if (q) where.OR = [{ title: { contains: q } }, { brand: { contains: q } }];
  if (maxPrice < 999999) where.displayPrice = { gte: minPrice, lte: maxPrice };

  const orderBy: any =
    sort === "price_asc" ? { displayPrice: "asc" } :
    sort === "price_desc" ? { displayPrice: "desc" } :
    sort === "newest" ? { createdAt: "desc" } :
    sort === "popular" ? { orderCount: "desc" } :
    { featuredOrder: "asc" };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        brand: true,
        displayPrice: true,
        comparePrice: true,
        images: true,
        isNew: true,
        isFeatured: true,
        stock: true,
        lowStockThresh: true,
        sourcePrice: true,
        category: { select: { name: true, slug: true } },
        competitor: { select: { name: true, url: true } },
      },
      orderBy,
      take: limit,
      skip: (page - 1) * limit,
    }).catch(() => []),
    prisma.product.count({ where }).catch(() => 0),
    prisma.category.findMany({
      where: { isVisible: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, icon: true },
    }).catch(() => []),
  ]);

  const parsedProducts = products.map((p) => {
    let imageUrl = "";
    try { imageUrl = JSON.parse(p.images)[0] || ""; } catch {}
    const { competitor, ...rest } = p;
    return {
      ...rest,
      imageUrl,
      competitor: competitor ? { name: competitor.name, url: competitor.url } : null,
      competitorPrice: p.sourcePrice || null,
    };
  });

  // JSON-LD: BreadcrumbList + ItemList
  const itemListElements = parsedProducts.slice(0, 100).map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `https://technodel.net/product/${p.slug}`,
    name: p.title,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://technodel.net" },
              { "@type": "ListItem", position: 2, name: "Shop", item: "https://technodel.net/shop" },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Shop All Products – Technodel Lebanon",
            description: "Browse our full catalog of tech products at Lebanon's #1 tech store.",
            url: "https://technodel.net/shop",
            numberOfItems: total,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: itemListElements,
            },
          }),
        }}
      />
      <ShopClient
        products={parsedProducts}
        total={total}
        pages={Math.ceil(total / limit)}
        page={page}
        categories={categories as any}
        initialFilters={{ sort, featured, isNew, category, brand, q, minPrice, maxPrice }}
      />
    </>
  );
}
