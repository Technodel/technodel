"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cart";
import { useCurrencyStore } from "@/store/currency";
import DeliveryPicker from "@/components/ui/DeliveryPicker";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export default function CartPage() {
  const { items, remove, update, count, total, clear } = useCartStore();
  const { format } = useCurrencyStore();
  const [deliveryFee, setDeliveryFee] = useState(2.5);
  const [deliveryZone, setDeliveryZone] = useState("Lebanon");
  const router = useRouter();

  if (count() === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ maxWidth: 600, margin: "80px auto", textAlign: "center", padding: "0 24px" }}
      >
        <motion.div
          style={{ fontSize: 80, marginBottom: 16 }}
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          🛒
        </motion.div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Your cart is empty</h1>
        <p style={{ color: "var(--c-muted)", marginBottom: 32 }}>Add some awesome tech to your cart!</p>
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Link href="/shop" className="btn btn-primary btn-lg">Start Shopping →</Link>
        </motion.div>
      </motion.div>
    );
  }

  const subtotal = total();
  const grandTotal = subtotal + deliveryFee;

  const whatsappText =
    `Hi Technodel, I'd like to order:\n` +
    items
      .map(
        (i) =>
          `• ${i.title}${i.variantLabel ? ` (${i.variantLabel})` : ""} × ${i.quantity} = ${format(i.price * i.quantity)}`
      )
      .join("\n") +
    `\n\nSubtotal: ${format(subtotal)}\nDelivery: ${format(deliveryFee)} (${deliveryZone})\nTotal: ${format(grandTotal)}`;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "32px 24px 80px" }}
    >
      <motion.h1 variants={fadeInUp} style={{ fontSize: 28, fontWeight: 800, marginBottom: 32 }}>
        🛒 Shopping Cart ({count()} items)
      </motion.h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 }}>
        {/* Items */}
        <motion.div variants={staggerContainer} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={`${item.productId}-${item.variantId}`}
                layout
                initial={{ opacity: 0, x: -30, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 30, height: 0 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                style={{
                  display: "flex", gap: 16, background: "var(--c-surface)",
                  border: "1px solid var(--c-border)", borderRadius: "var(--r-md)",
                  padding: 16, alignItems: "center", overflow: "hidden",
                }}
              >
                {/* Image */}
                <motion.div
                  style={{
                    width: 80, height: 80, flexShrink: 0,
                    background: "var(--c-surface2)", borderRadius: "var(--r-sm)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    <span style={{ fontSize: 32 }}>📦</span>
                  )}
                </motion.div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link
                    href={`/product/${item.slug}`}
                    style={{
                      fontWeight: 700, fontSize: 15, color: "var(--c-text)",
                      textDecoration: "none", display: "block",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                  >
                    {item.title}
                  </Link>
                  {item.variantLabel && (
                    <div style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 2 }}>
                      {item.variantLabel}
                    </div>
                  )}
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--c-accent)", marginTop: 4 }}>
                    {format(item.price)}
                  </div>
                </div>

                {/* Qty stepper */}
                <motion.div
                  style={{
                    display: "flex", alignItems: "center", gap: 0,
                    border: "1px solid var(--c-border)", borderRadius: "var(--r-sm)",
                    overflow: "hidden",
                  }}
                >
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => update(item.productId, Math.max(1, item.quantity - 1), item.variantId)}
                    style={{
                      width: 36, height: 36, background: "var(--c-surface2)",
                      border: "none", cursor: "pointer", fontSize: 16, color: "var(--c-text)",
                    }}
                  >
                    −
                  </motion.button>
                  <motion.div
                    key={item.quantity}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    style={{
                      width: 36, textAlign: "center", fontSize: 14, fontWeight: 700,
                    }}
                  >
                    {item.quantity}
                  </motion.div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => update(item.productId, item.quantity + 1, item.variantId)}
                    style={{
                      width: 36, height: 36, background: "var(--c-surface2)",
                      border: "none", cursor: "pointer", fontSize: 16, color: "var(--c-text)",
                    }}
                  >
                    +
                  </motion.button>
                </motion.div>

                {/* Line total */}
                <motion.div
                  key={item.price * item.quantity}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  style={{ fontWeight: 800, fontSize: 16, minWidth: 80, textAlign: "right" }}
                >
                  {format(item.price * item.quantity)}
                </motion.div>

                {/* Remove */}
                <motion.button
                  whileHover={{ scale: 1.2, color: "#ff4444" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => remove(item.productId, item.variantId)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 18, color: "var(--c-muted)", padding: 4, transition: "color 0.2s",
                  }}
                >
                  ✕
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.div variants={fadeInUp} style={{ display: "flex", justifyContent: "space-between" }}>
            <motion.div whileHover={{ x: -4 }}>
              <Link href="/shop" className="btn btn-ghost">← Continue Shopping</Link>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={clear}
              className="btn btn-ghost"
              style={{ color: "var(--c-danger)" }}
            >
              Clear Cart
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Summary */}
        <motion.div
          variants={fadeInUp}
          style={{
            background: "var(--c-surface)", border: "1px solid var(--c-border)",
            borderRadius: "var(--r-lg)", padding: 28,
            alignSelf: "flex-start", position: "sticky", top: 90,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Order Summary</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            <Row label="Subtotal" value={format(subtotal)} />

            {/* Delivery zone picker */}
            <div>
              <div style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 6 }}>
                🚚 Delivery Region
              </div>
              <DeliveryPicker
                subtotal={subtotal}
                onDeliveryChange={(fee, zone) => {
                  setDeliveryFee(fee);
                  setDeliveryZone(zone);
                }}
              />
            </div>

            <div style={{ borderTop: "1px solid var(--c-border)", paddingTop: 12 }}>
              <Row label="Total" value={format(grandTotal)} large />
            </div>

            {deliveryFee === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  fontSize: 12, color: "#00e676", fontWeight: 600,
                  textAlign: "center", padding: "6px",
                  background: "rgba(0,230,118,0.08)",
                  borderRadius: "var(--r-sm)",
                }}
              >
                🎉 Free delivery to {deliveryZone}!
              </motion.div>
            )}
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <button
              onClick={() => router.push("/checkout")}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginBottom: 12 }}
            >
              Proceed to Checkout →
            </button>
          </motion.div>

          {/* WhatsApp order */}
          <motion.a
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, width: "100%",
            }}
          >
            <motion.span
              style={{ fontSize: 16 }}
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              💬
            </motion.span>
            Order via WhatsApp
          </motion.a>

          <div style={{
            marginTop: 16, fontSize: 11, color: "var(--c-muted)",
            textAlign: "center", lineHeight: 1.6,
          }}>
            Cash on delivery · Wish Money · Crypto (USDT/BTC) accepted
            <br />
            🔄 7-day return policy
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function Row({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <span
          style={{
            fontSize: large ? 16 : 14,
            fontWeight: large ? 700 : 400,
            color: large ? "var(--c-text)" : "var(--c-muted)",
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: large ? 20 : 14,
          fontWeight: large ? 800 : 600,
          color: large ? "var(--c-accent)" : "var(--c-text)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
