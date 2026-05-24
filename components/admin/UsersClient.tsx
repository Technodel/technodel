"use client";

import { useMemo, useState } from "react";
import { apiPath } from "@/lib/api-path";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  rewardPoints: number;
  isActive: boolean;
  createdAt: string;
  _count: { orders: number; wishlist: number; cart: number };
};

export default function UsersClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return users;
    const v = q.toLowerCase();
    return users.filter((u) =>
      [u.email, u.name || "", u.phone || ""].some((x) => x.toLowerCase().includes(v))
    );
  }, [users, q]);

  async function patchUser(id: string, payload: Partial<UserRow>) {
    setMsg("");
    const res = await fetch(apiPath(`/api/admin/users/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Update failed");
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data.user } : u)));
  }

  return (
    <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
      <div style={{ padding: 14, borderBottom: "1px solid var(--c-border)" }}>
        <input className="input" placeholder="Search users by email/name/phone" value={q} onChange={(e) => setQ(e.target.value)} />
        {msg && <div style={{ fontSize: 12, color: "var(--c-danger)", marginTop: 8 }}>{msg}</div>}
      </div>
      <table className="tn-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Points</th>
            <th>Orders</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--c-muted)" }}>No users</td></tr>
          ) : filtered.map((u) => (
            <tr key={u.id}>
              <td>
                <div style={{ fontWeight: 600 }}>{u.name || "-"}</div>
                <div style={{ fontSize: 12, color: "var(--c-muted)" }}>{u.email}</div>
                {u.phone && <div style={{ fontSize: 12, color: "var(--c-muted)" }}>{u.phone}</div>}
              </td>
              <td>
                <select
                  className="input"
                  style={{ minWidth: 110 }}
                  value={u.role}
                  onChange={(e) => patchUser(u.id, { role: e.target.value })}
                >
                  <option value="customer">customer</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td>
                <input
                  className="input"
                  style={{ width: 90 }}
                  value={String(u.rewardPoints)}
                  onChange={(e) => {
                    const val = Number(e.target.value || 0);
                    setUsers((prev) => prev.map((row) => (row.id === u.id ? { ...row, rewardPoints: val } : row)));
                  }}
                  onBlur={() => patchUser(u.id, { rewardPoints: u.rewardPoints })}
                />
              </td>
              <td>{u._count.orders}</td>
              <td>
                <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={u.isActive}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setUsers((prev) => prev.map((row) => (row.id === u.id ? { ...row, isActive: checked } : row)));
                      patchUser(u.id, { isActive: checked });
                    }}
                  />
                  {u.isActive ? "active" : "disabled"}
                </label>
              </td>
              <td style={{ fontSize: 12, color: "var(--c-muted)" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
