import { prisma } from "@/lib/prisma";
import CategoriesClient from "./CategoriesClient";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { children: { include: { _count: { select: { products: true } } } }, _count: { select: { products: true } } },
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
  }).catch(() => []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Categories</h1>
          <p style={{ color: "var(--c-muted)", marginTop: 4 }}>Manually manage your store categories. Products are assigned to these.</p>
        </div>
      </div>
      <CategoriesClient categories={categories as any} />
    </div>
  );
}
