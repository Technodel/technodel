"use client";

import { useMemo, useState } from "react";

type Zone = {
  id: string;
  name: string;
  fee: number;
  minOrder: number;
  freeAbove: number | null;
  estimateDays: string;
  isActive: boolean;
  sortOrder: number;
};

const emptyForm = {
  name: "",
  fee: "0",
  minOrder: "0",
  freeAbove: "",
  estimateDays: "1-3",
  isActive: true,
  sortOrder: "0",
};

export default function DeliveryZonesClient({ initialZones }: { initialZones: Zone[] }) {
  const [zones, setZones] = useState<Zone[]>(initialZones);
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
        fee: Number(form.fee || 0),
        minOrder: Number(form.minOrder || 0),
        freeAbove: form.freeAbove ? Number(form.freeAbove) : null,
        sortOrder: Number(form.sortOrder || 0),
      };
      const url = editingId ? `/api/admin/delivery/${editingId}` : "/api/admin/delivery";
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

      if (editingId) setZones((prev) => prev.map((z) => (z.id === editingId ? data.zone : z)));
      else setZones((prev) => [data.zone, ...prev]);
      setMsg("Saved");
      reset();
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this zone?")) return;
    const res = await fetch(`/api/admin/delivery/${id}`, { method: "DELETE" });
    if (res.ok) setZones((prev) => prev.filter((z) => z.id !== id));
  }

  function edit(z: Zone) {
    setEditingId(z.id);
    setForm({
      name: z.name,
      fee: String(z.fee),
      minOrder: String(z.minOrder),
      freeAbove: z.freeAbove ? String(z.freeAbove) : "",
      estimateDays: z.estimateDays,
      isActive: z.isActive,
      sortOrder: String(z.sortOrder),
    });
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20 }}>
      <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", padding: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{isEditing ? "Edit Zone" : "Create Zone"}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input className="input" placeholder="Zone name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input className="input" placeholder="Fee" value={form.fee} onChange={(e) => setForm((p) => ({ ...p, fee: e.target.value }))} />
            <input className="input" placeholder="Min order" value={form.minOrder} onChange={(e) => setForm((p) => ({ ...p, minOrder: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input className="input" placeholder="Free above" value={form.freeAbove} onChange={(e) => setForm((p) => ({ ...p, freeAbove: e.target.value }))} />
            <input className="input" placeholder="Sort order" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))} />
          </div>
          <input className="input" placeholder="Estimate days" value={form.estimateDays} onChange={(e) => setForm((p) => ({ ...p, estimateDays: e.target.value }))} />
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
              <th>Name</th>
              <th>Fee</th>
              <th>Free Above</th>
              <th>ETA</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {zones.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--c-muted)" }}>No zones</td></tr>
            ) : zones.map((z) => (
              <tr key={z.id}>
                <td>{z.name}</td>
                <td>${z.fee}</td>
                <td>{z.freeAbove ? `$${z.freeAbove}` : "-"}</td>
                <td>{z.estimateDays}</td>
                <td>{z.isActive ? "Active" : "Off"}</td>
                <td style={{ display: "flex", gap: 6 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => edit(z)}>Edit</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(z.id)} style={{ color: "var(--c-danger)" }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
