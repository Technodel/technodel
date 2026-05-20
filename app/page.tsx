import { prisma } from "@/lib/prisma";
import HomeClient from "./HomeClient";

export const revalidate = 300;

export default async function HomePage() {
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

  return (
    <HomeClient
      featured={JSON.parse(JSON.stringify(featured))}
      categories={JSON.parse(JSON.stringify(categories))}
      banners={JSON.parse(JSON.stringify(banners))}
      newArrivals={JSON.parse(JSON.stringify(newArrivals))}
    />
  );
}
