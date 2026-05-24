"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPath } from "@/lib/api-path";

interface Competitor {
  id: string; name: string; url: string; status: string;
  platform?: string | null; markupPct: number; lastScannedAt: string | null;
  _count: { products: number };
}

export default function CompetitorClient({ competitors }: { competitors: Competitor[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", markupPct: "10", priceFormula: "" });
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<Record<string, { count: number; error?: string }>>({});
  const [error, setError] = useState("");

  async function addCompetitor(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await fetch(apiPath("/api/admin/competitors"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, markupPct: parseFloat(form.markupPct) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      setShowAdd(false);
      router.refresh();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  async function scanCompetitor(id: string) {
    setScanning(id);
    try {
      const res = await fetch(apiPath(`/api/admin/competitors/${id}/deep-scan`), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ maxPages: 8 }) });
      const data = await res.json();
      setScanResult((p) => ({ ...p, [id]: { count: data.totalFound || 0, error: data.error } }));
      router.refresh();
    } catch {
      setScanResult((p) => ({ ...p, [id]: { count: 0, error: "Network error" } }));
    } finally {
      setScanning(null);
    }
  }

  return (
    <div>
      <button className="btn btn-primary" style={{ marginBottom: 24 }} onClick={() => setShowAdd(!showAdd)}>
        ➕ Add Competitor
      </button>

      {/* Add form */}
      {showAdd && (
        <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-lg)", padding: 28, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>New Competitor</h3>
          <form onSubmit={addCompetitor} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={L}>Store Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required placeholder="MyTech Lebanon" />
            </div>
            <div>
              <label style={L}>Store URL</label>
              <input className="input" value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} required placeholder="competitor.com or https://competitor.com" />
            </div>
            <div>
              <label style={L}>Markup % (e.g. 10 = +10%)</label>
              <input className="input" type="number" step="0.1" value={form.markupPct} onChange={(e) => setForm((p) => ({ ...p, markupPct: e.target.value }))} />
            </div>
            <div>
              <label style={L}>Formula (optional)</label>
              <input className="input" value={form.priceFormula} onChange={(e) => setForm((p) => ({ ...p, priceFormula: e.target.value }))} placeholder="source * 1.2 - 5" />
            </div>
            {error && <div style={{ gridColumn: "1/-1", color: "#ff6b6b", fontSize: 13 }}>{error}</div>}
            <div style={{ gridColumn: "1/-1", display: "flex", gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Add Competitor"}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {competitors.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--c-muted)", background: "var(--c-surface)", borderRadius: "var(--r-md)", border: "1px dashed var(--c-border)" }}>
          No competitors yet. Add your first competitor to start price intelligence.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {competitors.map((comp) => (
            <div key={comp.id} style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", padding: "20px 24px" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{comp.name}</div>
                  <a href={comp.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--c-accent)", textDecoration: "none" }}>{comp.url}</a>
                  <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: "var(--c-muted)", flexWrap: "wrap" }}>
                    <span>📦 {comp._count.products} products</span>
                    <span>🧠 {comp.platform || "auto-detect"}</span>
                    <span>📈 +{comp.markupPct}%</span>
                    {comp.lastScannedAt && <span>🕒 Last: {new Date(comp.lastScannedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {scanResult[comp.id] && (
                    <span style={{ fontSize: 12, color: scanResult[comp.id].error ? "#ff6b6b" : "#00e676" }}>
                      {scanResult[comp.id].error || `✓ ${scanResult[comp.id].count} products synced`}
                    </span>
                  )}
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => scanCompetitor(comp.id)}
                    disabled={scanning === comp.id}
                  >
                    {scanning === comp.id ? "Analyzing..." : "🧠 Full Analyze"}
                  </button>
                  <a href={`/admin/competitors/${comp.id}`} className="btn btn-ghost btn-sm">Open →</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const L: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 };
