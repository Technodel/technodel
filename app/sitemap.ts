import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://technodel.net";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/cart`, lastModified: new Date(), changeFrequency: "never", priority: 0.3 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/warranty`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/returns`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];

  // Blog posts
  const blogPosts: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/blog/best-gaming-laptops-lebanon-2026`, lastModified: new Date("2026-05-15"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog/laptop-buying-guide-lebanon-2026`, lastModified: new Date("2026-05-10"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog/iphone-vs-samsung-lebanon-2026`, lastModified: new Date("2026-05-05"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog/build-gaming-pc-lebanon-budget`, lastModified: new Date("2026-04-28"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/blog/tech-accessories-everyone-needs-2026`, lastModified: new Date("2026-04-20"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/blog/networking-guide-home-office-lebanon`, lastModified: new Date("2026-04-15"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/blog/best-laptop-under-1000-lebanon`, lastModified: new Date("2026-05-18"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog/iphone-price-lebanon-2026`, lastModified: new Date("2026-05-16"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog/budget-gaming-pc-build-lebanon`, lastModified: new Date("2026-05-14"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog/best-printer-home-office-lebanon`, lastModified: new Date("2026-05-12"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/blog/best-smartphones-under-500-lebanon`, lastModified: new Date("2026-05-08"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog/macbook-price-lebanon-2026`, lastModified: new Date("2026-05-06"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog/home-networking-setup-lebanon`, lastModified: new Date("2026-05-03"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/blog/best-tablet-students-lebanon`, lastModified: new Date("2026-04-25"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/blog/best-gaming-chair-lebanon`, lastModified: new Date("2026-04-18"), changeFrequency: "monthly", priority: 0.6 },
  ];

  // Dynamic categories
  let categories: MetadataRoute.Sitemap = [];
  try {
    const cats = await prisma.category.findMany({
      where: { isVisible: true },
      select: { slug: true, updatedAt: true },
    });
    categories = cats.map((cat) => ({
      url: `${baseUrl}/shop/${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Gracefully degrade if DB unavailable
  }

  // Dynamic products (high priority — these are the ranking pages)
  let products: MetadataRoute.Sitemap = [];
  try {
    const prods = await prisma.product.findMany({
      where: { isVisible: true },
      select: { slug: true, updatedAt: true, viewCount: true, orderCount: true },
      orderBy: [{ orderCount: "desc" }, { viewCount: "desc" }],
    });
    products = prods.map((p) => {
      // Higher priority for popular products
      const popularity = Math.min(p.orderCount / 10 + p.viewCount / 500, 1);
      const priority = Math.max(0.5, 0.6 + popularity * 0.3);
      return {
        url: `${baseUrl}/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: parseFloat(priority.toFixed(1)),
      };
    });
  } catch {
    // Gracefully degrade
  }

  return [...staticPages, ...categories, ...products, ...blogPosts];
}
