import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductDetail from "./ProductDetail";

export const revalidate = 60;

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } }).catch(() => null);
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

  const product = await prisma.product.findUnique({
    where: { slug, isVisible: true },
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
  }).catch(() => null);

  if (!product) notFound();

  // Related products
  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, isVisible: true, id: { not: product.id } },
    include: {
      category: { select: { name: true } },
      competitor: { select: { name: true, url: true } },
    },
    take: 6,
    orderBy: { orderCount: "desc" },
  }).catch(() => []);

  // Check for actual orders to determine verified purchases
  const verifiedUserIds = product.reviews
    ? new Set(
        (await Promise.all(
          product.reviews.map(async (r) => {
            const order = await prisma.order.findFirst({
              where: {
                userId: r.userId,
                items: { some: { productId: product.id } },
                status: { in: ["delivered", "completed"] },
              },
              select: { id: true },
            }).catch(() => null);
            return order ? r.userId : null;
          })
        )).filter(Boolean) as string[]
      )
    : new Set<string>();

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
