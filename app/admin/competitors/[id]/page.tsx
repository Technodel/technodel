import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CompetitorDetailClient from "./CompetitorDetailClient";

export default async function CompetitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [competitor, categories] = await Promise.all([
    prisma.competitor.findUnique({
      where: { id },
      include: { _count: { select: { products: true, competitorProducts: true } } },
    }).catch(() => null),
    prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }).catch(() => []),
  ]);

  if (!competitor) notFound();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <a href="/admin/competitors" style={{ color: "var(--c-muted)", fontSize: 13, textDecoration: "none" }}>← All Competitors</a>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{competitor.name}</h1>
        <a href={competitor.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--c-accent)" }}>{competitor.url}</a>
      </div>
      <CompetitorDetailClient competitor={competitor as any} categories={categories} />
    </div>
  );
}
