"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Category { id: string; name: string; slug: string; }
interface Competitor { id: string; name: string; url: string; markupPct: number; priceFormula?: string; }
interface ScrapedProduct {
  url: string; title: string; shortDescription: string; description: string;
  price: number | null; comparePrice: number | null; images: string[];
  brand: string | null; sku: string | null; categories: string[];
  attributes: Record<string, string>; platform: string;
}
interface PreviewItem { url: string; ok: boolean; data?: { scraped: ScrapedProduct; displayPrice: number | null }; error?: string; }

// ─── STYLES ───────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "var(--c-surface)", border: "1px solid var(--c-border)",
  borderRadius: "var(--r-lg)", padding: 24, marginBottom: 20,
};
const label: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--c-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" };
const row: React.CSSProperties = { display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" };

// ─── SHARED SELECTORS ─────────────────────────────────────────────────────────

function CategorySelect({ value, onChange, categories, required }: { value: string; onChange: (v: string) => void; categories: Category[]; required?: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <label style={label}>Target Category {required && <span style={{ color: "var(--c-danger)" }}>*</span>}</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)} required={required}>
        <option value="">-- Select category --</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  );
}

function CompetitorSelect({ value, onChange, competitors }: { value: string; onChange: (v: string) => void; competitors: Competitor[] }) {
  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <label style={label}>Competitor (optional)</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">-- No competitor --</option>
        {competitors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  );
}

// ─── PRODUCT PREVIEW CARD ─────────────────────────────────────────────────────

function PreviewCard({
  item, selected, onToggle, onSave, saving, categoryId, categories,
}: {
  item: PreviewItem; selected: boolean; onToggle: () => void;
  onSave?: () => void; saving?: boolean; categoryId: string; categories: Category[];
}) {
  if (!item.ok || !item.data) {
    return (
      <div style={{ ...card, borderColor: "#ff6b6b44" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 12, color: "var(--c-muted)", wordBreak: "break-all" }}>{item.url}</div>
            <div style={{ color: "#ff6b6b", fontSize: 13 }}>{item.error}</div>
          </div>
        </div>
      </div>
    );
  }

  const { scraped, displayPrice } = item.data;
  const thumb = scraped.images[0] || "";

  return (
    <div style={{
      ...card, display: "flex", gap: 16,
      borderColor: selected ? "var(--c-accent)" : "var(--c-border)",
      background: selected ? "rgba(0,200,255,0.04)" : "var(--c-surface)",
    }}>
      {/* Checkbox */}
      <label style={{ cursor: "pointer", paddingTop: 2 }}>
        <input type="checkbox" checked={selected} onChange={onToggle} style={{ width: 16, height: 16 }} />
      </label>

      {/* Thumbnail */}
      {thumb && (
        <img src={thumb} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, flexShrink: 0, border: "1px solid var(--c-border)" }} />
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{scraped.title || "(No title)"}</div>
        <div style={{ display: "flex", gap: 12, fontSize: 13, flexWrap: "wrap" }}>
          {scraped.brand && <span style={{ color: "var(--c-muted)" }}>🏷️ {scraped.brand}</span>}
          {scraped.sku && <span style={{ color: "var(--c-muted)" }}>SKU: {scraped.sku}</span>}
          {scraped.price && (
            <span>
              <span style={{ color: "var(--c-muted)", textDecoration: "line-through" }}>${scraped.price}</span>
              {displayPrice && <span style={{ color: "var(--c-accent)", fontWeight: 700, marginLeft: 8 }}>${displayPrice}</span>}
            </span>
          )}
          <span style={{ color: "var(--c-muted)" }}>🖼️ {scraped.images.length} imgs</span>
          <span style={{ color: "var(--c-muted)" }}>{scraped.platform}</span>
        </div>
        <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "var(--c-accent)", wordBreak: "break-all" }}>{item.url}</a>
      </div>
    </div>
  );
}

// ─── TAB: CLONE BY URL ────────────────────────────────────────────────────────

