"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { apiPath } from "@/lib/api-path";

interface OrderItemData {
  id: string; title: string; qty: number; price: number; total: number;
  imageUrl: string | null; product: { id: string; slug: string; images: string; brand: string | null };
}

interface Order {
  id: string; orderNumber: string; status: string; paymentMethod: string;
  paymentStatus: string; subtotal: number; deliveryFee: number; discount: number;
  rewardUsed: number; total: number; shippingAddress: string | null; note: string | null;
  createdAt: string; items: OrderItemData[];
  address: { fullName: string; phone: string; line1: string; line2: string | null; city: string } | null;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading, fetchUser } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !params.id) return;
    setPageLoading(true);
    fetch(apiPath(`/api/orders/${params.id}`))
      .then((r) => r.json())
      .then((data) => {
        if (data.order) setOrder(data.order);
        else setError(data.error || "Order not found");
      })
      .catch(() => setError("Failed to load order"))
      .finally(() => setPageLoading(false));
  }, [user, params.id]);

  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
    confirmed: { bg: "rgba(59,130,246,0.15)", text: "#3b82f6" },
    shipped: { bg: "rgba(139,92,246,0.15)", text: "#8b5cf6" },
    delivered: { bg: "rgba(16,185,129,0.15)", text: "#10b981" },
    cancelled: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
  };

  function getFirstImage(images: string): string {
    try { const arr = JSON.parse(images); return arr[0] || ""; } catch { return ""; }
  }

  if (loading || pageLoading) {
    return (
      <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} style={{ fontSize: 48 }}>⏳</motion.div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>😕</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Order not found</h2>
        <p style={{ color: "var(--c-muted)", marginBottom: 24 }}>{error}</p>
        <Link href="/account/orders" className="btn btn-primary">← My Orders</Link>
      </div>
    );
  }

  const sc = statusColors[order.status] || { bg: "rgba(136,136,136,0.15)", text: "#888" };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px 80px" }}
    >
      <motion.div variants={fadeInUp} style={{ marginBottom: 24 }}>
        <Link href="/account/orders" style={{ fontSize: 13, color: "var(--c-muted)", textDecoration: "none" }}>← All Orders</Link>
      </motion.div>

      {/* Order header */}
      <motion.div variants={fadeInUp} style={{
        background: "var(--c-surface)", border: "1px solid var(--c-border)",
        borderRadius: "var(--r-lg)", padding: 24, marginBottom: 24,
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{order.orderNumber}</h1>
          <p style={{ color: "var(--c-muted)", fontSize: 13 }}>
            Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{
            padding: "6px 16px", borderRadius: 99, fontSize: 13, fontWeight: 700,
            background: sc.bg, color: sc.text, display: "inline-block",
          }}>
            {order.status.toUpperCase()}
          </span>
          <div style={{ fontSize: 13, color: "var(--c-muted)", marginTop: 4 }}>
            Payment: {order.paymentStatus}
          </div>
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
        {/* Items */}
        <motion.div variants={fadeInUp} style={{
          background: "var(--c-surface)", border: "1px solid var(--c-border)",
          borderRadius: "var(--r-lg)", overflow: "hidden",
        }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--c-border)", fontWeight: 700 }}>
            Items ({order.items.length})
          </div>
          {order.items.map((item, i) => (
            <div key={item.id} style={{
              display: "flex", gap: 12, padding: "16px 20px",
              borderBottom: i < order.items.length - 1 ? "1px solid var(--c-border)" : "none",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: "var(--r-sm)",
                background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", flexShrink: 0,
              }}>
                {getFirstImage(item.product.images) ? (
                  <img src={getFirstImage(item.product.images)} alt={item.title}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <span style={{ fontSize: 24 }}>📦</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/product/${encodeURIComponent(item.product.slug)}`} style={{
                  fontWeight: 600, fontSize: 14, color: "inherit", textDecoration: "none",
                }}>
                  {item.title}
                </Link>
                {item.product.brand && (
                  <div style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 2 }}>{item.product.brand}</div>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>${item.price.toFixed(0)}</div>
                <div style={{ fontSize: 12, color: "var(--c-muted)" }}>×{item.qty}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, minWidth: 60 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>${item.total.toFixed(0)}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Summary */}
        <motion.div variants={fadeInUp} style={{
          background: "var(--c-surface)", border: "1px solid var(--c-border)",
          borderRadius: "var(--r-lg)", padding: 20, alignSelf: "flex-start",
        }}>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Order Summary</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
            <Row label="Subtotal" value={`$${order.subtotal.toFixed(0)}`} />
            <Row label="Delivery" value={`$${order.deliveryFee.toFixed(0)}`} />
            {order.rewardUsed > 0 && (
              <Row label="Rewards Used" value={`-$${order.rewardUsed.toFixed(0)}`} color="#10b981" />
            )}
            {order.discount > 0 && (
              <Row label="Discount" value={`-$${order.discount.toFixed(0)}`} color="#10b981" />
            )}
            <div style={{ borderTop: "1px solid var(--c-border)", paddingTop: 10 }}>
              <Row label="Total" value={`$${order.total.toFixed(0)}`} bold />
            </div>
          </div>

          {/* Payment method */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--c-border)" }}>
            <div style={{ fontSize: 12, color: "var(--c-muted)", fontWeight: 700, marginBottom: 4 }}>PAYMENT METHOD</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{order.paymentMethod}</div>
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: "var(--c-muted)", fontWeight: 700, marginBottom: 4 }}>SHIPPING ADDRESS</div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                {order.address?.fullName && <div>{order.address.fullName}</div>}
                {order.address?.phone && <div>{order.address.phone}</div>}
                <div>{order.shippingAddress}</div>
              </div>
            </div>
          )}

          {order.note && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: "var(--c-muted)", fontWeight: 700, marginBottom: 4 }}>NOTE</div>
              <div style={{ fontSize: 13, color: "var(--c-muted)" }}>{order.note}</div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

function Row({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "var(--c-muted)" }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: color || "inherit" }}>{value}</span>
    </div>
  );
}
