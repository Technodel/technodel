import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductDetail from "./ProductDetail";

export const revalidate = 60;

interface Props { params: Promise<{ slug: string }> }

function extractSourceProductId(slug: string): string | null {
  const match = slug.match(/(?:^|-)p=(\d+)(?:$|[-_])/i);
  return match?.[1] ?? null;
}

async function findProductBySlugWithFallback(slug: string) {
  const bySlug = await prisma.product.findUnique({ where: { slug } }).catch(() => null);
  if (bySlug) return bySlug;

  const sourceId = extractSourceProductId(slug);
  if (!sourceId) return null;

  return prisma.product.findFirst({
    where: {
      OR: [
        { sourceUrl: { contains: `/p=${sourceId}` } },
        { sourceUrl: { contains: `p=${sourceId}` } },
      ],
    },
    orderBy: { updatedAt: "desc" },
  }).catch(() => null);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProductBySlugWithFallback(slug);
  if (!product) return { title: "Product Not Found" };
  const rawImage = (() => {
    try {
      const imgs = JSON.parse(product.images);
      return imgs[0] || "";
    } catch {
      return "";
    }
  })();
  const ogImage = rawImage
    ? rawImage.startsWith("http")
      ? `https://technodel.net/new/api/img-proxy?url=${encodeURIComponent(rawImage)}`
      : `https://technodel.net/new${rawImage.startsWith("/") ? rawImage : `/${rawImage}`}`
    : "";
  const images = ogImage ? [ogImage] : [];
  const title = product.seoTitle || `${product.title} – Best Price in Lebanon | Technodel`;
  const description = product.seoDescription || product.shortDescription || `Buy ${product.title} at the best price in Lebanon. Genuine product, fast delivery, warranty included.`;
  return {
    title,
    description,
    keywords: product.seoKeywords || `${product.brand || ""}, ${product.title}, buy ${product.title} Lebanon, best price Lebanon`.toLowerCase(),
    alternates: { canonical: `https://technodel.net/new/product/${product.slug}` },
    openGraph: {
      title,
      description,
      url: `https://technodel.net/new/product/${product.slug}`,
      siteName: "Technodel",
      type: "website" as const,
      locale: "en_US",
      images: Array.isArray(images) ? images.map((img: string) => ({ url: img, width: 800, height: 800 })) : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: Array.isArray(images) ? [images[0]].filter(Boolean) : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const sourceId = extractSourceProductId(slug);
  const product = await prisma.product.findFirst({
    where: {
      isVisible: true,
      OR: [
        { slug },
        ...(sourceId
          ? [
              { sourceUrl: { contains: `/p=${sourceId}` } },
              { sourceUrl: { contains: `p=${sourceId}` } },
            ]
          : []),
      ],
    },
    include: {
      category: { select: { name: true, slug: true } },
      variants: true,
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { name: true, id: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      competitor: { select: { id: true, name: true, url: true, logoUrl: true } },
    },
    orderBy: { updatedAt: "desc" },
  }).catch(() => null);

  if (!product) notFound();

  // Related products
  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, isVisible: true, id: { not: product.id } },
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
      category: { select: { name: true } },
      competitor: { select: { name: true, url: true } },
    },
    take: 6,
    orderBy: { orderCount: "desc" },
  }).catch(() => []);

  // Determine verified purchases in one query instead of one query per review.
  const reviewUserIds = Array.from(new Set(product.reviews.map((r) => r.userId).filter(Boolean)));
  const verifiedOrders = reviewUserIds.length > 0
    ? await prisma.order.findMany({
        where: {
          userId: { in: reviewUserIds },
          items: { some: { productId: product.id } },
          status: { in: ["delivered", "completed"] },
        },
        select: { userId: true },
      }).catch(() => [])
    : [];
  const verifiedUserIds = new Set(verifiedOrders.map((o) => o.userId).filter(Boolean) as string[]);

  const parsed = {
    ...product,
    images: (() => { try { return JSON.parse(product.images); } catch { return []; } })(),
    specs: (() => { try { return JSON.parse(product.specs || "[]"); } catch { return []; } })(),
    highlights: (() => { try { return JSON.parse(product.highlights || "[]"); } catch { return []; } })(),
    verifiedUserIds: Array.from(verifiedUserIds),
    competitor: product.competitor || null,
  };

  // JSON-LD: BreadcrumbList
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://technodel.net/new" },
      { "@type": "ListItem", position: 2, name: product.category.name, item: `https://technodel.net/new/shop/${product.category.slug}` },
      { "@type": "ListItem", position: 3, name: product.title, item: `https://technodel.net/new/product/${product.slug}` },
    ],
  };

  // JSON-LD structured data (Product)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.seoDescription || product.shortDescription || undefined,
    sku: product.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    image: parsed.images,
    url: `https://technodel.net/new/product/${product.slug}`,
    category: product.category.name,
    offers: {
      "@type": "Offer",
      price: product.displayPrice,
      priceCurrency: "USD",
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      ...(product.comparePrice ? { wasPrice: product.comparePrice } : {}),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Technodel", url: "https://technodel.net/new" },
      url: `https://technodel.net/new/product/${product.slug}`,
    },
    aggregateRating: product.reviewCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={parsed} related={related} />
    </>
  );
}
