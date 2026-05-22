"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import { fadeInUp, staggerContainer } from "@/lib/animations";

interface OrderItem {
  id: string; title: string; qty: number; price: number; total: number; imageUrl: string | null;
}

interface Order {
  id: string; orderNumber: string; status: string; paymentMethod: string; total: number;
  createdAt: string; items: OrderItem[];
}

export default function AccountOrdersPage() {
  const router = useRouter();
  const { user, loading, fetchUser } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    fetch(`/api/orders?page=${page}&limit=10`)
      .then((r) => r.json())
      .then((data) => {
        if (data.orders) { setOrders(data.orders); setTotalPages(data.pages || 1); }
      })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [user, page]);

  const statusColors: Record<string, string> = {
    pending: "#f59e0b", confirmed: "#3b82f6", shipped: "#8b5cf6",
    delivered: "#10b981", cancelled: "#ef4444",
  };

  if (loading || !user) {
    return (
      <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} style={{ fontSize: 48 }}>⏳</motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 80px" }}
    >
      <motion.div variants={fadeInUp} style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Link href="/account" style={{ fontSize: 13, color: "var(--c-muted)", textDecoration: "none" }}>← Back to Account</Link>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, marginTop: 8 }}>My Orders</h1>
          <p style={{ color: "var(--c-muted)", fontSize: 14 }}>Track and manage your orders</p>
        </div>
      </motion.div>

      {ordersLoading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--c-muted)" }}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <motion.div variants={fadeInUp} style={{ textAlign: "center", padding: 60, background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-lg)" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No orders yet</h2>
          <p style={{ color: "var(--c-muted)", marginBottom: 24 }}>Your order history will appear here once you make a purchase.</p>
          <Link href="/shop" className="btn btn-primary btn-lg">Start Shopping →</Link>
        </motion.div>
      ) : (
        <>
          <motion.div variants={fadeInUp} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                style={{
                  background: "var(--c-surface)", border: "1px solid var(--c-border)",
                  borderRadius: "var(--r-lg)", padding: "20px 24px",
                  textDecoration: "none", color: "inherit",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--c-accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--c-border)")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{order.orderNumber}</div>
                    <div style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 2 }}>
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      padding: "3px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                      background: `${statusColors[order.status] || "#888"}20`,
                      color: statusColors[order.status] || "#888",
                      display: "inline-block", marginBottom: 4,
                    }}>
                      {order.status}
                    </span>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>${order.total.toFixed(0)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {order.items.slice(0, 4).map((item) => (
                    <div key={item.id} style={{
                      fontSize: 13, color: "var(--c-muted)",
                      background: "rgba(255,255,255,0.03)", padding: "4px 10px",
                      borderRadius: "var(--r-sm)",
                    }}>
                      {item.title} ×{item.qty}
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div style={{ fontSize: 13, color: "var(--c-muted)", padding: "4px 10px" }}>
                      +{order.items.length - 4} more
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div variants={fadeInUp} style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-ghost btn-sm"
              >
                ← Prev
              </button>
              <span style={{ padding: "8px 16px", fontSize: 14, color: "var(--c-muted)" }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-ghost btn-sm"
              >
                Next →
              </button>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
