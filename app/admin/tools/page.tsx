import { prisma } from "@/lib/prisma";
import ToolsClient from "./ToolsClient";

export default async function AdminToolsPage() {
  const [categories, competitors] = await Promise.all([
    prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }).catch(() => []),
    prisma.competitor.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, url: true, markupPct: true, priceFormula: true },
    }).catch(() => []),
  ]);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>🛠️ Import Tools</h1>
        <p style={{ color: "var(--c-muted)", marginTop: 4 }}>
          Clone products by URL, SKU, or entire categories from competitor sites.
        </p>
      </div>
      <ToolsClient categories={categories as any} competitors={competitors as any} />
    </div>
  );
}
