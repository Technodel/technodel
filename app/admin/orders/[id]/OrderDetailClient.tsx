"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = ["pending","confirmed","processing","shipped","delivered","cancelled","refunded"];
const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b", confirmed: "#3b82f6", processing: "#8b5cf6",
  shipped: "#06b6d4", delivered: "#10b981", cancelled: "#ef4444", refunded: "#6b7280",
};

export default function OrderDetailClient({ order }: { order: any }) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);

  async function updateStatus() {
    setSaving(true);
    await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    router.refresh();
  }

  const profit = order.items.reduce((sum: number, item: any) =>
    sum + ((item.price - (item.costPrice || item.price)) * item.qty), 0);

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/admin/orders" style={{ color: "var(--c-muted)", textDecoration: "none", fontSize: 13 }}>← Orders</a>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>Order #{order.orderNumber}</h1>
          <div style={{ color: "var(--c-muted)", fontSize: 13 }}>{new Date(order.createdAt).toLocaleString()}</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 160 }}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary" onClick={updateStatus} disabled={saving || status === order.status}>
            {saving ? "..." : "Update"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Customer */}
        <div style={BOX}>
          <div style={BOXT}>Customer</div>
          <div style={{ fontSize: 14 }}>
            <div style={{ fontWeight: 600 }}>{order.guestName || order.user?.name || "—"}</div>
            <div style={{ color: "var(--c-muted)" }}>{order.guestPhone || order.user?.phone}</div>
            {order.user?.email && <div style={{ color: "var(--c-muted)" }}>{order.user.email}</div>}
          </div>
        </div>

        {/* Delivery */}
        <div style={BOX}>
          <div style={BOXT}>Delivery</div>
          <div style={{ fontSize: 14 }}>
            <div style={{ fontWeight: 600 }}>{order.paymentMethod.toUpperCase()}</div>
            {order.shippingAddress && <div style={{ color: "var(--c-muted)", marginTop: 4, whiteSpace: "pre-wrap" }}>{order.shippingAddress}</div>}
            {order.note && <div style={{ color: "var(--c-muted)", marginTop: 6 }}>📝 {order.note}</div>}
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={BOX}>
        <div style={BOXT}>Items</div>
        <table className="tn-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Variant</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th style={{ color: "#ff6b6b" }}>Cost ⓐ</th>
              <th style={{ color: "#10b981" }}>Margin ⓐ</th>
              <th>Source ⓐ</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item: any) => {
              const margin = item.costPrice ? ((item.price - item.costPrice) * item.qty) : null;
              return (
                <tr key={item.id}>
                  <td>
                    <a href={`/product/${encodeURIComponent(item.product?.slug || "")}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--c-accent)", textDecoration: "none", fontWeight: 600 }}>
                      {item.title}
                    </a>
                  </td>
                  <td style={{ color: "var(--c-muted)", fontSize: 12 }}>{item.variantLabel || "—"}</td>
                  <td>{item.qty}</td>
                  <td>${item.price.toFixed(0)}</td>
                  <td style={{ fontWeight: 700 }}>${(item.price * item.qty).toFixed(0)}</td>
                  <td style={{ color: "#ff6b6b", fontSize: 12 }}>{item.costPrice ? `$${item.costPrice.toFixed(0)}` : "—"}</td>
                  <td style={{ color: margin !== null && margin > 0 ? "#10b981" : "#ff6b6b", fontSize: 12 }}>
                    {margin !== null ? `$${margin.toFixed(0)}` : "—"}
                  </td>
                  <td style={{ fontSize: 11 }}>
                    {item.sourceUrl ? (
                      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--c-muted)", textDecoration: "none" }}>
                        {item.competitorName || "link"} {item.sourcePrice ? `$${item.sourcePrice}` : ""}
                      </a>
                    ) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <div style={{ width: 280, fontSize: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>${order.subtotal.toFixed(0)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Delivery</span><span>${order.deliveryFee.toFixed(0)}</span></div>
            {order.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981" }}><span>Discount</span><span>-${order.discount.toFixed(0)}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 17, paddingTop: 8, borderTop: "1px solid var(--c-border)" }}><span>Total</span><span>${order.total.toFixed(0)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: profit >= 0 ? "#10b981" : "#ff6b6b" }}>
              <span>Est. Profit ⓐ</span><span>${profit.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BOX: React.CSSProperties = { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", padding: 20, marginBottom: 0 };
const BOXT: React.CSSProperties = { fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "var(--c-muted)", marginBottom: 12 };
