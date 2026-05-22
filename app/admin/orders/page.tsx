import { prisma } from "@/lib/prisma";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1"));
  const status = sp.status;
  const limit = 50;

  const where: any = {};
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: { select: { title: true, images: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }).catch(() => []),
    prisma.order.count({ where }).catch(() => 0),
  ]);

  const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
  const STATUS_COLORS: Record<string, string> = {
    pending: "#ffc107", confirmed: "#00c8ff", processing: "#7c3aff",
    shipped: "#00e676", delivered: "#00e676", cancelled: "#ff4444",
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Orders</h1>
        <p style={{ color: "var(--c-muted)", marginTop: 4 }}>{total.toLocaleString()} total orders</p>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {[{ value: "", label: "All" }, ...STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))].map((s) => (
          <a
            key={s.value}
            href={`/admin/orders${s.value ? `?status=${s.value}` : ""}`}
            style={{
              padding: "6px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600,
              textDecoration: "none", border: "1px solid",
              borderColor: status === s.value || (!s.value && !status) ? "var(--c-accent)" : "var(--c-border)",
              background: status === s.value || (!s.value && !status) ? "rgba(0,200,255,0.1)" : "none",
              color: status === s.value || (!s.value && !status) ? "var(--c-accent)" : "var(--c-muted)",
            }}
          >
            {s.label}
          </a>
        ))}
      </div>

      {/* Orders table */}
      <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
        <table className="tn-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "48px 0", color: "var(--c-muted)" }}>No orders yet</td></tr>
            ) : orders.map((o) => (
              <tr key={o.id}>
                <td><span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 13 }}>{o.orderNumber}</span></td>
                <td>
                  <div style={{ fontSize: 14 }}>{o.guestName || "Customer"}</div>
                  {o.guestPhone && <div style={{ fontSize: 12, color: "var(--c-muted)" }}>{o.guestPhone}</div>}
                </td>
                <td style={{ fontSize: 13 }}>
                  {o.items.slice(0, 2).map((item) => (
                    <div key={item.id} style={{ color: "var(--c-muted)" }}>
                      {item.product?.title ? item.product.title.slice(0, 30) + (item.product.title.length > 30 ? "…" : "") : "Product"} ×{item.qty}
                      {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4, fontSize: 11, color: "var(--c-accent)" }}>↗src</a>}
                    </div>
                  ))}
                  {o.items.length > 2 && <div style={{ fontSize: 12, color: "var(--c-muted)" }}>+{o.items.length - 2} more</div>}
                </td>
                <td style={{ fontWeight: 700 }}>${o.total.toFixed(0)}</td>
                <td style={{ fontSize: 12, textTransform: "capitalize" }}>{o.paymentMethod}</td>
                <td>
                  <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[o.status] || "var(--c-muted)", textTransform: "capitalize" }}>
                    {o.status}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: "var(--c-muted)" }}>
                  {new Date(o.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <a href={`/admin/orders/${o.id}`} className="btn btn-ghost btn-sm">View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
