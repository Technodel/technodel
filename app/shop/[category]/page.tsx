import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ShopClient from "@/app/shop/ShopClient";

interface Props { params: Promise<{ category: string }>; searchParams: Promise<Record<string, string>>; }

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const cat = await prisma.category.findUnique({ where: { slug } }).catch(() => null);
  if (!cat) return { title: "Category Not Found" };
  const title = cat.seoTitle || `${cat.name} – Lebanon's Best Prices | Technodel`;
  const description = cat.seoDescription || `Shop the best ${cat.name} in Lebanon at unbeatable prices. Genuine products, fast delivery, amazing deals on ${cat.name}.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://technodel.net/new/shop/${cat.slug}`,
      siteName: "Technodel",
      type: "website",
      locale: "en_US",
      images: cat.image ? [{ url: cat.image, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://technodel.net/new/shop/${cat.slug}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category: slug } = await params;
  const sp = await searchParams;

  const cat = await prisma.category.findUnique({ where: { slug, isVisible: true } }).catch(() => null);
  if (!cat) notFound();

  const page = Math.max(1, parseInt(sp.page || "1"));
  const sort = sp.sort || "featured";
  const limit = 24;

  const where: any = { isVisible: true, category: { slug } };
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
      select: { id: true, name: true, slug: true, icon: true, _count: { select: { products: true } } },
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
  const itemListElements = parsedProducts.map((p, i) => ({
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
              { "@type": "ListItem", position: 2, name: "Shop", item: "https://technodel.net/shop" },
              { "@type": "ListItem", position: 3, name: cat.name, item: `https://technodel.net/shop/${cat.slug}` },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: itemListElements,
            numberOfItems: total,
            name: `${cat.name} – Technodel Lebanon`,
            description: cat.seoDescription || `Browse the best ${cat.name} at Technodel Lebanon.`,
          }),
        }}
      />
      <ShopClient
        products={parsedProducts as any}
        total={total}
        pages={Math.ceil(total / limit)}
        page={page}
        categories={categories as any}
        initialFilters={{ sort, featured: false, isNew: false, category: slug, minPrice: 0, maxPrice: 999999 }}
      />
    </>
  );
}
