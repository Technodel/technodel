"use client";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useCartStore } from "@/store/cart";
import Link from "next/link";
import Image from "next/image";

type PaymentMethod = "cod" | "wish_money" | "crypto";

export default function CheckoutPage() {
  const { items, total, count, clear } = useCartStore();
  const [step, setStep] = useState<"info" | "payment" | "success">("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");

  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", city: "", note: "",
    paymentMethod: "cod" as PaymentMethod,
  });

  const subtotal = total();
  const DELIVERY = 2.5;
  const grandTotal = subtotal + DELIVERY;

  function set(key: string, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function submitOrder() {
    if (!form.name || !form.phone || !form.address) {
      setError("Please fill in name, phone, and address.");
      return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch("api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: form.name,
          guestPhone: form.phone,
          guestEmail: form.email,
          shippingAddress: `${form.address}, ${form.city}`,
          note: form.note,
          paymentMethod: form.paymentMethod,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            qty: i.quantity,
            price: i.price,
            title: i.title,
          })),
          subtotal,
          deliveryFee: DELIVERY,
          total: grandTotal,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Failed to place order."); return; }
      setOrderId(data.orderNumber);
      clear();
      if (form.paymentMethod === "crypto") {
        const cryptoMsg = encodeURIComponent(
          `Hi Technodel! Order #${data.orderNumber}\n\n` +
          items.map((i) => `• ${i.title} × ${i.quantity} = $${(i.price * i.quantity).toFixed(2)}`).join("\n") +
          `\n\nTotal: $${grandTotal.toFixed(2)}\n\nPlease share USDT (TRC20) wallet address for payment.`
        );
        window.open(`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${cryptoMsg}`, "_blank");
      }
      setStep("success");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  if (count() === 0 && step !== "success") {
    return (
      <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Your cart is empty</h1>
        <Link href="/shop" className="btn btn-primary btn-lg">Shop Now →</Link>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>✅</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Order Placed!</h1>
        <p style={{ color: "var(--c-muted)", marginBottom: 8 }}>Order #{orderId} has been received.</p>
        <p style={{ color: "var(--c-muted)", marginBottom: 32 }}>We&apos;ll contact you shortly to confirm delivery.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/" className="btn btn-ghost">← Home</Link>
          <Link href="/shop" className="btn btn-primary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "32px 24px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Checkout</h1>
        <Link href="/cart" style={{ fontSize: 13, color: "var(--c-muted)", textDecoration: "none" }}>← Back to cart</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 }}>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Contact info */}
          <Section title="📋 Contact Information">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Full Name *">
                <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Sami Darwich" />
              </Field>
              <Field label="Phone *">
                <input className="input" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+961 XX XXX XXX" />
              </Field>
            </div>
            <Field label="Email (optional)">
              <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="sami.darwich@example.com" />
            </Field>
          </Section>

          {/* Delivery */}
          <Section title="🚚 Delivery Address">
            <Field label="Address *">
              <input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, building, floor..." />
            </Field>
            <Field label="City / Region">
              <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Beirut, Tripoli, Sidon..." />
            </Field>
            <Field label="Order Notes (optional)">
              <textarea className="input" rows={2} value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Any special instructions..." style={{ resize: "vertical" }} />
            </Field>
          </Section>

          {/* Payment */}
          <Section title={<><Icon emoji="💳" size={18} /> Payment Method</>}>
            {[
              { id: "cod", icon: "💵", label: "Cash on Delivery", desc: "Pay when you receive your order" },
              { id: "wish_money", icon: "📱", label: "Wish Money", desc: "Transfer via OMT / Wish Money app" },
              { id: "crypto", icon: "🪙", label: "Crypto (USDT/BTC)", desc: "Pay with USDT, BTC, or ETH — zero fees" },
            ].map((pm: any) => (
              <label key={pm.id} style={{
                display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 16px",
                borderRadius: "var(--r-md)", border: `2px solid ${form.paymentMethod === pm.id ? "var(--c-accent)" : "var(--c-border)"}`,
                background: form.paymentMethod === pm.id ? "rgba(0,200,255,0.05)" : "none",
                cursor: "pointer", transition: "all 0.2s ease", marginBottom: 8,
              }}>
                <input
                  type="radio"
                  name="payment"
                  value={pm.id}
                  checked={form.paymentMethod === pm.id}
                  onChange={() => set("paymentMethod", pm.id)}
                  style={{ marginTop: 2, accentColor: "var(--c-accent)" }}
                />
                <span style={{ display: "inline-flex" }}><Icon emoji={pm.icon} size={24} /></span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{pm.label}</div>
                  <div style={{ fontSize: 13, color: "var(--c-muted)" }}>{pm.desc}</div>
                </div>
              </label>
            ))}
          </Section>

          {error && (
            <div style={{ padding: "12px 16px", background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.3)", borderRadius: "var(--r-sm)", fontSize: 14, color: "#ff6b6b" }}>
              {error}
            </div>
          )}

          <button onClick={submitOrder} className="btn btn-primary btn-lg" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Placing Order..." : form.paymentMethod === "crypto" ? "🪙 Place Order — Get Wallet Address" : "✅ Place Order"}
          </button>
        </div>

        {/* Order summary */}
        <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-lg)", padding: 24, alignSelf: "flex-start", position: "sticky", top: 90 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Order Summary</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {items.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={40}
                    height={40}
                    style={{ objectFit: "contain", borderRadius: 4, flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "var(--c-muted)" }}>×{item.quantity}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid var(--c-border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--c-muted)" }}>
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--c-muted)" }}>
              <span>Delivery</span><span>${DELIVERY.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, paddingTop: 8, borderTop: "1px solid var(--c-border)" }}>
              <span>Total</span><span style={{ color: "var(--c-accent)" }}>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string | React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-lg)", padding: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

