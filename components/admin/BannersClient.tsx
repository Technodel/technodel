"use client";

import { useMemo, useState } from "react";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  linkUrl: string | null;
  badge: string | null;
  position: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm = {
  title: "",
  subtitle: "",
  imageUrl: "",
  mobileImageUrl: "",
  linkUrl: "",
  badge: "",
  position: "hero",
  sortOrder: "0",
  isActive: true,
};

export default function BannersClient({ initialBanners }: { initialBanners: Banner[] }) {
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const isEditing = useMemo(() => !!editingId, [editingId]);

  function reset() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function save() {
    setLoading(true);
    setMsg("");
    try {
      const payload = {
        ...form,
        sortOrder: Number(form.sortOrder || 0),
      };

      const url = editingId ? `/api/admin/banners/${editingId}` : "/api/admin/banners";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Save failed");
        return;
      }

      if (editingId) {
        setBanners((prev) => prev.map((b) => (b.id === editingId ? data.banner : b)));
      } else {
        setBanners((prev) => [data.banner, ...prev]);
      }
      setMsg("Saved");
      reset();
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this banner?")) return;
    const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    if (res.ok) setBanners((prev) => prev.filter((b) => b.id !== id));
  }

  function edit(b: Banner) {
    setEditingId(b.id);
    setForm({
      title: b.title,
      subtitle: b.subtitle || "",
      imageUrl: b.imageUrl,
      mobileImageUrl: b.mobileImageUrl || "",
      linkUrl: b.linkUrl || "",
      badge: b.badge || "",
      position: b.position,
      sortOrder: String(b.sortOrder),
      isActive: b.isActive,
    });
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20 }}>
      <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", padding: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{isEditing ? "Edit Banner" : "Create Banner"}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          <input className="input" placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))} />
          <input className="input" placeholder="Desktop image URL" value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} />
          <input className="input" placeholder="Mobile image URL" value={form.mobileImageUrl} onChange={(e) => setForm((p) => ({ ...p, mobileImageUrl: e.target.value }))} />
          <input className="input" placeholder="Link URL" value={form.linkUrl} onChange={(e) => setForm((p) => ({ ...p, linkUrl: e.target.value }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input className="input" placeholder="Badge" value={form.badge} onChange={(e) => setForm((p) => ({ ...p, badge: e.target.value }))} />
            <input className="input" placeholder="Sort" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))} />
          </div>
          <select className="input" value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}>
            <option value="hero">hero</option>
            <option value="mid">mid</option>
            <option value="sidebar">sidebar</option>
            <option value="category">category</option>
          </select>
          <label style={{ fontSize: 13, color: "var(--c-muted)", display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} /> Active
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-primary" onClick={save} disabled={loading}>{loading ? "Saving..." : isEditing ? "Update" : "Create"}</button>
            {isEditing && <button type="button" className="btn btn-secondary" onClick={reset}>Cancel</button>}
          </div>
          {msg && <div style={{ fontSize: 12, color: "var(--c-muted)" }}>{msg}</div>}
        </div>
      </div>

      <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
        <table className="tn-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Position</th>
              <th>Sort</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {banners.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--c-muted)" }}>No banners</td></tr>
            ) : banners.map((b) => (
              <tr key={b.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{b.title}</div>
                  {b.linkUrl && <div style={{ fontSize: 11, color: "var(--c-muted)" }}>{b.linkUrl}</div>}
                </td>
                <td>{b.position}</td>
                <td>{b.sortOrder}</td>
                <td>{b.isActive ? "Active" : "Off"}</td>
                <td style={{ display: "flex", gap: 6 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => edit(b)}>Edit</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(b.id)} style={{ color: "var(--c-danger)" }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
