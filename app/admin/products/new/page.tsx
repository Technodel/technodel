import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: "asc" },
  }).catch(() => []);

  const competitors = await prisma.competitor.findMany({
    where: { status: "active" },
    select: { id: true, name: true },
  }).catch(() => []);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Add New Product</h1>
        <p style={{ color: "var(--c-muted)", marginTop: 4 }}>Fill in all the details. Every field supports maximum SEO impact.</p>
      </div>
      <ProductForm categories={categories as any} competitors={competitors} />
    </div>
  );
}
