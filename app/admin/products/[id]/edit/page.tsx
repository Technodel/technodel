import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, categories, competitors] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { variants: true } }),
    prisma.category.findMany({ where: { isVisible: true }, orderBy: { sortOrder: "asc" } }),
    prisma.competitor.findMany({ where: { status: "active" }, select: { id: true, name: true } }),
  ]);

  if (!product) notFound();

  const parsed = {
    ...product,
    images: (() => { try { return JSON.parse(product.images); } catch { return []; } })(),
    specs: (() => { try { return JSON.parse(product.specs || "[]"); } catch { return []; } })(),
    highlights: (() => { try { return JSON.parse(product.highlights || "[]"); } catch { return []; } })(),
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Edit Product</h1>
        <p style={{ color: "var(--c-muted)", marginTop: 4, fontFamily: "monospace", fontSize: 12 }}>ID: {id}</p>
      </div>
      <ProductForm
        categories={categories as any}
        competitors={competitors}
        initialData={parsed}
        productId={id}
      />
    </div>
  );
}
