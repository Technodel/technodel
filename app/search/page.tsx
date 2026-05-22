import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ShopClient from "@/app/shop/ShopClient";

export const revalidate = 60;

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string>> }): Promise<Metadata> {
  const sp = await searchParams;
  const q = sp.q || "";
  const title = q ? `Search results for "${q}" – Technodel Lebanon` : "Search Products – Technodel Lebanon";
  const description = q ? `Find the best deals on ${q} in Lebanon. Compare prices, read reviews, and buy with fast delivery from Technodel.` : "Search our catalog of 5000+ tech products at Technodel Lebanon.";
  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: "https://technodel.net/new/search" },
    openGraph: {
      title,
      description,
      url: q ? `https://technodel.net/new/search?q=${encodeURIComponent(q)}` : "https://technodel.net/new/search",
      siteName: "Technodel",
      type: "website",
      locale: "en_US",
    },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const page = Math.max(1, parseInt(sp.page || "1"));
  const sort = sp.sort || "popular";
  const limit = 24;

  const where: any = { isVisible: true };
  if (q) where.OR = [
    { title: { contains: q, mode: 'insensitive' } },
    { brand: { contains: q, mode: 'insensitive' } },
    { seoKeywords: { contains: q, mode: 'insensitive' } },
    { shortDescription: { contains: q, mode: 'insensitive' } },
  ];

  const orderBy: any =
    sort === "price_asc" ? { displayPrice: "asc" } :
    sort === "price_desc" ? { displayPrice: "desc" } :
    sort === "newest" ? { createdAt: "desc" } :
    { orderCount: "desc" };

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
        category: { select: { name: true, slug: true } },
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
    return { ...p, imageUrl };
  });

  return (
    <ShopClient
      products={parsedProducts as any}
      total={total}
      pages={Math.ceil(total / limit)}
      page={page}
      categories={categories as any}
      initialFilters={{ sort, featured: false, isNew: false, q, minPrice: 0, maxPrice: 999999 }}
    />
  );
}
