"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiPath } from "@/lib/api-path";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Competitor {
  id: string; name: string; url: string; platform?: string;
  scrapeMethod: string; markupPct: number;
  markupMode: string; priceFormula?: string; currency: string; notes?: string;
  lastScannedAt?: string; cachedStructure?: string; status: string;
  _count: { products: number; competitorProducts: number };
}
interface Category { id: string; name: string; }
interface ScannedProduct {
  id: string; url: string; title?: string; price?: number;
  images: string; status: string; brand?: string; sku?: string;
  clonedProductId?: string;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "var(--c-surface)", border: "1px solid var(--c-border)",
  borderRadius: "var(--r-lg)", padding: 24, marginBottom: 20,
};
const L: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "var(--c-muted)",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
};

// ─── SETTINGS TAB ─────────────────────────────────────────────────────────────

function SettingsTab({ competitor, onSaved }: { competitor: Competitor; onSaved: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: competitor.name,
    url: competitor.url,
    markupPct: String(competitor.markupPct),
    priceFormula: competitor.priceFormula || "",
    currency: competitor.currency,
    notes: competitor.notes || "",
    status: competitor.status,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(apiPath(`/api/admin/competitors/${competitor.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          markupPct: parseFloat(form.markupPct),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      setSaved(true);
      onSaved();
      router.refresh();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm(`Delete competitor "${competitor.name}"? This also removes all scanned products.`)) return;
    await fetch(apiPath(`/api/admin/competitors/${competitor.id}`), { method: "DELETE" });
    router.push("/admin/competitors");
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <form onSubmit={handleSave}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <label style={L}>Store Name</label>
          <input className="input" value={form.name} onChange={set("name")} required />
        </div>
        <div>
          <label style={L}>Store URL</label>
          <input className="input" type="url" value={form.url} onChange={set("url")} required />
        </div>
        <div>
          <label style={L}>Status</label>
          <select className="input" value={form.status} onChange={set("status")}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        {/* Pricing */}
        <div style={{ gridColumn: "1/-1" }}>
          <div style={{ fontWeight: 700, marginBottom: 16, paddingTop: 8, borderTop: "1px solid var(--c-border)" }}>💰 Price Formula</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={L}>Markup % (e.g. 15 = +15%)</label>
              <input className="input" type="number" step="0.1" value={form.markupPct} onChange={set("markupPct")} />
            </div>
            <div>
              <label style={L}>Custom Formula (optional)</label>
              <input className="input" value={form.priceFormula} onChange={set("priceFormula")} placeholder="source * 1.2 - 5" />
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 8 }}>Formula supports + and - (example: <code>source * 1.12 - 3</code>).</div>
        </div>

        <div>
          <label style={L}>Currency</label>
          <select className="input" value={form.currency} onChange={set("currency")}>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="LBP">LBP (ل.ل)</option>
          </select>
        </div>
        <div>
          <label style={L}>Notes</label>
          <input className="input" value={form.notes} onChange={set("notes")} placeholder="Internal notes..." />
        </div>

        {error && <div style={{ gridColumn: "1/-1", color: "#ff6b6b", fontSize: 13 }}>{error}</div>}
        {saved && <div style={{ gridColumn: "1/-1", color: "#4ade80", fontSize: 13 }}>✅ Saved</div>}

        <div style={{ gridColumn: "1/-1", display: "flex", gap: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
          <button type="button" className="btn btn-ghost" style={{ marginLeft: "auto", color: "var(--c-danger)" }} onClick={handleDelete}>Delete Competitor</button>
        </div>
      </div>
    </form>
  );
}

// ─── SCANNER TAB ──────────────────────────────────────────────────────────────

function ScannerTab({ competitor, categories }: { competitor: Competitor; categories: Category[] }) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");
  const [products, setProducts] = useState<ScannedProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [cloning, setCloning] = useState(false);
  const [cloned, setCloned] = useState(0);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const LIMIT = 30;

  const cachedStructure = competitor.cachedStructure
    ? (() => { try { return JSON.parse(competitor.cachedStructure); } catch { return null; } })()
    : null;

  const loadProducts = useCallback(async (offset = 0) => {
    setLoading(true);
    try {
      const res = await fetch(apiPath(`/api/admin/competitors/${competitor.id}/products?limit=${LIMIT}&offset=${offset}&status=pending`));
      const data = await res.json();
      setProducts(data.items || []);
      setTotal(data.total || 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [competitor.id]);

  useEffect(() => { loadProducts(page * LIMIT); }, [page, loadProducts]);

  async function handleScan() {
    setScanning(true); setScanMsg(""); setError("");
    try {
      const res = await fetch(apiPath(`/api/admin/competitors/${competitor.id}/deep-scan`), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Scan failed"); return; }
      setScanMsg(`✅ ${data.message}`);
      loadProducts(0);
      router.refresh();
    } catch { setError("Network error"); }
    finally { setScanning(false); }
  }

  async function handleClone() {
    if (!categoryId) { setError("Select a target category"); return; }
    const ids = [...selected];
    if (!ids.length) { setError("Select products to clone"); return; }
    setCloning(true); setCloned(0); setError("");
    try {
      const res = await fetch(apiPath(`/api/admin/competitors/${competitor.id}/products`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, categoryId }),
      });
      const data = await res.json();
      setCloned(data.cloned || 0);
      if (data.errors > 0) setError(`${data.errors} failed`);
      setSelected(new Set());
      loadProducts(page * LIMIT);
      router.refresh();
    } catch { setError("Network error"); }
    finally { setCloning(false); }
  }

  return (
    <div>
      {/* Scan Controls */}
      <div style={card}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 700 }}>Site Scanner</div>
            <div style={{ fontSize: 13, color: "var(--c-muted)" }}>
              {competitor.lastScannedAt
                ? `Last scan: ${new Date(competitor.lastScannedAt).toLocaleString()}`
                : "Never scanned"}
              {cachedStructure && ` · ${cachedStructure.totalProducts || 0} products found`}
              {cachedStructure && ` · ${cachedStructure.categories?.length || 0} categories`}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={handleScan} disabled={scanning} style={{ minWidth: 140 }}>
            {scanning ? "🔍 Scanning..." : "🔍 Scan Site Now"}
          </button>
        </div>
        {scanMsg && <div style={{ marginTop: 12, color: "#4ade80", fontSize: 13 }}>{scanMsg}</div>}
        {error && <div style={{ marginTop: 12, color: "#ff6b6b", fontSize: 13 }}>{error}</div>}

        {/* Category preview */}
        {cachedStructure?.categories?.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--c-border)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--c-muted)", marginBottom: 8, textTransform: "uppercase" }}>Discovered Categories</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {cachedStructure.categories.slice(0, 20).map((c: { name: string; url: string }, i: number) => (
                <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, padding: "3px 10px", border: "1px solid var(--c-border)", borderRadius: 20, color: "var(--c-accent)", textDecoration: "none" }}>
                  {c.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Products list */}
      {total > 0 && (
        <div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700 }}>{total} Pending Products</span>
            <button className="btn btn-ghost" style={{ padding: "4px 14px", fontSize: 13 }} onClick={() => {
              selected.size === products.length ? setSelected(new Set()) : setSelected(new Set(products.map((p) => p.id)));
            }}>{selected.size === products.length ? "Deselect Page" : "Select Page"}</button>
            <span style={{ color: "var(--c-muted)", fontSize: 13 }}>{selected.size} selected</span>
            <div style={{ flex: 1 }} />
            {cloned > 0 && <span style={{ color: "#4ade80", fontWeight: 700 }}>✅ {cloned} cloned</span>}
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={L}>Target Category</label>
              <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">-- Select --</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" style={{ height: 44 }} onClick={handleClone} disabled={cloning || !selected.size || !categoryId}>
              {cloning ? `Cloning...` : `Clone ${selected.size} Selected`}
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--c-muted)" }}>Loading...</div>
          ) : (
            <div style={{ border: "1px solid var(--c-border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
              {products.map((p) => {
                const imgs = (() => { try { return JSON.parse(p.images); } catch { return []; } })();
                return (
                  <label key={p.id} style={{
                    display: "flex", gap: 12, padding: "10px 16px", cursor: "pointer", alignItems: "center",
                    borderBottom: "1px solid var(--c-border)",
                    background: selected.has(p.id) ? "rgba(0,200,255,0.04)" : "transparent",
                  }}>
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => {
                      const s = new Set(selected); s.has(p.id) ? s.delete(p.id) : s.add(p.id); setSelected(s);
                    }} />
                    {imgs[0] && <img src={imgs[0]} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.title || "(No title scraped yet)"}
                      </div>
                      <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "var(--c-muted)", wordBreak: "break-all" }}>{p.url}</a>
                    </div>
                    {p.price && <span style={{ color: "var(--c-accent)", fontWeight: 700, fontSize: 14 }}>${p.price}</span>}
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "rgba(0,200,255,0.1)", color: "var(--c-accent)" }}>{p.status}</span>
                  </label>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {total > LIMIT && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
              <button className="btn btn-ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span style={{ padding: "8px 16px", color: "var(--c-muted)" }}>Page {page + 1} / {Math.ceil(total / LIMIT)}</span>
              <button className="btn btn-ghost" disabled={(page + 1) * LIMIT >= total} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      )}

      {total === 0 && !loading && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--c-muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div>No scanned products yet. Click "Scan Site Now" to discover products.</div>
        </div>
      )}
    </div>
  );
}

// ─── CLONED PRODUCTS TAB ──────────────────────────────────────────────────────

function ClonedProductsTab({ competitor }: { competitor: Competitor }) {
  const [products, setProducts] = useState<ScannedProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiPath(`/api/admin/competitors/${competitor.id}/products?status=cloned&limit=50`))
      .then((r) => r.json())
      .then((d) => { setProducts(d.items || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [competitor.id]);

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "var(--c-muted)" }}>Loading...</div>;

  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 16 }}>{total} Products Cloned from {competitor.name}</div>
      {products.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--c-muted)" }}>No products cloned yet.</div>
      ) : (
        <div style={{ border: "1px solid var(--c-border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          {products.map((p) => (
            <div key={p.id} style={{ display: "flex", gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--c-border)", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.title}</div>
                <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "var(--c-muted)" }}>{p.url}</a>
              </div>
              {p.clonedProductId && (
                <a href={`/admin/products/${p.clonedProductId}/edit`} className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}>Edit ↗</a>
              )}
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "rgba(74,222,128,0.1)", color: "#4ade80" }}>cloned</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ANALYZE REPORT TAB ───────────────────────────────────────────────────────

function AnalyzeReportTab({ competitor }: { competitor: Competitor }) {
  const cached = competitor.cachedStructure
    ? (() => { try { return JSON.parse(competitor.cachedStructure); } catch { return null; } })()
    : null;

  const report = cached?.analyzeReport ?? null;

  if (!cached) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "var(--c-muted)" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>No analysis data yet</div>
        <div style={{ fontSize: 13 }}>Run a <strong>Full Analyze</strong> scan from the Scanner tab to generate the report.</div>
      </div>
    );
  }

  const confColor: Record<string, string> = { high: "#4ade80", medium: "#facc15", low: "#fb923c" };
  const platColor = confColor[report?.platformConfidence] || "var(--c-muted)";

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--c-border)", alignItems: "flex-start" }}>
      <div style={{ width: 200, flexShrink: 0, fontSize: 12, fontWeight: 600, color: "var(--c-muted)", textTransform: "uppercase", paddingTop: 2 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 14 }}>{value}</div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>📊 Analyze Report</div>
          {cached.scannedAt && (
            <div style={{ fontSize: 12, color: "var(--c-muted)" }}>
              Last scanned: {new Date(cached.scannedAt).toLocaleString()}
            </div>
          )}
        </div>
        <div style={{ fontSize: 13, color: "var(--c-muted)" }}>
          Auto-generated during the last Full Analyze scan of <strong>{competitor.name}</strong>.
        </div>
      </div>

      {/* Platform */}
      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>🏪 Platform Detection</div>
        <Row
          label="Platform"
          value={
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{report?.platform || cached.platform || "—"}</span>
              {report?.platformConfidence && (
                <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: platColor + "22", color: platColor, fontWeight: 600, textTransform: "uppercase" }}>
                  {report.platformConfidence} confidence
                </span>
              )}
            </div>
          }
        />
        {report?.platformSignals?.length > 0 && (
          <Row
            label="Detection Signals"
            value={
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                {report.platformSignals.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            }
          />
        )}
        <Row label="Sitemap Found" value={report?.sitemapFound ? "✅ Yes" : "❌ No"} />
      </div>

      {/* Crawl Analysis */}
      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>🕷️ Crawl Analysis</div>
        <Row label="Pagination Pattern" value={report?.paginationPattern || "—"} />
        <Row label="Product URL Pattern" value={<code style={{ background: "var(--c-bg)", padding: "2px 6px", borderRadius: 4 }}>{report?.productUrlPattern || "—"}</code>} />
        <Row label="Categories Found" value={`${cached.categories?.length || 0} categories`} />
        <Row label="Category Depth" value={`${report?.categoryDepth || cached.categories?.length || 0} categories indexed`} />
        <Row label="Total Products Found" value={`${report?.totalProductsFound ?? cached.totalProducts ?? 0} URLs`} />
        <Row label="New Products Added" value={typeof report?.newProductsAdded === "number" ? `${report.newProductsAdded} new rows` : "—"} />
      </div>

      {/* Top Categories */}
      {(report?.topCategories?.length > 0 || cached.categories?.length > 0) && (
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>📂 Category Tree (up to 20)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(report?.topCategories || cached.categories?.map((c: { name: string }) => c.name)).slice(0, 20).map((name: string, i: number) => (
              <span key={i} style={{ fontSize: 12, padding: "3px 10px", border: "1px solid var(--c-border)", borderRadius: 20, color: "var(--c-accent)" }}>{name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Scan Errors */}
      {report?.scanErrors?.length > 0 && (
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 12, color: "#fb923c" }}>⚠️ Scan Errors</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#fb923c" }}>
            {report.scanErrors.map((e: string, i: number) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "scanner", label: "🔍 Scanner" },
  { id: "report", label: "📊 Analyze Report" },
  { id: "settings", label: "⚙️ Settings" },
  { id: "cloned", label: "📦 Cloned Products" },
];

export default function CompetitorDetailClient({
  competitor,
  categories,
}: {
  competitor: Competitor;
  categories: Category[];
}) {
  const [activeTab, setActiveTab] = useState("scanner");
  const [comp, setComp] = useState(competitor);
  const router = useRouter();

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Catalog Products", value: comp._count.products },
          { label: "Scanned Products", value: comp._count.competitorProducts },
          { label: "Platform", value: comp.platform || "—" },
          { label: "Markup", value: comp.priceFormula ? "Custom" : `${comp.markupPct}%` },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-lg)", padding: "14px 20px", flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 11, color: "var(--c-muted)", textTransform: "uppercase" }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "1px solid var(--c-border)" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "10px 20px", fontWeight: 600, fontSize: 14,
            border: "none", background: "none", cursor: "pointer",
            color: activeTab === t.id ? "var(--c-accent)" : "var(--c-muted)",
            borderBottom: activeTab === t.id ? "2px solid var(--c-accent)" : "2px solid transparent",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "scanner" && <ScannerTab competitor={comp} categories={categories} />}
      {activeTab === "report" && <AnalyzeReportTab competitor={comp} />}
      {activeTab === "settings" && <SettingsTab competitor={comp} onSaved={() => { setComp((p) => ({ ...p })); router.refresh(); }} />}
      {activeTab === "cloned" && <ClonedProductsTab competitor={comp} />}
    </div>
  );
}
