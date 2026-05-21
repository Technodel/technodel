"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

interface SyncReport {
  id: number;
  runAt: string;
  status: string;
  summary: string | null;
  details: string | null;
}

export default function SyncReportClient({ reports }: { reports: SyncReport[] }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleRunSync = useCallback(async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/admin/sync-report/run", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResult("✅ Sync completed successfully!");
        router.refresh();
      } else {
        setResult(`❌ Sync failed: ${data.message || data.error || "Unknown error"}`);
      }
    } catch (err) {
      setResult(`❌ Error: ${err instanceof Error ? err.message : "Request failed"}`);
    } finally {
      setRunning(false);
    }
  }, [router]);

  return (
    <div>
      {/* Action bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <button
          className="btn btn-primary"
          onClick={handleRunSync}
          disabled={running}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          {running ? "⏳ Running..." : "▶️ Run Sync Now"}
        </button>

        {result && (
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: result.startsWith("✅") ? "#4ade80" : "#ff6b6b",
            }}
          >
            {result}
          </span>
        )}

        <div style={{ flex: 1 }} />

        <button
          className="btn btn-ghost"
          onClick={() => router.refresh()}
          style={{ fontSize: 13 }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Reports table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "var(--c-surface)",
            borderRadius: "var(--r-lg)",
            overflow: "hidden",
            border: "1px solid var(--c-border)",
          }}
        >
          <thead>
            <tr style={{ background: "var(--c-bg)" }}>
              <Th>Run At</Th>
              <Th>Status</Th>
              <Th right>Added</Th>
              <Th right>Removed</Th>
              <Th right>Price Δ</Th>
              <Th right>Image Δ</Th>
              <Th right>Avail Δ</Th>
              <Th right>Errors</Th>
              <Th right>Duration</Th>
              <Th center>Details</Th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => {
              let summary: Record<string, any> = {};
              try {
                summary = r.summary ? JSON.parse(r.summary) : {};
              } catch {}
              const applied = summary.applied || {};
              const elapsed = summary.elapsed_seconds;

              return (
                <tr
                  key={r.id}
                  style={{
                    borderTop: "1px solid var(--c-border)",
                    transition: "background 0.15s",
                  }}
                  className="sync-report-row"
                >
                  <Td>{formatDate(r.runAt)}</Td>
                  <Td>
                    <StatusBadge status={r.status} />
                  </Td>
                  <Td right>{summary.added ?? "-"}</Td>
                  <Td right>{applied.removed ?? summary.removed ?? "-"}</Td>
                  <Td right>{applied.price ?? summary.priceChanged ?? "-"}</Td>
                  <Td right>{applied.image ?? summary.imageChanged ?? "-"}</Td>
                  <Td right>{applied.availability ?? summary.availabilityChanged ?? "-"}</Td>
                  <Td right>
                    {(summary.errors ?? 0) > 0 ? (
                      <span style={{ color: "#ff6b6b", fontWeight: 700 }}>
                        {summary.errors}
                      </span>
                    ) : (
                      "-"
                    )}
                  </Td>
                  <Td right>{elapsed ? `${elapsed}s` : "-"}</Td>
                  <Td center>
                    {r.details && r.details !== "[]" && r.details !== "{}" ? (
                      <details>
                        <summary
                          style={{
                            cursor: "pointer",
                            color: "var(--c-accent)",
                            fontSize: 13,
                          }}
                        >
                          View
                        </summary>
                        <pre
                          style={{
                            marginTop: 8,
                            padding: 12,
                            background: "var(--c-bg)",
                            borderRadius: 8,
                            fontSize: 11,
                            maxHeight: 300,
                            overflowY: "auto",
                            textAlign: "left",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {formatDetails(r.details)}
                        </pre>
                      </details>
                    ) : (
                      "-"
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        .sync-report-row:hover {
          background: rgba(0,200,255,0.04);
        }
      `}</style>
    </div>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function Th({
  children,
  right,
  center,
}: {
  children: React.ReactNode;
  right?: boolean;
  center?: boolean;
}) {
  return (
    <th
      style={{
        padding: "12px 14px",
        fontSize: 12,
        fontWeight: 600,
        color: "var(--c-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        textAlign: right ? "right" : center ? "center" : "left",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  right,
  center,
}: {
  children: React.ReactNode;
  right?: boolean;
  center?: boolean;
}) {
  return (
    <td
      style={{
        padding: "12px 14px",
        fontSize: 13,
        textAlign: right ? "right" : center ? "center" : "left",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </td>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    completed: { bg: "#122", text: "#4ade80" },
    running: { bg: "#221", text: "#fbbf24" },
    failed: { bg: "#211", text: "#ff6b6b" },
  };
  const c = colors[status] || { bg: "#111", text: "#888" };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        color: c.text,
      }}
    >
      {status}
    </span>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function formatDetails(details: string | null): string {
  if (!details) return "No details";
  try {
    const parsed = JSON.parse(details);
    // If it's an object with arrays, format it nicely
    if (typeof parsed === "object" && !Array.isArray(parsed)) {
      const lines: string[] = [];
      for (const [key, items] of Object.entries(parsed)) {
        if (Array.isArray(items) && items.length > 0) {
          lines.push(`── ${key} (${items.length}) ──`);
          for (const item of items.slice(0, 10)) {
            if (typeof item === "object" && item !== null) {
              const label =
                (item as any).sku || (item as any).title || (item as any).sourceUrl || JSON.stringify(item).substring(0, 80);
              lines.push(`  • ${label}`);
            } else {
              lines.push(`  • ${item}`);
            }
          }
          if (items.length > 10) lines.push(`  ... and ${items.length - 10} more`);
          lines.push("");
        }
      }
      return lines.join("\n") || JSON.stringify(parsed, null, 2);
    }
    return JSON.stringify(parsed, null, 2);
  } catch {
    return details;
  }
}