function CloneByUrlTab({ categories, competitors }: { categories: Category[]; competitors: Competitor[] }) {
  const router = useRouter();
  const [bulkMode, setBulkMode] = useState(false);
  const [singleUrl, setSingleUrl] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [competitorId, setCompetitorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState("");

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setPreviews([]); setSelected(new Set());
    setLoading(true);
    try {
      if (bulkMode) {
        const urls = bulkText.split("\n").map((u) => u.trim()).filter(Boolean);
        if (!urls.length) { setError("Enter at least one URL"); return; }
        const res = await fetch("/api/admin/clone/urls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls, competitorId: competitorId || undefined }),
        });
        const data = await res.json();
        setPreviews(data.results || []);
        const sel = new Set<number>();
        data.results?.forEach((_: PreviewItem, i: number) => sel.add(i));
        setSelected(sel);
      } else {
        if (!singleUrl) { setError("Enter a URL"); return; }
        const res = await fetch("/api/admin/clone/url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: singleUrl, action: "preview", competitorId: competitorId || undefined }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        setPreviews([{ url: singleUrl, ok: true, data }]);
        setSelected(new Set([0]));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleClone() {
    if (!categoryId) { setError("Please select a category"); return; }
    const toClone = previews.filter((_, i) => selected.has(i) && _.ok);
    if (!toClone.length) { setError("No items selected"); return; }
    setSaving(true); setSavedCount(0); setError("");
    let count = 0;
    for (const item of toClone) {
      try {
        const res = await fetch("/api/admin/clone/url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: item.url, action: "save", categoryId, competitorId: competitorId || undefined }),
        });
        if (res.ok) count++;
      } catch { /* skip */ }
    }
    setSavedCount(count);
    setSaving(false);
    if (count > 0) router.refresh();
  }

  const toggleAll = () => {
    if (selected.size === previews.filter((p) => p.ok).length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(previews.map((_, i) => i).filter((i) => previews[i].ok)));
    }
  };

  return (
    <div>
      <div style={card}>
        <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
          <span style={{ fontWeight: 700 }}>Mode:</span>
          <button className={`btn ${!bulkMode ? "btn-primary" : "btn-ghost"}`} style={{ padding: "4px 16px" }} onClick={() => setBulkMode(false)}>Single URL</button>
          <button className={`btn ${bulkMode ? "btn-primary" : "btn-ghost"}`} style={{ padding: "4px 16px" }} onClick={() => setBulkMode(true)}>Bulk (multi-URL)</button>
        </div>
        <form onSubmit={handlePreview}>
          <div style={{ display: "grid", gap: 16 }}>
            {bulkMode ? (
              <div>
                <label style={label}>Product URLs (one per line, max 50)</label>
                <textarea
                  className="input"
                  style={{ height: 140, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={"https://store.com/product/iphone-15-pro\nhttps://store.com/product/samsung-s24"}
                />
              </div>
            ) : (
              <div>
                <label style={label}>Product URL</label>
                <input
                  className="input"
                  type="url"
                  value={singleUrl}
                  onChange={(e) => setSingleUrl(e.target.value)}
                  placeholder="https://competitor.com/product/name"
                  required
                />
              </div>
            )}
            <div style={row}>
              <CompetitorSelect value={competitorId} onChange={setCompetitorId} competitors={competitors} />
              <CategorySelect value={categoryId} onChange={setCategoryId} categories={categories} />
              <button type="submit" className="btn btn-primary" style={{ height: 44 }} disabled={loading}>
                {loading ? "🔍 Scraping..." : "🔍 Preview"}
              </button>
            </div>
            {error && <div style={{ color: "#ff6b6b", fontSize: 13 }}>{error}</div>}
          </div>
        </form>
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
            <button className="btn btn-ghost" style={{ padding: "4px 14px", fontSize: 13 }} onClick={toggleAll}>
              {selected.size > 0 ? "Deselect All" : "Select All"}
            </button>
            <span style={{ color: "var(--c-muted)", fontSize: 13 }}>{selected.size} selected</span>
            <div style={{ flex: 1 }} />
            {savedCount > 0 && <span style={{ color: "#4ade80", fontWeight: 700 }}>✅ {savedCount} cloned!</span>}
            <button
              className="btn btn-primary"
              onClick={handleClone}
              disabled={saving || !selected.size || !categoryId}
            >
              {saving ? "Cloning..." : `Clone ${selected.size} Products`}
            </button>
          </div>
          {previews.map((item, i) => (
            <PreviewCard
              key={i} item={item}
              selected={selected.has(i)}
              onToggle={() => {
                const s = new Set(selected);
                s.has(i) ? s.delete(i) : s.add(i);
                setSelected(s);
              }}
              categoryId={categoryId} categories={categories}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TAB: CLONE CATEGORY ──────────────────────────────────────────────────────

function CloneCategoryTab({ categories, competitors }: { categories: Category[]; competitors: Competitor[] }) {
  const router = useRouter();
  const [catUrl, setCatUrl] = useState("");
  const [maxPages, setMaxPages] = useState("3");
  const [competitorId, setCompetitorId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState<{ urls: string[]; total: number; platform: string } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState("");

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setScanned(null); setSelected(new Set());
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clone/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryUrl: catUrl, maxPages: parseInt(maxPages) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setScanned(data);
      setSelected(new Set(data.urls)); // select all by default
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleClone() {
    if (!categoryId) { setError("Select a target category"); return; }
    const urls = [...selected];
    if (!urls.length) { setError("No products selected"); return; }
    setSaving(true); setSavedCount(0); setError("");
    let count = 0;
    // Clone one at a time to avoid overwhelming the server
    for (const url of urls) {
      try {
        const res = await fetch("/api/admin/clone/url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, action: "save", categoryId, competitorId: competitorId || undefined }),
        });
        if (res.ok) count++;
      } catch { /* skip */ }
      setSavedCount(count);
    }
    setSaving(false);
    if (count > 0) router.refresh();
  }

  return (
    <div>
      <div style={card}>
        <form onSubmit={handleScan}>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={label}>Category / Listing Page URL</label>
              <input
                className="input"
                type="url"
                value={catUrl}
                onChange={(e) => setCatUrl(e.target.value)}
                placeholder="https://competitor.com/category/laptops"
                required
              />
            </div>
            <div style={row}>
              <div>
                <label style={label}>Max Pages to Scan</label>
                <select className="input" style={{ width: 120 }} value={maxPages} onChange={(e) => setMaxPages(e.target.value)}>
                  {[1,2,3,5,10].map((n) => <option key={n} value={n}>{n} page{n > 1 ? "s" : ""}</option>)}
                </select>
              </div>
              <CompetitorSelect value={competitorId} onChange={setCompetitorId} competitors={competitors} />
              <button type="submit" className="btn btn-primary" style={{ height: 44 }} disabled={loading}>
                {loading ? "🔍 Scanning..." : "🔍 Scan Category"}
              </button>
            </div>
            {error && <div style={{ color: "#ff6b6b", fontSize: 13 }}>{error}</div>}
          </div>
        </form>
      </div>

      {scanned && (
        <div>
          <div style={{ ...card, background: "rgba(0,200,255,0.06)", borderColor: "var(--c-accent)" }}>
            <div style={{ fontWeight: 700 }}>Found {scanned.total} products on {scanned.platform}</div>
            <div style={{ fontSize: 13, color: "var(--c-muted)", marginTop: 4 }}>{selected.size} selected for cloning</div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap" }}>
            <CategorySelect value={categoryId} onChange={setCategoryId} categories={categories} required />
            <button className="btn btn-ghost" style={{ padding: "4px 14px", fontSize: 13, height: 44 }}
              onClick={() => setSelected(selected.size === scanned.urls.length ? new Set() : new Set(scanned.urls))}>
              {selected.size === scanned.urls.length ? "Deselect All" : "Select All"}
            </button>
            {savedCount > 0 && <span style={{ color: "#4ade80", fontWeight: 700, padding: "12px 0" }}>✅ {savedCount}/{selected.size} cloned</span>}
            <button className="btn btn-primary" style={{ height: 44 }} onClick={handleClone} disabled={saving || !selected.size || !categoryId}>
              {saving ? `Cloning ${savedCount}/${selected.size}...` : `Clone ${selected.size} Products`}
            </button>
          </div>

          <div style={{ maxHeight: 400, overflowY: "auto", border: "1px solid var(--c-border)", borderRadius: "var(--r-lg)", padding: 4 }}>
            {scanned.urls.map((url, i) => (
              <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", borderRadius: 6, borderBottom: "1px solid var(--c-border)", background: selected.has(url) ? "rgba(0,200,255,0.04)" : "transparent" }}>
                <input type="checkbox" checked={selected.has(url)} onChange={() => {
                  const s = new Set(selected);
                  s.has(url) ? s.delete(url) : s.add(url);
                  setSelected(s);
                }} />
                <span style={{ fontSize: 12, color: "var(--c-muted)", flex: 1, wordBreak: "break-all" }}>{url}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB: CLONE BY SKU ────────────────────────────────────────────────────────

function CloneBySkuTab({ categories, competitors }: { categories: Category[]; competitors: Competitor[] }) {
  const [sku, setSku] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [competitorId, setCompetitorId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PreviewItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Auto-fill siteUrl from competitor
  const selectedComp = competitors.find((c) => c.id === competitorId);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setResult(null); setSaved(false);
    if (!sku) { setError("Enter a SKU"); return; }
    const baseUrl = selectedComp?.url || siteUrl;
    if (!baseUrl) { setError("Enter a site URL or select a competitor"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clone/sku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, siteUrl: baseUrl, action: "preview", competitorId: competitorId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Product not found"); return; }
      setResult({ url: data.matchedUrl || baseUrl, ok: true, data });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!categoryId) { setError("Select a category"); return; }
    if (!result?.ok) return;
    setSaving(true);
    const baseUrl = selectedComp?.url || siteUrl;
    const res = await fetch("/api/admin/clone/sku", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku, siteUrl: baseUrl, action: "save", categoryId, competitorId: competitorId || undefined }),
    });
    if (res.ok) { setSaved(true); router.refresh(); }
    else { const d = await res.json(); setError(d.error || "Failed"); }
    setSaving(false);
  }

  return (
    <div>
      <div style={card}>
        <p style={{ color: "var(--c-muted)", fontSize: 14, marginBottom: 20 }}>
          Enter a product SKU and the competitor&apos;s website URL to search for it directly.
        </p>
        <form onSubmit={handleSearch}>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={row}>
              <div style={{ flex: 1 }}>
                <label style={label}>Product SKU</label>
                <input className="input" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. APAPC16GBGEN4" required />
              </div>
              <CompetitorSelect value={competitorId} onChange={setCompetitorId} competitors={competitors} />
            </div>
            {!competitorId && (
              <div>
                <label style={label}>Site URL (if no competitor selected)</label>
                <input className="input" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="competitor.com or https://competitor.com" />
              </div>
            )}
            <div style={row}>
              <CategorySelect value={categoryId} onChange={setCategoryId} categories={categories} />
              <button type="submit" className="btn btn-primary" style={{ height: 44 }} disabled={loading}>
                {loading ? "Searching..." : "🔍 Search SKU"}
              </button>
            </div>
            {error && <div style={{ color: "#ff6b6b", fontSize: 13 }}>{error}</div>}
          </div>
        </form>
      </div>

      {result && (
        <div>
          <PreviewCard
            item={result} selected categoryId={categoryId} categories={categories}
            onToggle={() => {}} saving={saving}
            onSave={handleSave}
          />
          {result.ok && (
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
              {saved && <span style={{ color: "#4ade80", fontWeight: 700 }}>✅ Product cloned!</span>}
              {!saved && (
                <button className="btn btn-primary" onClick={handleSave} disabled={saving || !categoryId}>
                  {saving ? "Saving..." : "Clone to Catalog"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN TOOLS CLIENT ────────────────────────────────────────────────────────

const TABS = [
  { id: "url", label: "🔗 Clone by URL" },
  { id: "category", label: "📂 Clone Category" },
  { id: "sku", label: "🏷️ Clone by SKU" },
];

export default function ToolsClient({ categories, competitors }: { categories: Category[]; competitors: Competitor[] }) {
  const [activeTab, setActiveTab] = useState("url");

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 28, borderBottom: "1px solid var(--c-border)", paddingBottom: 0 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "10px 20px", fontWeight: 600, fontSize: 14,
              border: "none", background: "none", cursor: "pointer",
              color: activeTab === t.id ? "var(--c-accent)" : "var(--c-muted)",
              borderBottom: activeTab === t.id ? "2px solid var(--c-accent)" : "2px solid transparent",
              transition: "color 0.2s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "url" && <CloneByUrlTab categories={categories} competitors={competitors} />}
      {activeTab === "category" && <CloneCategoryTab categories={categories} competitors={competitors} />}
      {activeTab === "sku" && <CloneBySkuTab categories={categories} competitors={competitors} />}
    </div>
  );
}
