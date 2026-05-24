"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPath } from "@/lib/api-path";

interface Product {
  id: string; title: string; sku: string; brand: string;
  displayPrice: number; stock: number; isVisible: boolean; isFeatured: boolean; isNew: boolean;
  images: string; createdAt: Date | string;
  category: { name: string };
}

interface Props {
  products: Product[];
  total: number;
  pages: number;
  page: number;
  categories: { id: string; name: string }[];
  initialQ: string;
}

export default function AdminProductsClient({ products, total, pages, page, categories, initialQ }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<string | null>(null);

  function search(val: string) {
    setQ(val);
    startTransition(() => {
      const sp = new URLSearchParams();
      if (val) sp.set("q", val);
      router.push(`/admin/products?${sp.toString()}`);
    });
  }

  async function deleteProduct(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(apiPath(`/api/admin/products/${id}`), { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      alert("Delete failed. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  async function toggleField(id: string, field: "isVisible" | "isFeatured" | "isNew", value: boolean) {
    await fetch(apiPath(`/api/admin/products/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !value }),
    });
    router.refresh();
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Products</h1>
          <p style={{ color: "var(--c-muted)", fontSize: 13 }}>{total.toLocaleString()} total</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="input"
            placeholder="Search by title, SKU, brand..."
            value={q}
            onChange={(e) => search(e.target.value)}
            style={{ width: 280 }}
          />
          <Link href="/admin/products/new" className="btn btn-primary">
            ➕ Add Product
          </Link>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
        <table className="tn-table">
          <thead>
            <tr>
              <th style={{ width: 48 }}></th>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Flags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: "48px 0", color: "var(--c-muted)" }}>
                {q ? `No results for "${q}"` : "No products yet. Add your first product!"}
              </td></tr>
            ) : products.map((p) => {
              let img = "";
              try { img = JSON.parse(p.images)[0] || ""; } catch {}
              return (
                <tr key={p.id} style={{ opacity: isPending || deleting === p.id ? 0.5 : 1 }}>
                  <td>
                    {img ? (
                      <img src={img} alt={p.title} style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 4, background: "var(--c-surface2)" }} />
                    ) : (
                      <div style={{ width: 40, height: 40, background: "var(--c-surface2)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📦</div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 14, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                    {p.brand && <div style={{ fontSize: 11, color: "var(--c-muted)" }}>{p.brand}</div>}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--c-muted)" }}>{p.sku}</td>
                  <td style={{ fontSize: 13 }}>{p.category?.name}</td>
                  <td style={{ fontWeight: 700, color: "var(--c-accent)" }}>${p.displayPrice.toFixed(0)}</td>
                  <td style={{ color: p.stock === 0 ? "var(--c-danger)" : "var(--c-text)" }}>{p.stock}</td>
                  <td>
                    <button
                      onClick={() => toggleField(p.id, "isVisible", p.isVisible)}
                      style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99, border: "none", cursor: "pointer",
                        background: p.isVisible ? "rgba(0,230,118,0.15)" : "rgba(255,68,68,0.15)",
                        color: p.isVisible ? "#00e676" : "#ff4444",
                      }}
                    >
                      {p.isVisible ? "Visible" : "Hidden"}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      <FlagToggle active={p.isFeatured} label="⭐" title="Featured" onClick={() => toggleField(p.id, "isFeatured", p.isFeatured)} />
                      <FlagToggle active={p.isNew} label="🆕" title="New" onClick={() => toggleField(p.id, "isNew", p.isNew)} />
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Link href={`/admin/products/${p.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                      <button
                        onClick={() => deleteProduct(p.id, p.title)}
                        className="btn btn-danger btn-sm"
                        disabled={deleting === p.id}
                      >
                        {deleting === p.id ? "..." : "Del"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
          {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => router.push(`/admin/products?page=${p}${q ? `&q=${q}` : ""}`)}
              style={{
                width: 36, height: 36, borderRadius: "var(--r-sm)", border: `1px solid ${p === page ? "var(--c-accent)" : "var(--c-border)"}`,
                background: p === page ? "var(--c-accent)" : "var(--c-surface)",
                color: p === page ? "var(--c-bg)" : "var(--c-text)",
                fontWeight: 700, cursor: "pointer", fontSize: 13,
              }}
            >{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function FlagToggle({ active, label, title, onClick }: { active: boolean; label: string; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? "rgba(255,193,7,0.15)" : "none",
        border: `1px solid ${active ? "rgba(255,193,7,0.4)" : "var(--c-border)"}`,
        borderRadius: 4, padding: "2px 6px", cursor: "pointer", fontSize: 13, opacity: active ? 1 : 0.3,
      }}
    >{label}</button>
  );
}
