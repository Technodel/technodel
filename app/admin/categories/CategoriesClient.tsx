"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string; name: string; slug: string; icon?: string | null; sortOrder: number; isVisible: boolean;
  _count: { products: number };
  children: Category[];
}

export default function CategoriesClient({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", icon: "", description: "", parentId: "", sortOrder: "0", isVisible: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openNew() { setForm({ name: "", slug: "", icon: "", description: "", parentId: "", sortOrder: "0", isVisible: true }); setEditItem(null); setShowForm(true); }
  function openEdit(cat: Category) {
    setForm({ name: cat.name, slug: cat.slug, icon: cat.icon || "", description: "", parentId: "", sortOrder: String(cat.sortOrder), isVisible: cat.isVisible });
    setEditItem(cat); setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const url = editItem ? `/api/admin/categories/${editItem.id}` : "/api/admin/categories";
      const method = editItem ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sortOrder: parseInt(form.sortOrder) || 0, parentId: form.parentId || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      setShowForm(false);
      router.refresh();
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  }

  async function del(cat: Category) {
    if (!confirm(`Delete "${cat.name}"? All products in this category will need reassigning.`)) return;
    await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <button className="btn btn-primary" style={{ marginBottom: 20 }} onClick={openNew}>➕ Add Category</button>

      {/* Modal form */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "var(--c-surface)", borderRadius: "var(--r-xl)", padding: 32, width: "100%", maxWidth: 480, border: "1px solid var(--c-border)" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>{editItem ? "Edit Category" : "New Category"}</h2>
            <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Category Name *</label>
                  <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <label style={labelStyle}>Icon</label>
                  <input className="input" value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} placeholder="📱" style={{ textAlign: "center", fontSize: 20 }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Slug</label>
                <input className="input" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="auto-generated" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Sort Order</label>
                  <input className="input" type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))} />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
                  <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.isVisible} onChange={(e) => setForm((p) => ({ ...p, isVisible: e.target.checked }))} style={{ accentColor: "var(--c-accent)", width: 16, height: 16 }} />
                    <span style={{ fontSize: 14 }}>Visible</span>
                  </label>
                </div>
              </div>
              {error && <div style={{ fontSize: 13, color: "#ff6b6b" }}>{error}</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {categories.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "var(--c-muted)", background: "var(--c-surface)", borderRadius: "var(--r-md)", border: "1px dashed var(--c-border)" }}>
            No categories yet. Add your first one!
          </div>
        )}
        {categories.map((cat) => (
          <div key={cat.id} style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "14px 20px" }}>
              <span style={{ fontSize: 24 }}>{cat.icon || "📦"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{cat.name}</div>
                <div style={{ fontSize: 12, color: "var(--c-muted)" }}>/{cat.slug} · {cat._count.products} products · sort {cat.sortOrder}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: cat.isVisible ? "#00e676" : "#ff4444" }}>{cat.isVisible ? "Visible" : "Hidden"}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => openEdit(cat)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => del(cat)}>Delete</button>
            </div>
            {cat.children.length > 0 && (
              <div style={{ borderTop: "1px solid var(--c-border)", padding: "8px 20px 8px 56px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                {cat.children.map((child) => (
                  <span key={child.id} style={{ fontSize: 12, padding: "3px 10px", background: "rgba(0,200,255,0.08)", borderRadius: 99, border: "1px solid rgba(0,200,255,0.2)" }}>
                    {child.icon} {child.name} ({child._count?.products || 0})
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 };
