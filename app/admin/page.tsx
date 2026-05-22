import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatsCards, QuickActions, SectionTitle, InlineIcon, StatusBadge } from "@/components/admin/AdminDashboardClient";

export default async function AdminDashboard() {
  const [products, orders, users, categories] = await Promise.all([
    prisma.product.count().catch(() => 0),
    prisma.order.count().catch(() => 0),
    prisma.user.count().catch(() => 0),
    prisma.category.count().catch(() => 0),
  ]);

  const [recentOrders, topProducts, categoryTree, competitors] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: { include: { product: { select: { title: true } } } } },
    }).catch(() => []),
    prisma.product.findMany({
      orderBy: { orderCount: "desc" },
      take: 5,
      select: { id: true, title: true, displayPrice: true, orderCount: true, images: true },
    }).catch(() => []),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: true } },
        children: { include: { _count: { select: { products: true } } } },
      },
    }).catch(() => []),
    prisma.competitor.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, _count: { select: { products: true, competitorProducts: true } } },
    }).catch(() => []),
  ]);

  const revenue = await prisma.order.aggregate({
    _sum: { total: true },
    where: { paymentStatus: "paid" },
  }).catch(() => ({ _sum: { total: 0 } }));

  const STATS = [
    { label: "Total Products", value: products.toLocaleString(), icon: "📦", color: "#00c8ff", href: "/admin/products" },
    { label: "Total Orders", value: orders.toLocaleString(), icon: "🛒", color: "#7c3aff", href: "/admin/orders" },
    { label: "Revenue (Paid)", value: `$${(revenue._sum.total || 0).toFixed(0)}`, icon: "💰", color: "#00e676", href: "/admin/orders" },
    { label: "Customers", value: users.toLocaleString(), icon: "👥", color: "#ffc107", href: "/admin/users" },
  ];

  const QUICK_ACTIONS = [
    { href: "/admin/products/new", label: "➕ Add Product", primary: true },
    { href: "/admin/tools", label: "🛠️ Import Tools", primary: true },
    { href: "/admin/settings?tab=api-keys", label: "🔑 API Keys", primary: false },
    { href: "/admin/categories", label: "🗂️ Categories", primary: false },
    { href: "/admin/competitors", label: "🔍 Competitors", primary: false },
    { href: "/admin/banners", label: "🖼️ Banners", primary: false },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 10 }}>
          Admin Galaxy <InlineIcon emoji="🌌" size={28} />
        </h1>
        <p style={{ color: "var(--c-muted)", marginTop: 4 }}>Welcome back. Here&apos;s what&apos;s happening with Technodel.</p>
      </div>

      {/* Stat cards */}
      <StatsCards stats={STATS} />

      {/* Grid: recent orders + quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, marginBottom: 32 }}>

        {/* Recent Orders */}
        <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Orders</h3>
            <Link href="/admin/orders" style={{ fontSize: 12, color: "var(--c-accent)", textDecoration: "none" }}>View all →</Link>
          </div>
          <table className="tn-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--c-muted)", padding: "32px 0" }}>No orders yet</td></tr>
              ) : recentOrders.map((o: any) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/orders/${o.id}`} style={{ color: "var(--c-accent)", textDecoration: "none", fontWeight: 600 }}>{o.orderNumber}</Link></td>
                  <td style={{ color: "var(--c-muted)" }}>{o.guestName || "Customer"}</td>
                  <td style={{ fontWeight: 600 }}>${o.total.toFixed(0)}</td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
            <QuickActions items={QUICK_ACTIONS} />
          </div>

          {/* Top products */}
          <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <SectionTitle emoji="🏆" text="Top Products" />
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topProducts.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--c-muted)" }}>No products yet</p>
              ) : topProducts.map((p: any, i: number) => {
                let img = "";
                try { img = JSON.parse(p.images)[0] || ""; } catch {}
                return (
                  <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--c-muted)", width: 16, textAlign: "center" }}>{i + 1}</span>
                    {img && <img src={img} alt={p.title} style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 4, background: "var(--c-surface2)" }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: "var(--c-muted)" }}>{p.orderCount} orders · ${p.displayPrice}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Tree + Competitors row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* Category Tree */}
        <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <SectionTitle emoji="🗂️" text={`Catalog Tree (${categories})`} />
            </h3>
            <Link href="/admin/categories" style={{ fontSize: 12, color: "var(--c-accent)", textDecoration: "none" }}>Manage →</Link>
          </div>
          {categoryTree.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--c-muted)" }}>No categories yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {categoryTree.map((cat: any) => (
                <div key={cat.id}>
                  <Link
                    href={`/admin/products?category=${cat.id}`}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderRadius: 6, textDecoration: "none", color: "var(--c-text)", background: "var(--c-surface2, rgba(255,255,255,0.03))", marginBottom: 2, fontWeight: 600, fontSize: 13 }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <InlineIcon emoji="📁" size={14} /> {cat.name}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 400 }}>{cat._count.products} products</span>
                  </Link>
                  {cat.children?.map((child: any) => (
                    <Link
                      key={child.id}
                      href={`/admin/products?category=${child.id}`}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 10px 5px 28px", borderRadius: 6, textDecoration: "none", color: "var(--c-text)", fontSize: 12, marginBottom: 1 }}
                    >
                      <span style={{ color: "var(--c-muted)" }}>↳ {child.name}</span>
                      <span style={{ fontSize: 11, color: "var(--c-muted)" }}>{child._count.products}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Competitors */}
        <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <SectionTitle emoji="🔍" text={`Competitors (${competitors.length})`} />
            </h3>
            <Link href="/admin/competitors" style={{ fontSize: 12, color: "var(--c-accent)", textDecoration: "none" }}>Manage →</Link>
          </div>
          {competitors.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--c-muted)" }}>No competitors added yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {competitors.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/admin/competitors/${c.id}`}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--c-border)", textDecoration: "none", color: "var(--c-text)" }}
                >
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</span>
                  <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--c-muted)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <InlineIcon emoji="📦" size={12} /> {c._count.products} cloned
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <InlineIcon emoji="🔍" size={12} /> {c._count.competitorProducts} scanned
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link href="/admin/tools" className="btn btn-primary" style={{ width: "100%", marginTop: 16, justifyContent: "center", display: "flex", alignItems: "center", gap: 8 }}>
            <InlineIcon emoji="🛠️" size={16} /> Open Import Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
