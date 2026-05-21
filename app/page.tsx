import { prisma } from "@/lib/prisma";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

const SECTION_POOL_SIZE = 24;

function randomSkip(total: number, take: number) {
  if (total <= take) return 0;
  return Math.floor(Math.random() * (total - take + 1));
}

export default async function HomePage() {
  const [featuredTotal, newArrivalsTotal, dealsTotal] = await Promise.all([
    prisma.product.count({ where: { isVisible: true } }).catch(() => 0),
    prisma.product.count({ where: { isVisible: true, isNew: true } }).catch(() => 0),
    prisma.product.count({ where: { isVisible: true, comparePrice: { not: null } } }).catch(() => 0),
  ]);

  const [featured, categories, banners, newArrivals, deals] = await Promise.all([
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
        sourcePrice: true,
        category: { select: { name: true } },
        competitor: { select: { name: true, url: true } },
      },
      orderBy: { orderCount: "desc" },
      skip: randomSkip(featuredTotal, SECTION_POOL_SIZE),
      take: SECTION_POOL_SIZE,
    }).catch(() => []),
    prisma.category.findMany({
      where: { isVisible: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      take: 12,
    }).catch(() => []),
    prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 5,
    }).catch(() => []),
    prisma.product.findMany({
      where: { isVisible: true, isNew: true },
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
      orderBy: { createdAt: "desc" },
      skip: randomSkip(newArrivalsTotal, SECTION_POOL_SIZE),
      take: SECTION_POOL_SIZE,
    }).catch(() => []),
    prisma.product.findMany({
      where: {
        isVisible: true,
        comparePrice: { not: null },
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
      skip: randomSkip(dealsTotal, SECTION_POOL_SIZE),
      take: SECTION_POOL_SIZE,
    }).catch(() => []),
  ]);

  return (
    <HomeClient
      featured={JSON.parse(JSON.stringify(featured))}
      categories={JSON.parse(JSON.stringify(categories))}
      banners={JSON.parse(JSON.stringify(banners))}
      newArrivals={JSON.parse(JSON.stringify(newArrivals))}
      deals={JSON.parse(JSON.stringify(deals))}
    />
  );
}
