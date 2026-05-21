import { prisma } from "@/lib/prisma";
import SyncReportClient from "./SyncReportClient";

export const dynamic = "force-dynamic";

export default async function SyncReportPage() {
  const reports = await prisma.syncReport.findMany({
    orderBy: { runAt: "desc" },
    take: 50,
  });

  // Count stats
  const stats = {
    total: await prisma.syncReport.count(),
    completed: await prisma.syncReport.count({ where: { status: "completed" } }),
    failed: await prisma.syncReport.count({ where: { status: "failed" } }),
    running: await prisma.syncReport.count({ where: { status: "running" } }),
    lastRun: reports[0]?.runAt ?? null,
    lastStatus: reports[0]?.status ?? null,
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>🔄 Sync Report</h1>
        <p style={{ color: "var(--c-muted)", marginTop: 4 }}>
          Track bidirectional sync between ALL-MALL and Technodel. Runs automatically every 6 hours.
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Runs" value={stats.total} />
        <StatCard label="Completed" value={stats.completed} color="#4ade80" />
        <StatCard label="Failed" value={stats.failed} color="#ff6b6b" />
        <StatCard
          label="Status"
          value={stats.running > 0 ? "🔄 Running" : stats.lastStatus === "failed" ? "⚠️ Error" : "✅ Idle"}
          color={stats.running > 0 ? "#fbbf24" : stats.lastStatus === "failed" ? "#ff6b6b" : "#4ade80"}
        />
      </div>

      <SyncReportClient reports={reports as any} />

      {reports.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 24px",
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            borderRadius: "var(--r-lg)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
          <h3 style={{ marginBottom: 8 }}>No Sync Reports Yet</h3>
          <p style={{ color: "var(--c-muted)", marginBottom: 20 }}>
            Click &quot;Run Sync Now&quot; to start the first synchronization.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div
      style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        borderRadius: "var(--r-lg)",
        padding: "20px 24px",
      }}
    >
      <div style={{ fontSize: 13, color: "var(--c-muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || "var(--c-text)" }}>
        {value ?? "-"}
      </div>
    </div>
  );
}
