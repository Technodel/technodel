"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import { useWishlistStore } from "@/store/wishlist";
import { useCurrencyStore } from "@/store/currency";
import { useCartStore } from "@/store/cart";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { sanitizeProductBrand } from "@/lib/brand";

export default function WishlistPage() {
  const router = useRouter();
  const { user, loading: authLoading, fetchUser } = useAuthStore();
  const { items, loading, fetch, remove } = useWishlistStore();
  const { format } = useCurrencyStore();
  const addToCart = useCartStore((s) => s.add);

  useEffect(() => { fetchUser(); }, [fetchUser]);
  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);
  useEffect(() => { if (user) fetch(); }, [user, fetch]);

  function handleAddToCart(item: typeof items[0]) {
    let img = "";
    try { const imgs = JSON.parse(item.product.images); img = imgs[0] || ""; } catch {}
    addToCart({
      productId: item.productId,
      slug: item.product.slug,
      title: item.product.title,
      price: item.product.displayPrice,
      imageUrl: img,
      quantity: 1,
    });
  }

  if (authLoading || !user) {
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
      <motion.div variants={fadeInUp} style={{ marginBottom: 24 }}>
        <Link href="/account" style={{ fontSize: 13, color: "var(--c-muted)", textDecoration: "none" }}>← Back to Account</Link>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, marginTop: 8 }}>❤️ My Wishlist</h1>
        <p style={{ color: "var(--c-muted)", fontSize: 14 }}>{items.length} saved item{items.length !== 1 ? "s" : ""}</p>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--c-muted)" }}>Loading wishlist...</div>
      ) : items.length === 0 ? (
        <motion.div variants={fadeInUp} style={{ textAlign: "center", padding: 60, background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-lg)" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🤍</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Your wishlist is empty</h2>
          <p style={{ color: "var(--c-muted)", marginBottom: 24 }}>Save your favorite products and shop them later.</p>
          <Link href="/shop" className="btn btn-primary btn-lg">Browse Products →</Link>
        </motion.div>
      ) : (
        <motion.div variants={fadeInUp} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {items.map((item) => {
            let img = "";
            try { const imgs = JSON.parse(item.product.images); img = imgs[0] || ""; } catch {}
            const safeBrand = sanitizeProductBrand(item.product.brand);
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  background: "var(--c-surface)", border: "1px solid var(--c-border)",
                  borderRadius: "var(--r-lg)", overflow: "hidden",
                  transition: "all 0.2s",
                }}
              >
                <Link href={`/product/${encodeURIComponent(item.product.slug)}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{
                    height: 180, background: "var(--c-surface2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 16,
                  }}>
                    {img ? (
                      <img src={img} alt={item.product.title}
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    ) : (
                      <span style={{ fontSize: 48 }}>📦</span>
                    )}
                  </div>
                </Link>
                <div style={{ padding: 16 }}>
                  {safeBrand && (
                    <div style={{ fontSize: 11, color: "var(--c-accent)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                      {safeBrand}
                    </div>
                  )}
                  <Link href={`/product/${encodeURIComponent(item.product.slug)}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {item.product.title}
                    </h3>
                  </Link>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--c-accent)", marginBottom: 12 }}>
                    {format(item.product.displayPrice)}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleAddToCart(item)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                    >
                      🛒 Add to Cart
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => remove(item.productId)}
                      style={{
                        padding: "8px 12px", borderRadius: "var(--r-sm)",
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                        color: "#ef4444", cursor: "pointer", fontSize: 14,
                      }}
                      aria-label="Remove from wishlist"
                    >
                      🗑️
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
