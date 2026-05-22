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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    <div style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "32px 24px 80px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>
            {initialFilters.q ? `Results for "${initialFilters.q}"` :
             initialFilters.category ? categories.find((c) => c.slug === initialFilters.category)?.name || "Shop" :
             "All Products"}
          </h1>
          <p style={{ color: "var(--c-muted)", fontSize: 13, marginTop: 2 }}>{total.toLocaleString()} products</p>
        </div>

        {/* Sort + filter toggle */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); navigate({ sort: e.target.value }); }}
            className="input"
            style={{ width: "auto", cursor: "pointer" }}
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "◀ Hide" : "▶ Filters"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: sidebarOpen ? "220px 1fr" : "1fr", gap: 32 }}>

        {/* Sidebar filters */}
        {sidebarOpen && (
          <aside>
            {/* Categories */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Category</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button
                  onClick={() => navigate({ category: undefined })}
                  style={{
                    border: "none", textAlign: "left", cursor: "pointer",
                    padding: "6px 10px", borderRadius: "var(--r-sm)", fontSize: 14,
                    color: !initialFilters.category ? "var(--c-accent)" : "var(--c-text)",
                    fontWeight: !initialFilters.category ? 700 : 400,
                    background: !initialFilters.category ? "rgba(0,200,255,0.1)" : "none",
                  } as any}
                >
                  All Categories
                </button>
                {categories.map((c) => (
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
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 48 }}>
              {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => navigate({ page: p })}
                  style={{
                    width: 40, height: 40, borderRadius: "var(--r-sm)", border: `1px solid ${p === page ? "var(--c-accent)" : "var(--c-border)"}`,
                    background: p === page ? "var(--c-accent)" : "var(--c-surface)",
                    color: p === page ? "var(--c-bg)" : "var(--c-text)",
                    fontWeight: 700, cursor: "pointer", fontSize: 14,
                    transition: "all 0.2s ease",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
