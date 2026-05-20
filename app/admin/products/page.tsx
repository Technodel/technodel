import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminProductsClient from "./AdminProductsClient";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1"));
  const q = sp.q;
  const limit = 50;

  const where: any = {};
  if (q) where.OR = [{ title: { contains: q } }, { sku: { contains: q } }, { brand: { contains: q } }];

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }).catch(() => []),
    prisma.product.count({ where }).catch(() => 0),
    prisma.category.findMany({ where: { parentId: null }, orderBy: { sortOrder: "asc" } }).catch(() => []),
  ]);

  return (
    <AdminProductsClient
      products={products as any}
      total={total}
      pages={Math.ceil(total / limit)}
      page={page}
      categories={categories as any}
      initialQ={q || ""}
    />
  );
}
