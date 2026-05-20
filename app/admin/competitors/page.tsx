import { prisma } from "@/lib/prisma";
import CompetitorClient from "./CompetitorClient";

export default async function AdminCompetitorsPage() {
  const competitors = await prisma.competitor.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>🔍 Competitor Intelligence</h1>
        <p style={{ color: "var(--c-muted)", marginTop: 4 }}>Add competitor stores. Scan them for products. Auto-price your catalog.</p>
      </div>
      <CompetitorClient competitors={competitors as any} />
    </div>
  );
}
