import { prisma } from "@/lib/prisma";
import HomeClientAr from "@/components/ar/HomeClientAr";

export const dynamic = "force-dynamic";

const SECTION_POOL_SIZE = 24;

function randomSkip(total: number, take: number) {
  if (total <= take) return 0;
  return Math.floor(Math.random() * (total - take + 1));
}

const CATEGORY_ARABIC_NAMES: Record<string, string> = {
  smartphones: "هواتف ذكية",
  laptops: "لابتوبات",
  tablets: "أجهزة لوحية",
  gaming: "ألعاب",
  audio: "صوتيات",
  accessories: "إكسسوارات",
  networking: "شبكات",
  cameras: "كاميرات",
  printers: "طابعات",
  "smart-home": "المنزل الذكي",
  wearables: "أجهزة قابلة للارتداء",
  storage: "تخزين",
};

const CATEGORY_ARABIC_ICONS: Record<string, string> = {
  smartphones: "📱",
  laptops: "💻",
  tablets: "📲",
  gaming: "🎮",
  audio: "🎧",
  accessories: "🔌",
  networking: "📡",
  cameras: "📷",
  printers: "🖨️",
  "smart-home": "🏠",
  wearables: "⌚",
  storage: "💾",
};

export default async function ArabicHomePage() {
  const [featuredTotal, newArrivalsTotal] = await Promise.all([
    prisma.product.count({ where: { isVisible: true } }).catch(() => 0),
    prisma.product.count({ where: { isVisible: true, isNew: true } }).catch(() => 0),
  ]);

  const [featured, categories, banners, newArrivals] = await Promise.all([
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
      where: { isActive: true, position: "hero" },
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
  ]);

  const categoriesWithArabic = categories.map((cat) => ({
    ...cat,
    arabicName: CATEGORY_ARABIC_NAMES[cat.slug] || cat.name,
    arabicIcon: CATEGORY_ARABIC_ICONS[cat.slug] || "📦",
  }));

  return (
    <HomeClientAr
      featured={JSON.parse(JSON.stringify(featured))}
      categories={JSON.parse(JSON.stringify(categoriesWithArabic))}
      banners={JSON.parse(JSON.stringify(banners))}
      newArrivals={JSON.parse(JSON.stringify(newArrivals))}
    />
  );
}
