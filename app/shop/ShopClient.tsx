"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";

interface Category { id: string; name: string; slug: string; icon?: string | null; _count?: { products: number }; }
interface Product { id: string; slug: string; title: string; brand: string | null; displayPrice: number; comparePrice: number | null; imageUrl: string; isNew: boolean; isFeatured: boolean; category: { name: string; slug: string }; }

interface Props {
  products: Product[];
  total: number;
  pages: number;
  page: number;
  categories: Category[];
  initialFilters: {
    sort: string; featured: boolean; isNew: boolean;
    category?: string; brand?: string; q?: string;
    minPrice: number; maxPrice: number;
  };
}

export default function ShopClient({ products, total, pages, page, categories, initialFilters }: Props) {
  const router = useRouter();
  const [sort, setSort] = useState(initialFilters.sort);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 900px)");
    const onChange = () => {
      const mobile = media.matches;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    onChange();

    if (media.addEventListener) {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  const maxVisiblePages = isMobile ? 5 : 10;
  const safePages = Math.max(1, pages);
  const currentPage = Math.min(Math.max(page, 1), safePages);
  const windowStart = Math.floor((currentPage - 1) / maxVisiblePages) * maxVisiblePages + 1;
  const windowEnd = Math.min(safePages, windowStart + maxVisiblePages - 1);
  const visiblePages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);
  const isBrandFiltered = !!initialFilters.brand;
  const visibleCategories = isBrandFiltered
    ? categories.filter((c) => (c._count?.products || 0) > 0)
    : categories;

  function navigate(overrides: Record<string, any>) {
    const sp = new URLSearchParams();
    const nextSort = overrides.sort ?? sort;
    const params = { ...initialFilters, page: 1, ...overrides, sort: nextSort };
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && v !== false && v !== 0) {
        sp.set(k, String(v));
      }
    });
    router.push(`/shop?${sp.toString()}`);
  }

  return (
    <div style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "clamp(16px, 4vw, 32px) clamp(12px, 4vw, 24px) 80px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>
            {initialFilters.q ? `Results for "${initialFilters.q}"` :
             initialFilters.category ? categories.find((c) => c.slug === initialFilters.category)?.name || "Shop" :
             "All Products"}
          </h1>
          <p style={{ color: "var(--c-muted)", fontSize: 13, marginTop: 2 }}>{total.toLocaleString()} products</p>
          {isBrandFiltered && (
            <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: "var(--r-sm)", border: "1px solid var(--c-border)", background: "var(--c-surface)", fontSize: 12 }}>
              <span style={{ color: "var(--c-muted)" }}>Brand:</span>
              <strong>{initialFilters.brand}</strong>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate({ brand: undefined, category: undefined })}
                style={{ padding: "2px 8px", minHeight: "unset" }}
              >
                Clear Brand
              </button>
            </div>
          )}
        </div>

        {/* Sort + filter toggle */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", width: isMobile ? "100%" : "auto", flexWrap: "wrap" }}>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); navigate({ sort: e.target.value }); }}
            className="input"
            style={{ width: "auto", maxWidth: "100%", minWidth: isMobile ? 0 : 180, flex: isMobile ? "1 1 160px" : undefined, cursor: "pointer" }}
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? (isMobile ? "Hide Filters" : "◀ Hide") : (isMobile ? "Show Filters" : "▶ Filters")}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: sidebarOpen && !isMobile ? "220px minmax(0,1fr)" : "minmax(0,1fr)", gap: isMobile ? 16 : 32 }}>

        {/* Sidebar filters */}
        {sidebarOpen && (
          <aside style={isMobile ? { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", padding: 14 } : undefined}>
            {/* Categories */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Category</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button
                  onClick={() => navigate({ category: undefined })}
                  style={{
                    border: "none", textAlign: "left", cursor: "pointer",
                    padding: "6px 10px", borderRadius: "var(--r-sm)", fontSize: 14, display: "flex", justifyContent: "space-between",
                    color: !initialFilters.category ? "var(--c-accent)" : "var(--c-text)",
                    fontWeight: !initialFilters.category ? 700 : 400,
                    background: !initialFilters.category ? "rgba(0,200,255,0.1)" : "none",
                  } as any}
                >
                  <span>All Categories</span>
                  {isBrandFiltered && (
                    <span style={{ fontSize: 11, color: "var(--c-muted)" }}>
                      {visibleCategories.reduce((sum, c) => sum + (c._count?.products || 0), 0)}
                    </span>
                  )}
                </button>
                {visibleCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate({ category: c.slug })}
                    style={{
                      border: "none", textAlign: "left", cursor: "pointer",
                      padding: "6px 10px", borderRadius: "var(--r-sm)", fontSize: 14, display: "flex", justifyContent: "space-between",
                      color: initialFilters.category === c.slug ? "var(--c-accent)" : "var(--c-text)",
                      fontWeight: initialFilters.category === c.slug ? 700 : 400,
                      background: initialFilters.category === c.slug ? "rgba(0,200,255,0.1)" : "none",
                    } as any}
                  >
                    <span>{c.icon} {c.name}</span>
                    {c._count && <span style={{ fontSize: 11, color: "var(--c-muted)" }}>{c._count.products}</span>}
                  </button>
                ))}
                {isBrandFiltered && visibleCategories.length === 0 && (
                  <div style={{ padding: "6px 10px", fontSize: 12, color: "var(--c-muted)" }}>
                    No categories found for this brand.
                  </div>
                )}
              </div>
            </div>

            {/* Quick filters */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Filter</div>
              {[
                { label: "⭐ Featured", key: "featured" },
                { label: "🆕 New Arrivals", key: "isNew" },
              ].map((f) => (
                <label key={f.key} style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", padding: "6px 0", fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={!!(initialFilters as any)[f.key]}
                    onChange={(e) => navigate({ [f.key]: e.target.checked ? "1" : undefined })}
                    style={{ accentColor: "var(--c-accent)", width: 16, height: 16 }}
                  />
                  {f.label}
                </label>
              ))}
            </div>

            {/* Reset */}
            <button className="btn btn-ghost btn-sm" onClick={() => router.push("/shop")} style={{ width: "100%" }}>
              Reset Filters
            </button>
          </aside>
        )}

        {/* Product grid */}
        <div>
          {products.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 24px", background: "var(--c-surface)", borderRadius: "var(--r-lg)", border: "1px dashed var(--c-border)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 16, color: "var(--c-muted)" }}>No products found</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => router.push("/shop")}>Clear filters</button>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((p) => <ProductCard key={p.id} product={p as any} />)}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 48, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate({ page: currentPage - 1 })}
                disabled={currentPage <= 1}
                style={{
                  width: 40, height: 40, borderRadius: "var(--r-sm)", border: "1px solid var(--c-border)",
                  background: "var(--c-surface)", color: "var(--c-text)",
                  fontWeight: 700, cursor: currentPage <= 1 ? "not-allowed" : "pointer", fontSize: 16,
                  opacity: currentPage <= 1 ? 0.45 : 1,
                }}
                aria-label="Previous page"
              >
                {"<"}
              </button>

              {windowStart > 1 && (
                <>
                  <button
                    onClick={() => navigate({ page: 1 })}
                    style={{
                      minWidth: 40, height: 40, borderRadius: "var(--r-sm)", border: "1px solid var(--c-border)",
                      background: "var(--c-surface)", color: "var(--c-text)",
                      fontWeight: 700, cursor: "pointer", fontSize: 14, padding: "0 8px",
                    }}
                  >
                    1
                  </button>
                  <span style={{ alignSelf: "center", color: "var(--c-muted)", padding: "0 2px" }}>...</span>
                </>
              )}

              {visiblePages.map((p) => (
                <button
                  key={p}
                  onClick={() => navigate({ page: p })}
                  style={{
                    width: 40, height: 40, borderRadius: "var(--r-sm)", border: `1px solid ${p === currentPage ? "var(--c-accent)" : "var(--c-border)"}`,
                    background: p === currentPage ? "var(--c-accent)" : "var(--c-surface)",
                    color: p === currentPage ? "var(--c-bg)" : "var(--c-text)",
                    fontWeight: 700, cursor: "pointer", fontSize: 14,
                    transition: "all 0.2s ease",
                  }}
                >
                  {p}
                </button>
              ))}

              {windowEnd < safePages && (
                <>
                  <span style={{ alignSelf: "center", color: "var(--c-muted)", padding: "0 2px" }}>...</span>
                  <button
                    onClick={() => navigate({ page: safePages })}
                    style={{
                      minWidth: 40, height: 40, borderRadius: "var(--r-sm)", border: "1px solid var(--c-border)",
                      background: "var(--c-surface)", color: "var(--c-text)",
                      fontWeight: 700, cursor: "pointer", fontSize: 14, padding: "0 8px",
                    }}
                  >
                    {safePages}
                  </button>
                </>
              )}

              <button
                onClick={() => navigate({ page: currentPage + 1 })}
                disabled={currentPage >= safePages}
                style={{
                  width: 40, height: 40, borderRadius: "var(--r-sm)", border: "1px solid var(--c-border)",
                  background: "var(--c-surface)", color: "var(--c-text)",
                  fontWeight: 700, cursor: currentPage >= safePages ? "not-allowed" : "pointer", fontSize: 16,
                  opacity: currentPage >= safePages ? 0.45 : 1,
                }}
                aria-label="Next page"
              >
                {">"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
