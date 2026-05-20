import { prisma } from "@/lib/prisma";
import HomeClientAr from "@/components/ar/HomeClientAr";

export const revalidate = 300;

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
  const [featured, categories, banners, newArrivals] = await Promise.all([
    prisma.product.findMany({
      where: { isVisible: true, isFeatured: true },
      include: {
        category: { select: { name: true } },
        competitor: { select: { name: true, url: true } },
      },
      orderBy: { featuredOrder: "asc" },
      take: 8,
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
      include: {
        category: { select: { name: true } },
        competitor: { select: { name: true, url: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
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
