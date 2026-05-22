import { prisma } from "@/lib/prisma";
import HomeClientAr from "@/components/ar/HomeClientAr";

export const dynamic = "force-dynamic";

const SECTION_POOL_SIZE = 24;
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
  "locknlock",
  "lock n lock",
  "lock&lock",
  "food container",
  "food containers",
  "plastic food container",
  "plastic food containers",
  "pool",
  "pools",
  "swimming",
  "kitchen",
  "kitchenware",
  "cookware",
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

function baseCatalogWhere(extra = {}) {
  return {
    isVisible: true,
    images: { not: "[]" },
    category: { slug: { in: TECH_CATEGORY_SLUGS } },
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
    ...extra,
  };
}

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
    prisma.product.count({ where: baseCatalogWhere() }).catch(() => 0),
    prisma.product.count({ where: baseCatalogWhere({ isNew: true }) }).catch(() => 0),
  ]);

  const [featured, categories, banners, newArrivals] = await Promise.all([
    prisma.product.findMany({
      where: baseCatalogWhere(),
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
      where: baseCatalogWhere({ isNew: true }),
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
