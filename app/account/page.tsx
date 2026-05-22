"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import { Icon } from "@/components/ui/Icon";
import { fadeInUp, staggerContainer } from "@/lib/animations";

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: { id: string; title: string; qty: number; price: number }[];
}

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logout, fetchUser } = useAuthStore();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetch("/api/orders?limit=5")
        .then((r) => r.json())
        .then((data) => {
          if (data.orders) setOrders(data.orders);
        })
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }
  }, [user]);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.push("/");
    router.refresh();
  }

  if (loading || !user) {
    return (
      <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          style={{ fontSize: 48, marginBottom: 16 }}
        >
          ⏳
        </motion.div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "#f59e0b",
    confirmed: "#3b82f6",
    shipped: "#8b5cf6",
    delivered: "#10b981",
    cancelled: "#ef4444",
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 80px" }}
    >
      {/* Header */}
      <motion.div variants={fadeInUp} style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>My Account</h1>
        <p style={{ color: "var(--c-muted)", fontSize: 14 }}>
          Welcome back, {user.name || user.email}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={fadeInUp} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        <StatCard icon="⭐" label="Reward Points" value={user.rewardPoints.toString()} sub="Earn more with every order" color="#f59e0b" />
        <StatCard icon="📦" label="Total Orders" value={orders.length.toString()} sub="Your order history" color="#3b82f6" />
        <StatCard icon="❤️" label="Wishlist" value="View" sub="Saved items" color="#ef4444" href="/account/wishlist" />
        <StatCard icon="⚡" label="Shopping" value="Shop Now" sub="Browse our catalog" color="#10b981" href="/shop" />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeInUp} style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
        <Link href="/account/orders" className="btn btn-primary">
          📦 View All Orders
        </Link>
        <Link href="/account/wishlist" className="btn btn-ghost">
          ❤️ My Wishlist
        </Link>
        <Link href="/shop" className="btn btn-ghost">
          🛍️ Continue Shopping
        </Link>
        <button onClick={handleLogout} disabled={loggingOut} className="btn btn-ghost" style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}>
          {loggingOut ? "Signing out..." : "🚪 Sign Out"}
        </button>
      </motion.div>

      {/* Recent Orders */}
      <motion.div variants={fadeInUp} style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Recent Orders</h2>
          <Link href="/account/orders" style={{ fontSize: 13, color: "var(--c-accent)", textDecoration: "none", fontWeight: 600 }}>
            View All →
          </Link>
        </div>

        {ordersLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--c-muted)" }}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <p style={{ color: "var(--c-muted)", marginBottom: 16 }}>No orders yet</p>
            <Link href="/shop" className="btn btn-primary btn-sm">Start Shopping</Link>
          </div>
        ) : (
          <div>
            {orders.map((order, i) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "16px 24px", borderBottom: i < orders.length - 1 ? "1px solid var(--c-border)" : "none",
                  textDecoration: "none", color: "inherit", transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,200,255,0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{order.orderNumber}</div>
                  <div style={{ fontSize: 12, color: "var(--c-muted)" }}>
                    {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    {" · "}{order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                    background: `${statusColors[order.status] || "#888"}20`,
                    color: statusColors[order.status] || "#888",
                  }}>
                    {order.status}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>${order.total.toFixed(0)}</span>
                  <span style={{ color: "var(--c-muted)", fontSize: 14 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, sub, color, href }: {
  icon: string; label: string; value: string; sub: string; color: string; href?: string;
}) {
  const content = (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      style={{
        background: "var(--c-surface)", border: "1px solid var(--c-border)",
        borderRadius: "var(--r-lg)", padding: "20px 24px",
        cursor: href ? "pointer" : "default",
        transition: "all 0.2s",
      }}
    >
      <div style={{ marginBottom: 8, display: "inline-flex" }}><Icon emoji={icon} size={28} /></div>
      <div style={{ fontSize: 12, color: "var(--c-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--c-muted)" }}>{sub}</div>
    </motion.div>
  );

  if (href) {
    return <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>{content}</Link>;
  }
  return content;
}
