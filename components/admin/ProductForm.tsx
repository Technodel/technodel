"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateSlug, generateSku } from "@/lib/utils";

interface Category { id: string; name: string; slug: string; icon?: string | null; }
interface Competitor { id: string; name: string; }
interface Props {
  categories: Category[];
  competitors: Competitor[];
  initialData?: any;
  productId?: string;
}

export default function ProductForm({ categories, competitors, initialData, productId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"basic" | "seo" | "pricing" | "media">("basic");
  const [enriching, setEnriching] = useState<Record<string, boolean>>({});
  const [uploadingImages, setUploadingImages] = useState(false);

  const [form, setForm] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    sku: initialData?.sku || "",
    brand: initialData?.brand || "",
    categoryId: initialData?.categoryId || "",
    shortDescription: initialData?.shortDescription || "",
    description: initialData?.description || "",
    // pricing
    costPrice: initialData?.costPrice || "",
    displayPrice: initialData?.displayPrice || "",
    comparePrice: initialData?.comparePrice || "",
    sourcePrice: initialData?.sourcePrice || "",
    priceFormula: initialData?.priceFormula || "",
    sourceUrl: initialData?.sourceUrl || "",
    competitorId: initialData?.competitorId || "",
    // seo
    seoTitle: initialData?.seoTitle || "",
    seoDescription: initialData?.seoDescription || "",
    seoKeywords: initialData?.seoKeywords || "",
    // flags
    isVisible: initialData?.isVisible !== false,
    isFeatured: initialData?.isFeatured || false,
    isNew: initialData?.isNew !== false,
    stock: initialData?.stock || "",
    // media (comma-separated image URLs)
    imagesRaw: initialData?.images ? (Array.isArray(initialData.images) ? initialData.images.join("\n") : initialData.images) : "",
    // specs: [{label, value}]
    specsRaw: initialData?.specs ? (Array.isArray(initialData.specs) ? initialData.specs.map((s: any) => `${s.label}: ${s.value}`).join("\n") : "") : "",
    // highlights: one per line
    highlightsRaw: initialData?.highlights ? (Array.isArray(initialData.highlights) ? initialData.highlights.join("\n") : "") : "",
  });

  function set(key: string, val: any) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  function getImageList(raw: string): string[] {
    return raw.split(/\n|,/).map((u) => u.trim()).filter(Boolean);
  }

  function removeImageAt(index: number) {
    const list = getImageList(form.imagesRaw);
    list.splice(index, 1);
    set("imagesRaw", list.join("\n"));
  }

  async function onImageFilesSelected(files: FileList | null) {
    if (!files || !files.length) return;
    setUploadingImages(true);
    try {
      const encoded = await Promise.all(
        Array.from(files).map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result || ""));
              reader.onerror = () => reject(new Error("Image read failed"));
              reader.readAsDataURL(file);
            })
        )
      );
      const next = [...getImageList(form.imagesRaw), ...encoded.filter(Boolean)];
      set("imagesRaw", next.join("\n"));
    } catch {
      setError("Some images could not be loaded.");
    } finally {
      setUploadingImages(false);
    }
  }

  function autoSlug() {
    if (!form.slug && form.title) set("slug", generateSlug(form.title));
  }
  function autoSku() {
    if (!form.sku && form.title) set("sku", generateSku(form.title));
  }
  function autoSeo() {
    if (!form.seoTitle) set("seoTitle", form.title);
    if (!form.seoDescription) set("seoDescription", form.shortDescription);
  }

  async function enrichField(type: string, currentVal: string, fieldKey: string) {
    if (!currentVal.trim()) {
      setError("Type some text first, then click SEO enrich.");
      return;
    }
    setError("");
    setEnriching((p) => ({ ...p, [fieldKey]: true }));
    try {
      const res = await fetch("/api/admin/seo-enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentVal, type, context: form.title }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "SEO enrich failed.");
        return;
      }
      if (data.error) {
        setError(data.error);
      }
      if (data.enhanced) {
        set(fieldKey, data.enhanced);
      }
    } catch {
      setError("SEO enrich request failed.");
    } finally {
      setEnriching((p) => ({ ...p, [fieldKey]: false }));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.categoryId || !form.displayPrice) {
      setError("Title, category, and display price are required.");
      return;
    }
    setLoading(true);
    setError("");

    const payload = {
      title: form.title,
      slug: form.slug || generateSlug(form.title),
      sku: form.sku || generateSku(form.title),
      brand: form.brand,
      categoryId: form.categoryId,
      shortDescription: form.shortDescription,
      description: form.description,
      costPrice: parseFloat(form.costPrice) || 0,
      displayPrice: parseFloat(form.displayPrice),
      comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
      sourcePrice: form.sourcePrice ? parseFloat(form.sourcePrice) : null,
      priceFormula: form.priceFormula,
      sourceUrl: form.sourceUrl,
      competitorId: form.competitorId || null,
      seoTitle: form.seoTitle || form.title,
      seoDescription: form.seoDescription || form.shortDescription,
      seoKeywords: form.seoKeywords,
      isVisible: form.isVisible,
      isFeatured: form.isFeatured,
      isNew: form.isNew,
      stock: parseInt(form.stock as any) || 0,
      images: form.imagesRaw.split(/\n|,/).map((u: string) => u.trim()).filter(Boolean),
      specs: form.specsRaw.split("\n").filter(Boolean).map((line: string) => {
        const [label, ...rest] = line.split(":");
        return { label: label.trim(), value: rest.join(":").trim() };
      }),
      highlights: form.highlightsRaw.split("\n").filter(Boolean).map((h: string) => h.trim()),
    };

    try {
      const url = productId ? `/api/admin/products/${productId}` : "/api/admin/products";
      const method = productId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save."); return; }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  const TABS = [
    { id: "basic", label: "📝 Basic Info" },
    { id: "pricing", label: "💰 Pricing" },
    { id: "media", label: "🖼️ Media & Specs" },
    { id: "seo", label: "🔍 SEO" },
  ] as const;

  return (
    <form onSubmit={submit}>
      {/* Tab nav */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--c-border)", marginBottom: 28 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 20px", background: "none", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700,
              color: tab === t.id ? "var(--c-accent)" : "var(--c-muted)",
              borderBottom: `2px solid ${tab === t.id ? "var(--c-accent)" : "transparent"}`,
              marginBottom: -1,
            }}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 760 }}>

        {/* ── BASIC INFO ── */}
        {tab === "basic" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <FormRow label="Product Title *">
              <div style={{ position: "relative" }}>
                <input className="input" style={{ paddingRight: 80 }} value={form.title} onChange={(e) => set("title", e.target.value)} onBlur={() => { autoSlug(); autoSku(); autoSeo(); }} required placeholder="e.g. Samsung Galaxy S25 Ultra 512GB" />
                <EnrichBtn loading={enriching["title"]} onClick={() => enrichField("title", form.title, "title")} />
              </div>
            </FormRow>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormRow label="Brand">
                <input className="input" value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Samsung" />
              </FormRow>
              <FormRow label="Category *">
                <select className="input" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} required>
                  <option value="">Select category…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </FormRow>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormRow label="Slug">
                <input className="input" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated" />
              </FormRow>
              <FormRow label="SKU">
                <input className="input" value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="auto-generated" />
              </FormRow>
            </div>

            <FormRow label="Short Description">
              <div style={{ position: "relative" }}>
                <textarea className="input" rows={2} value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} placeholder="1-2 sentence summary for cards and SEO" style={{ resize: "vertical" }} />
                <EnrichBtn loading={enriching["shortDescription"]} onClick={() => enrichField("shortDescription", form.shortDescription, "shortDescription")} />
              </div>
            </FormRow>

            <FormRow label="Full Description (HTML supported)" hint="Use <h2>, <ul>, <table>, emoji, <strong> etc.">
              <div style={{ position: "relative" }}>
                <textarea className="input" rows={10} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="<h2>Key Features</h2><ul><li>...</li></ul>" style={{ resize: "vertical", fontFamily: "monospace", fontSize: 13 }} />
                <EnrichBtn loading={enriching["description"]} onClick={() => enrichField("description", form.description, "description")} />
              </div>
            </FormRow>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={form.isVisible} onChange={(e) => set("isVisible", e.target.checked)} style={{ accentColor: "var(--c-accent)", width: 16, height: 16 }} />
                <span style={{ fontSize: 14 }}>Visible</span>
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} style={{ accentColor: "var(--c-accent)", width: 16, height: 16 }} />
                <span style={{ fontSize: 14 }}>⭐ Featured</span>
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={form.isNew} onChange={(e) => set("isNew", e.target.checked)} style={{ accentColor: "var(--c-accent)", width: 16, height: 16 }} />
                <span style={{ fontSize: 14 }}>🆕 New</span>
              </label>
            </div>

            <FormRow label="Stock">
              <input className="input" type="number" min="0" value={form.stock} onChange={(e) => set("stock", e.target.value)} placeholder="0" style={{ width: 140 }} />
            </FormRow>
          </div>
        )}

        {/* ── PRICING ── */}
        {tab === "pricing" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormRow label="Cost Price (admin only)" hint="Your purchase cost — never shown publicly">
                <input className="input" type="number" step="0.01" value={form.costPrice} onChange={(e) => set("costPrice", e.target.value)} placeholder="0.00" />
              </FormRow>
              <FormRow label="Display Price * (shown to customers)">
                <input className="input" type="number" step="0.01" value={form.displayPrice} onChange={(e) => set("displayPrice", e.target.value)} placeholder="0.00" required />
              </FormRow>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormRow label="Compare Price" hint="Original / strike-through price">
                <input className="input" type="number" step="0.01" value={form.comparePrice} onChange={(e) => set("comparePrice", e.target.value)} placeholder="0.00" />
              </FormRow>
              <FormRow label="Source / Competitor Price" hint="Scraped price (admin reference)">
                <input className="input" type="number" step="0.01" value={form.sourcePrice} onChange={(e) => set("sourcePrice", e.target.value)} placeholder="0.00" />
              </FormRow>
            </div>
            <FormRow label="Price Formula" hint='e.g. "cost * 1.25 + 2" — auto-calculates display price from cost'>
              <input className="input" value={form.priceFormula} onChange={(e) => set("priceFormula", e.target.value)} placeholder="cost * 1.25 + 2" />
            </FormRow>
            <FormRow label="Source URL" hint="Competitor product link (admin reference)">
              <input className="input" type="url" value={form.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} placeholder="https://competitor.com/product/..." />
            </FormRow>
            {competitors.length > 0 && (
              <FormRow label="Competitor">
                <select className="input" value={form.competitorId} onChange={(e) => set("competitorId", e.target.value)}>
                  <option value="">None</option>
                  {competitors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormRow>
            )}
          </div>
        )}

        {/* ── MEDIA & SPECS ── */}
        {tab === "media" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <FormRow label="Upload Images" hint="Upload files directly (stored as data URLs) or mix with external URLs below.">
              <input
                className="input"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => void onImageFilesSelected(e.target.files)}
              />
              {uploadingImages && <div style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 6 }}>Uploading images...</div>}
            </FormRow>

            <FormRow label="Image URLs" hint="One URL per line (or comma-separated). First image is the main photo.">
              <textarea className="input" rows={6} value={form.imagesRaw} onChange={(e) => set("imagesRaw", e.target.value)} placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"} style={{ resize: "vertical", fontFamily: "monospace", fontSize: 13 }} />
            </FormRow>

            {getImageList(form.imagesRaw).length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-muted)", textTransform: "uppercase", marginBottom: 8 }}>Current Images</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                  {getImageList(form.imagesRaw).map((img, i) => (
                    <div key={`${img}-${i}`} style={{ border: "1px solid var(--c-border)", borderRadius: 8, padding: 8, background: "var(--c-surface)" }}>
                      <img src={img} alt="uploaded" style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 6, background: "var(--c-surface2)" }} />
                      <button type="button" className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 6, color: "var(--c-danger)" }} onClick={() => removeImageAt(i)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <FormRow label="Highlights" hint="One bullet point per line (e.g. 5000mAh battery)">
              <textarea className="input" rows={5} value={form.highlightsRaw} onChange={(e) => set("highlightsRaw", e.target.value)} placeholder={"5000mAh long-lasting battery\n108MP quad-camera system\n6.8-inch Super AMOLED display"} style={{ resize: "vertical" }} />
            </FormRow>
            <FormRow label="Specifications" hint="Format: Label: Value (one per line)">
              <textarea className="input" rows={8} value={form.specsRaw} onChange={(e) => set("specsRaw", e.target.value)} placeholder={"Display: 6.8 inch AMOLED\nProcessor: Snapdragon 8 Gen 3\nRAM: 12 GB\nStorage: 256 GB"} style={{ resize: "vertical" }} />
            </FormRow>
          </div>
        )}

        {/* ── SEO ── */}
        {tab === "seo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <FormRow label="SEO Title" hint="~60 chars max. Include brand + model + key feature">
              <div style={{ position: "relative" }}>
                <input className="input" style={{ paddingRight: 80 }} value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder={form.title} maxLength={120} />
                <EnrichBtn loading={enriching["seoTitle"]} onClick={() => enrichField("seoTitle", form.seoTitle || form.title, "seoTitle")} />
              </div>
              <CharCount val={form.seoTitle} max={70} />
            </FormRow>
            <FormRow label="SEO Description" hint="~155 chars. Write naturally — it appears in Google snippets">
              <div style={{ position: "relative" }}>
                <textarea className="input" rows={3} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} placeholder="Buy the [product] in Lebanon at best price. Free delivery, warranty included..." style={{ resize: "vertical" }} />
                <EnrichBtn loading={enriching["seoDescription"]} onClick={() => enrichField("seoDescription", form.seoDescription || form.shortDescription, "seoDescription")} />
              </div>
              <CharCount val={form.seoDescription} max={160} />
            </FormRow>
            <FormRow label="SEO Keywords" hint="Comma-separated. Natural language, not stuffed">
              <div style={{ position: "relative" }}>
                <input className="input" style={{ paddingRight: 80 }} value={form.seoKeywords} onChange={(e) => set("seoKeywords", e.target.value)} placeholder="samsung galaxy s25, buy samsung lebanon, best price s25 ultra" />
                <EnrichBtn loading={enriching["seoKeywords"]} onClick={() => enrichField("seoKeywords", form.seoKeywords || form.title, "seoKeywords")} />
              </div>
            </FormRow>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginTop: 20, padding: "12px 16px", background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.3)", borderRadius: "var(--r-sm)", fontSize: 14, color: "#ff6b6b", maxWidth: 760 }}>
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? "Saving..." : productId ? "Update Product" : "Create Product"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn btn-ghost btn-lg">Cancel</button>
      </div>
    </form>
  );
}

function FormRow({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</label>
      {hint && <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 6 }}>{hint}</div>}
      {children}
    </div>
  );
}

function CharCount({ val, max }: { val: string; max: number }) {
  const len = val.length;
  return (
    <div style={{ fontSize: 11, color: len > max ? "var(--c-danger)" : "var(--c-muted)", textAlign: "right", marginTop: 4 }}>
      {len}/{max}
    </div>
  );
}

function EnrichBtn({ loading, onClick }: { loading?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title="AI SEO Enrich"
      style={{
        position: "absolute",
        top: 6,
        right: 8,
        fontSize: 11,
        fontWeight: 700,
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        borderRadius: 4,
        padding: "2px 8px",
        cursor: loading ? "wait" : "pointer",
        color: "var(--c-accent)",
        opacity: loading ? 0.6 : 1,
        whiteSpace: "nowrap",
        lineHeight: 1.6,
      }}
    >
      {loading ? "…" : "✨ SEO"}
    </button>
  );
}
