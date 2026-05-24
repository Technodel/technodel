import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { TECH_CATEGORY_SLUGS, technodelSupplierWhere } from "@/lib/catalog-filter";
import ShopClient from "./ShopClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop All Products – Laptops, Smartphones & More | Technodel Lebanon",
  description: "Browse 5000+ tech products at Lebanon's #1 tech store. Shop laptops, smartphones, gaming gear, accessories and more at unbeatable prices with fast delivery.",
  openGraph: {
    title: "Shop All Products – Technodel Lebanon",
    description: "Browse 5000+ tech products at Lebanon's #1 tech store.",
    url: "https://technodel.net/new/shop",
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
  alternates: { canonical: "https://technodel.net/new/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const parsedPage = Number.parseInt(sp.page || "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const sort = sp.sort || "featured";
  const featured = sp.featured === "1";
  const isNew = sp.new === "1";
  const category = sp.category;
  const brand = sp.brand;
  const q = sp.q;
  const minPrice = parseFloat(sp.minPrice || "0");
  const maxPrice = parseFloat(sp.maxPrice || "999999");
  const limit = 24;

  const extraWhere: any = {};
  if (category) extraWhere.category = { slug: category };
  if (brand) extraWhere.brand = { contains: brand };
  if (featured) extraWhere.isFeatured = true;
  if (isNew) extraWhere.isNew = true;
  if (q) extraWhere.OR = [{ title: { contains: q } }, { brand: { contains: q } }];
  if (maxPrice < 999999) extraWhere.displayPrice = { gte: minPrice, lte: maxPrice };

  const where: any = technodelSupplierWhere(extraWhere);

  const facetExtraWhere: any = {};
  if (brand) facetExtraWhere.brand = { contains: brand };
  if (featured) facetExtraWhere.isFeatured = true;
  if (isNew) facetExtraWhere.isNew = true;
  if (q) facetExtraWhere.OR = [{ title: { contains: q } }, { brand: { contains: q } }];
  if (maxPrice < 999999) facetExtraWhere.displayPrice = { gte: minPrice, lte: maxPrice };

  const facetWhere: any = technodelSupplierWhere(facetExtraWhere);

  const orderBy: any =
    sort === "price_asc" ? { displayPrice: "asc" } :
    sort === "price_desc" ? { displayPrice: "desc" } :
    sort === "newest" ? { createdAt: "desc" } :
    sort === "popular" ? { orderCount: "desc" } :
    { featuredOrder: "asc" };

  const [products, total, categories, categoryCounts] = await Promise.all([
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
      where: { isVisible: true, parentId: null, slug: { in: [...TECH_CATEGORY_SLUGS] } },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, icon: true },
    }).catch(() => []),
    prisma.product.groupBy({
      by: ["categoryId"],
      where: facetWhere,
      _count: { _all: true },
    }).catch(() => []),
  ]);

  const categoryCountMap = new Map(categoryCounts.map((row) => [row.categoryId, row._count._all]));
  const parsedCategories = categories
    .map((c) => ({
      ...c,
      _count: { products: categoryCountMap.get(c.id) || 0 },
    }))
    .filter((c) => !brand || c._count.products > 0);

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
    url: `https://technodel.net/new/product/${encodeURIComponent(p.slug)}`,
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
              { "@type": "ListItem", position: 2, name: "Shop", item: "https://technodel.net/new/shop" },
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
            url: "https://technodel.net/new/shop",
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
        categories={parsedCategories as any}
        initialFilters={{ sort, featured, isNew, category, brand, q, minPrice, maxPrice }}
      />
    </>
  );
}
