import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/product/ProductCard";

const TECH_CATEGORY_SLUGS = [
  "smartphones",
  "laptops",
  "tablets",
  "gaming",
  "audio",
  "accessories",
  "networking",
  "cameras",
  "printers",
  "smart-home",
  "wearables",
  "storage",
];

const NON_TECH_TITLE_TERMS = [
  "pencil bag",
  "pencil case",
  "sport bag",
  "sports bag",
  "backpack",
  "zippers",
  "zipper",
  "cat food",
  "dog food",
  "reptile",
  "tissue",
  "liquid liner",
  "coffee",
  "espresso",
  "hazelnut syrup",
  "syrup",
  "pods",
  "decaf",
  "filter paper",
  "capsule machine",
  "coffee machine",
];

const ALLOWED_SUPPLIER_TERMS = [
  "ayoub",
  "ezone",
  "pacmax",
  "comparts",
  "jak",
  "jimmy",
  "electroslab",
  "electroslob",
];

const BLOCKED_IMAGE_HOST_TERMS = [
  "pacmax.me",
  "/new/logo.png",
  "/placeholder.png",
];

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Hot Deals & Discounts – Best Tech Prices in Lebanon | Technodel",
  description: "Find the hottest tech deals in Lebanon! Discounted laptops, smartphones, gaming gear and accessories. Limited-time offers with fast delivery across Lebanon.",
  openGraph: {
    title: "Hot Deals & Discounts – Technodel Lebanon",
    description: "Find the hottest tech deals in Lebanon! Discounted laptops, smartphones, gaming gear.",
    url: "https://technodel.net/new/deals",
    siteName: "Technodel",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hot Deals & Discounts – Technodel Lebanon",
    description: "Find the hottest tech deals in Lebanon!",
  },
  alternates: { canonical: "https://technodel.net/new/deals" },
};

export default async function DealsPage() {
  // Fetch products with comparePrice (on sale)
  const dealProducts = await prisma.product.findMany({
    where: {
      isVisible: true,
      images: { not: "[]" },
      category: { slug: { in: TECH_CATEGORY_SLUGS } },
      comparePrice: { not: null },
      displayPrice: { lt: prisma.product.fields.comparePrice as any },
      AND: [
        { images: { not: "" } },
        ...BLOCKED_IMAGE_HOST_TERMS.map((term) => ({ images: { not: { contains: term } } })),
        ...NON_TECH_TITLE_TERMS.map((term) => ({ title: { not: { contains: term } } })),
        {
          OR: [
            ...ALLOWED_SUPPLIER_TERMS.map((term) => ({ sourceUrl: { contains: term } })),
            ...ALLOWED_SUPPLIER_TERMS.map((term) => ({ competitor: { name: { contains: term } } })),
            ...ALLOWED_SUPPLIER_TERMS.map((term) => ({ competitor: { url: { contains: term } } })),
          ],
        },
      ],
    },
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
    orderBy: { orderCount: "desc" },
    take: 24,
  }).catch(() => []);

  // Parse product data for the client
  const parsedDeals = dealProducts.map((p) => ({
    ...p,
    // Keep images as JSON string for ProductCard to parse
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
              { "@type": "ListItem", position: 1, name: "Home", item: "https://technodel.net/new" },
              { "@type": "ListItem", position: 2, name: "Deals", item: "https://technodel.net/new/deals" },
            ],
          }),
        }}
      />
      <div style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 99, background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.2)", marginBottom: 16 }}>
            <span style={{ fontSize: 14 }}>🔥</span>
            <span style={{ fontSize: 12, color: "#ff6b6b", fontWeight: 700 }}>Limited Time Offers</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, letterSpacing: "-0.5px", marginBottom: 12 }}>
            Hot Deals & Discounts
          </h1>
          <p style={{ fontSize: 16, color: "var(--c-muted)", maxWidth: 600, lineHeight: 1.7 }}>
            Grab the best tech deals in Lebanon. Prices drop fast — grab your favorite gear before it&apos;s gone!
          </p>
        </div>

        {/* Deal products grid */}
        {parsedDeals.length > 0 ? (
          <div className="products-grid">
            {parsedDeals.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  ...p,
                  isOnSale: true,
                  category: p.category,
                  competitor: p.competitor || null,
                  competitorPrice: p.sourcePrice || null,
                } as any}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 24px", background: "var(--c-surface)", borderRadius: "var(--r-lg)", border: "1px dashed var(--c-border)" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🏷️</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>No active deals right now</h2>
            <p style={{ color: "var(--c-muted)", marginBottom: 20, fontSize: 15 }}>
              New deals are coming soon! Check back later or browse our full catalog.
            </p>
            <Link href="/shop" className="btn btn-primary">Browse Shop →</Link>
          </div>
        )}
      </div>
    </>
  );
}
