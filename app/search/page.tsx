import { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { searchProductsWithAi } from "@/lib/ai-search";
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
  const pageRaw = Number.parseInt(sp.page || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const sort = sp.sort || "popular";
  const limit = 24;

  const categoriesPromise = prisma.category.findMany({
    where: { isVisible: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, icon: true, _count: { select: { products: true } } },
  }).catch(() => []);

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc" ? { displayPrice: "asc" } :
    sort === "price_desc" ? { displayPrice: "desc" } :
    sort === "newest" ? { createdAt: "desc" } :
    { orderCount: "desc" };

  let parsedProducts: Array<{
    id: string;
    slug: string;
    title: string;
    brand: string | null;
    displayPrice: number;
    comparePrice: number | null;
    imageUrl: string;
    isNew: boolean;
    isFeatured: boolean;
    stock: number;
    lowStockThresh: number;
    category: { name: string; slug: string };
  }> = [];
  let total = 0;

  if (q) {
    const ai = await searchProductsWithAi({ q, page, limit, sort }).catch(() => null);
    if (ai) {
      parsedProducts = ai.results;
      total = ai.total;
    } else {
      const where = {
        isVisible: true,
        OR: [
          { title: { contains: q } },
          { brand: { contains: q } },
          { seoKeywords: { contains: q } },
          { shortDescription: { contains: q } },
        ],
      };

      const [products, fallbackTotal] = await Promise.all([
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
        }),
        prisma.product.count({ where }),
      ]).catch(() => [[], 0] as const);

      parsedProducts = products.map((p) => {
        let imageUrl = "";
        try { imageUrl = JSON.parse(p.images)[0] || ""; } catch {}
        return { ...p, imageUrl };
      });
      total = fallbackTotal;
    }
  } else {
    const [products, defaultTotal] = await Promise.all([
      prisma.product.findMany({
        where: { isVisible: true },
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
      }),
      prisma.product.count({ where: { isVisible: true } }),
    ]).catch(() => [[], 0] as const);

    parsedProducts = products.map((p) => {
      let imageUrl = "";
      try { imageUrl = JSON.parse(p.images)[0] || ""; } catch {}
      return { ...p, imageUrl };
    });
    total = defaultTotal;
  }

  const categories = await categoriesPromise;

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
