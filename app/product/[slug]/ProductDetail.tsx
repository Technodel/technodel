"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cart";
import { useCurrencyStore } from "@/store/currency";
import { useAuthStore } from "@/store/auth";
import { useWishlistStore } from "@/store/wishlist";
import ProductCard from "@/components/product/ProductCard";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { sanitizeProductBrand } from "@/lib/brand";
import { getDisplayStock } from "@/lib/utils";
import { normalizeMojibake } from "@/lib/product-copy";
import { getSupplierCode } from "@/lib/supplier-code";
import {
  staggerContainer, fadeInUp, fadeInRight, fadeInLeft,
  scaleIn, spring, sectionReveal,
} from "@/lib/animations";

function proxyUrl(src: string): string {
  if (!src || src.startsWith("/") || src.startsWith("data:")) return src;
  return `/new/api/img-proxy?url=${encodeURIComponent(src)}`;
}

interface Variant { id: string; label: string; value: string; priceAdj: number; stock: number; }
interface Review { id: string; rating: number; title?: string | null; body?: string | null; createdAt: Date | string; user: { id: string; name: string | null } | null; }
interface Product {
  id: string; slug: string; title: string; brand: string | null; sku: string;
  images: string[]; description: string | null; shortDescription: string | null;
  displayPrice: number; comparePrice: number | null; costPrice: number;
  seoEnriched?: boolean; seoKeywords?: string | null; orderCount?: number; viewCount?: number;
  category: { name: string; slug: string };
  specs: { label: string; value: string }[];
  highlights: string[];
  variants: Variant[];
  reviews: Review[];
  rating: number; reviewCount: number; stock: number; lowStockThresh?: number;
  isNew: boolean; isFeatured: boolean;
  verifiedUserIds?: string[];
  competitor?: { id: string; name: string; url: string; logoUrl?: string | null } | null;
  sourcePrice?: number | null;
  sourceUrl?: string | null;
}

export default function ProductDetail({ product, related }: { product: Product; related: any[] }) {
  const { format, convert } = useCurrencyStore();
  const [activeImg, setActiveImg] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgZoom, setImgZoom] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLDivElement>(null);
  const { add } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const { isInWishlist, add: addWish, remove: removeWish } = useWishlistStore();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(hover: none), (pointer: coarse)");
    const onChange = () => setIsTouchDevice(media.matches);
    onChange();

    if (media.addEventListener) {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  // ── Price Watch (localStorage) ────────────────────────────────────────
  const [isWatching, setIsWatching] = useState(false);
  const [priceDropped, setPriceDropped] = useState(false);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("tn-price-watch") || "{}");
      const entry = stored[product.id];
      if (entry) {
        setIsWatching(true);
        if (entry.price > product.displayPrice) {
          setPriceDropped(true);
          // Update to new price
          stored[product.id] = { price: product.displayPrice, at: Date.now() };
          localStorage.setItem("tn-price-watch", JSON.stringify(stored));
        }
      }
    } catch {}
  }, [product.id, product.displayPrice]);

  const togglePriceWatch = () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    try {
      const stored = JSON.parse(localStorage.getItem("tn-price-watch") || "{}");
      if (isWatching) {
        delete stored[product.id];
      } else {
        stored[product.id] = { price: product.displayPrice, at: Date.now() };
      }
      localStorage.setItem("tn-price-watch", JSON.stringify(stored));
      setIsWatching(!isWatching);
      setPriceDropped(false);
    } catch {}
  };

  // ── Viewing Count Simulation ──────────────────────────────────────────
  const [viewers, setViewers] = useState(0);
  useEffect(() => {
    // Simulate realistic viewing count based on stock/popularity
    const base = Math.min(23, Math.max(1, product.orderCount || 0));
    const variance = Math.floor(Math.random() * 7) - 3;
    setViewers(Math.max(1, base + variance));
    const interval = setInterval(() => {
      setViewers((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(1, Math.min(28, prev + delta));
      });
    }, 8000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, [product.id, product.orderCount]);

  const price = product.displayPrice + (selectedVariant?.priceAdj || 0);
  const savings = product.comparePrice ? product.comparePrice - price : 0;
  const discount = product.comparePrice ? Math.round((savings / product.comparePrice) * 100) : 0;
  const rawStock = selectedVariant?.stock ?? product.stock;
  const displayStock = getDisplayStock(rawStock, price, product.category.name);
  const inStock = rawStock > 0;
  const safeBrand = sanitizeProductBrand(product.brand, product.competitor?.name);
  const supplierCode = getSupplierCode({
    sourceUrl: product.sourceUrl || "",
    competitorName: product.competitor?.name || "",
    competitorUrl: product.competitor?.url || "",
    sku: product.sku,
  });
  
  // Consistent pseudo-random 5-digit number based on product ID to avoid hydration mismatch
  const randomSuffix = (Array.from(product.id || "").reduce((acc, char) => acc + char.charCodeAt(0), 0) * 317) % 90000 + 10000;
  const cleanShortDescription = normalizeMojibake(product.shortDescription || "");

  function handleMouseMove(e: React.MouseEvent) {
    if (isTouchDevice || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }

  function addToCart() {
    add({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price,
      imageUrl: product.images[0] || "",
      quantity: qty,
      variantId: selectedVariant?.id,
      variantLabel: selectedVariant ? `${selectedVariant.label}: ${selectedVariant.value}` : undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="product-detail-root"
      style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "clamp(14px, 4vw, 24px) clamp(12px, 4vw, 24px) 80px" }}
    >
      {/* Breadcrumb */}
      <motion.nav
        variants={fadeInUp}
        style={{ fontSize: 13, color: "var(--c-muted)", marginBottom: 24, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", overflowWrap: "anywhere" }}
      >
        <Link href="/" style={{ color: "var(--c-muted)", textDecoration: "none" }}>Home</Link>
        <span>›</span>
        <Link href={`/shop/${product.category.slug}`} style={{ color: "var(--c-muted)", textDecoration: "none" }}>{product.category.name}</Link>
        <span>›</span>
        <span style={{ color: "var(--c-text)" }}>{product.title}</span>
      </motion.nav>

      {/* Main grid */}
      <div className="product-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginBottom: 60 }}>
        {/* Images */}
        <motion.div variants={fadeInLeft}>
          {/* Main image with zoom */}
          <motion.div
            ref={imgRef}
            onMouseEnter={() => !isTouchDevice && setImgZoom(true)}
            onMouseLeave={() => !isTouchDevice && setImgZoom(false)}
            onMouseMove={handleMouseMove}
            style={{
              position: "relative", borderRadius: "var(--r-xl)", overflow: "hidden",
              aspectRatio: "1", background: "var(--c-surface)", marginBottom: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: isTouchDevice ? "default" : "crosshair",
            }}
            className="grad-border"
          >
            {product.images.length > 0 ? (
              <>
                <motion.div
                  key={activeImg}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ position: "absolute", inset: 0, padding: 20 }}
                >
                  <OptimizedImage
                    src={product.images[activeImg]}
                    alt={product.title}
                    fill
                    priority
                    objectFit="contain"
                  />
                </motion.div>
                {/* Lens magnifier */}
                <AnimatePresence>
                  {imgZoom && !isTouchDevice && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        position: "absolute", inset: 0, pointerEvents: "none",
                        backgroundImage: `url(${proxyUrl(product.images[activeImg])})`,
                        backgroundSize: "200% 200%",
                        backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      }}
                    />
                  )}
                </AnimatePresence>
              </>
            ) : (
              <motion.span
                style={{ fontSize: 80 }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                📦
              </motion.span>
            )}
            <motion.span
              className="badge badge-new"
              style={{ position: "absolute", top: 12, left: 12 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {product.isNew && "New"}
            </motion.span>
            {discount > 0 && (
              <motion.span
                className="badge badge-sale"
                style={{ position: "absolute", top: 12, right: 12 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
              >
                -{discount}%
              </motion.span>
            )}
          </motion.div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <motion.div
              variants={staggerContainer}
              style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
            >
              {product.images.map((img, i) => (
                <motion.button
                  key={i}
                  variants={scaleIn}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: 64, height: 64, padding: 4, borderRadius: "var(--r-sm)",
                    border: `2px solid ${i === activeImg ? "var(--c-accent)" : "var(--c-border)"}`,
                    background: "var(--c-surface)", cursor: "pointer",
                    transition: "border-color 0.2s ease",
                    position: "relative", overflow: "hidden",
                  }}
                >
                  <OptimizedImage
                    src={img}
                    alt={`${product.title} ${i + 1}`}
                    fill
                    objectFit="contain"
                  />
                </motion.button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div variants={fadeInRight}>
          {safeBrand && (
            <motion.div
              variants={fadeInUp}
              style={{ fontSize: 12, color: "var(--c-accent)", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}
            >
              {safeBrand.toUpperCase()}
            </motion.div>
          )}

          <motion.h1
            variants={fadeInUp}
            style={{ fontSize: "clamp(20px, 2.5vw, 30px)", fontWeight: 800, lineHeight: 1.25, marginBottom: 12, letterSpacing: "-0.3px" }}
          >
            {product.title}
          </motion.h1>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <motion.div variants={fadeInUp} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <motion.div
                style={{ display: "flex", gap: 2 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.08, delay: 0.3 }}
              >
                {[1, 2, 3, 4, 5].map((s, i) => (
                  <motion.span
                    key={s}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 300 }}
                    style={{ color: s <= Math.round(product.rating) ? "#ffc107" : "var(--c-border)", fontSize: 16 }}
                  >
                    ★
                  </motion.span>
                ))}
              </motion.div>
              <span style={{ fontSize: 13, color: "var(--c-muted)" }}>
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </motion.div>
          )}

          {/* Price */}
          <motion.div variants={fadeInUp} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <motion.span
                key={price}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                style={{ fontSize: 36, fontWeight: 900, color: "var(--c-accent)" }}
              >
                {format(price)}
              </motion.span>
              {product.comparePrice && (
                <span style={{ fontSize: 20, color: "var(--c-muted)", textDecoration: "line-through" }}>
                  {format(product.comparePrice)}
                </span>
              )}
            </div>
            {savings > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ fontSize: 13, color: "#00e676", fontWeight: 600, marginTop: 4 }}
              >
                Save {format(savings)} ({discount}% off)
              </motion.div>
            )}
          </motion.div>

          {/* Short description */}
          {product.shortDescription && (
            <motion.p
              variants={fadeInUp}
              style={{ fontSize: 15, color: "var(--c-muted)", lineHeight: 1.7, marginBottom: 20 }}
            >
              {cleanShortDescription}
            </motion.p>
          )}

          {/* Highlights */}
          {product.highlights.length > 0 && (
            <motion.ul
              variants={staggerContainer}
              style={{ marginBottom: 24, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}
            >
              {product.highlights.map((h, i) => (
                <motion.li
                  key={i}
                  variants={fadeInUp}
                  custom={i}
                  style={{ fontSize: 14, color: "var(--c-muted)", display: "flex", gap: 8, alignItems: "flex-start" }}
                  whileHover={{ x: 4 }}
                >
                  <motion.span
                    style={{ color: "var(--c-accent)", flexShrink: 0 }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.05, type: "spring" }}
                  >
                    ✓
                  </motion.span>
                  {h}
                </motion.li>
              ))}
            </motion.ul>
          )}

          {/* Variants */}
          {product.variants.length > 0 && (
            <motion.div variants={fadeInUp} style={{ marginBottom: 20 }}>
              {Array.from(new Set(product.variants.map((v) => v.label))).map((label) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-muted)", marginBottom: 8, textTransform: "uppercase" }}>
                    {label}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {product.variants.filter((v) => v.label === label).map((v) => (
                      <motion.button
                        key={v.id}
                        whileHover={v.stock > 0 ? { scale: 1.05 } : {}}
                        whileTap={v.stock > 0 ? { scale: 0.95 } : {}}
                        onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? null : v)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "var(--r-sm)",
                          border: `2px solid ${selectedVariant?.id === v.id ? "var(--c-accent)" : "var(--c-border)"}`,
                          background: selectedVariant?.id === v.id
                            ? "rgba(0,200,255,0.1)"
                            : "var(--c-surface)",
                          color: "var(--c-text)",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: v.stock === 0 ? "not-allowed" : "pointer",
                          opacity: v.stock === 0 ? 0.4 : 1,
                          transition: "all 0.2s ease",
                        }}
                      >
                        {v.value}
                        {v.priceAdj !== 0 && (
                          <span style={{ fontSize: 11, color: "var(--c-muted)", marginLeft: 4 }}>
                            ({v.priceAdj > 0 ? "+" : ""}{format(v.priceAdj)})
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Qty + Add to Cart */}
          <motion.div
            variants={fadeInUp}
            style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}
          >
            {/* Qty stepper */}
            <motion.div
              style={{ display: "flex", alignItems: "center", gap: 0, border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", overflow: "hidden" }}
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setQty(Math.max(1, qty - 1))}
                style={{ width: 40, height: 48, background: "var(--c-surface)", border: "none", cursor: "pointer", fontSize: 18, color: "var(--c-text)" }}
              >
                −
              </motion.button>
              <motion.div
                key={qty}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                style={{ width: 48, textAlign: "center", fontSize: 16, fontWeight: 700 }}
              >
                {qty}
              </motion.div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setQty(Math.min(99, qty + 1))}
                style={{ width: 40, height: 48, background: "var(--c-surface)", border: "none", cursor: "pointer", fontSize: 18, color: "var(--c-text)" }}
              >
                +
              </motion.button>
            </motion.div>

            {/* Add to cart */}
            <motion.button
              whileHover={inStock ? { scale: 1.02 } : {}}
              whileTap={inStock ? { scale: 0.98 } : {}}
              onClick={addToCart}
              disabled={!inStock}
              style={{
                flex: 1,
                padding: "14px 28px",
                borderRadius: "var(--r-md)",
                background: !inStock
                  ? "var(--c-surface2)"
                  : added
                  ? "linear-gradient(135deg, #00e676, #00c853)"
                  : "linear-gradient(135deg, #00c8ff, #0099cc)",
                color: !inStock ? "var(--c-muted)" : "#040b14",
                fontWeight: 700, fontSize: 16,
                border: "none", cursor: inStock ? "pointer" : "not-allowed",
                opacity: inStock ? 1 : 0.5,
                transition: "all 0.2s ease",
                boxShadow: !inStock
                  ? "none"
                  : added
                  ? "0 4px 15px rgba(0,230,118,0.3)"
                  : "0 4px 15px rgba(0,200,255,0.3)",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={!inStock ? "oos" : added ? "added" : "add"}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {!inStock ? "✗ Out of Stock" : added ? "✓ Added to Cart!" : "🛒 Add to Cart"}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            {/* Wishlist button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!user) { window.location.href = "/login"; return; }
                const pid = product.id;
                if (isInWishlist(pid)) removeWish(pid);
                else addWish(pid);
              }}
              style={{
                padding: "14px 18px",
                borderRadius: "var(--r-md)",
                background: isInWishlist(product.id)
                  ? "rgba(239,68,68,0.15)"
                  : "var(--c-surface)",
                border: `1px solid ${isInWishlist(product.id) ? "rgba(239,68,68,0.3)" : "var(--c-border)"}`,
                color: isInWishlist(product.id) ? "#ef4444" : "var(--c-text)",
                fontWeight: 700, fontSize: 20,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
            >
              {isInWishlist(product.id) ? "❤️" : "🤍"}
            </motion.button>
          </motion.div>

          {/* WhatsApp Buy Button */}
          <motion.div variants={fadeInUp} style={{ marginTop: 12, marginBottom: 12 }}>
            <motion.a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "961XXXXXXXX"}?text=${encodeURIComponent(
                `Hi Technodel, I want to order:\n\n${product.title}\nPrice: $${Math.round(price)}\nQty: ${qty}${selectedVariant ? `\nVariant: ${selectedVariant.label}: ${selectedVariant.value}` : ""}\n\nLink: https://technodel.net/new/product/${encodeURIComponent(product.slug)}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                width: "100%", padding: "12px 20px",
                borderRadius: "var(--r-md)",
                background: "linear-gradient(135deg, #25D366, #128C7E)",
                color: "#fff", fontWeight: 700, fontSize: 15,
                border: "none", cursor: "pointer", textDecoration: "none",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 15px rgba(37,211,102,0.3)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              </svg>
              Order via WhatsApp
              <span style={{ fontSize: 11, opacity: 0.8, fontWeight: 400 }}>— Quick & Easy</span>
            </motion.a>
          </motion.div>

          {/* Market Price Comparison */}
          {product.sourcePrice && product.sourcePrice > price && (
            <motion.div
              variants={fadeInUp}
              style={{
                marginTop: 16, padding: 14, borderRadius: "var(--r-md)",
                background: "rgba(255,193,7,0.06)",
                border: "1px solid rgba(255,193,7,0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>🏪</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)" }}>
                  Market Price Comparison
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--c-muted)" }}>Technodel:</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "var(--c-accent)" }}>
                    {format(price)}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--c-muted)" }}>
                    Market price:
                  </span>
                  <span style={{
                    fontSize: 16, fontWeight: 700,
                    color: "#ff6b6b",
                    textDecoration: "line-through",
                  }}>
                    {format(product.sourcePrice)}
                  </span>
                </div>
                <motion.span
                  className="badge badge-sale"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  Save {format(product.sourcePrice - price)}
                </motion.span>
              </div>
              <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 6 }}>
                Prices updated daily. Market price as of last check.
              </div>
            </motion.div>
          )}

          {/* WhatsApp order */}
          <motion.a
            variants={fadeInUp}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(
              `Hi Technodel, I want to order: ${product.title}\nPrice: ${format(price)}\nQuantity: ${qty}${selectedVariant ? `\nVariant: ${selectedVariant.label}: ${selectedVariant.value}` : ""}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-lg"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginBottom: 20 }}
          >
            <motion.span
              style={{ fontSize: 18 }}
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              💬
            </motion.span>
            Order via WhatsApp — {format(price)}
          </motion.a>

          {/* Stock & SKU */}
          <motion.div
            variants={fadeInUp}
            style={{ display: "flex", gap: 20, fontSize: 12, color: "var(--c-muted)", flexWrap: "wrap" }}
          >
            <motion.span
              animate={{ opacity: 1 }}
              style={{ color: inStock ? "#00e676" : "#ff4444", fontWeight: 600 }}
            >
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ display: "inline-block", marginRight: 4 }}
              >
                {inStock ? "●" : "○"}
              </motion.span>
              {inStock
                ? `In Stock (${displayStock} available)`
                : "Out of Stock"}
            </motion.span>

            {/* Stock urgency */}
            {inStock && displayStock <= (product.lowStockThresh || 5) && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 400 }}
                style={{ color: "#ffc107", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}
              >
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  🔥
                </motion.span>
                Only {displayStock} left — order soon!
              </motion.span>
            )}

            {/* Live viewing count */}
            {viewers > 0 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ color: "var(--c-accent)", display: "flex", alignItems: "center", gap: 4 }}
              >
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--c-accent)", display: "inline-block" }}
                />
                {viewers} people viewing this
              </motion.span>
            )}

            {/* Hidden SKU / Supplier Code */}
            {supplierCode && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  fontSize: 10,
                  opacity: 0.3,
                  marginLeft: "auto",
                  userSelect: "all",
                  cursor: "text"
                }}
                title="Product SKU"
              >
                SKU: {supplierCode}-{randomSuffix}
              </motion.span>
            )}
          </motion.div>

          {/* Price watch button */}
          <motion.div variants={fadeInUp} style={{ marginTop: 12 }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={togglePriceWatch}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: "var(--r-sm)",
                background: isWatching
                  ? "rgba(0,230,118,0.1)"
                  : "var(--c-surface)",
                border: `1px solid ${isWatching ? "rgba(0,230,118,0.3)" : "var(--c-border)"}`,
                color: isWatching ? "var(--c-success)" : "var(--c-muted)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {priceDropped ? (
                <>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    💰
                  </motion.span>
                  Price Dropped! Save now
                </>
              ) : isWatching ? (
                <>
                  <span>🔔</span>
                  Watching for price drop
                </>
              ) : (
                <>
                  <span>🔕</span>
                  Watch price — get notified on drop
                </>
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* Description + Specs tabs */}
      <ProductTabs product={product} />

      {/* Frequently bought together */}
      {related.length >= 2 && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={sectionReveal}
          style={{ marginTop: 60 }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>🛒 Frequently Bought Together</h2>
          <motion.div
            variants={staggerContainer}
            style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}
          >
            {related.slice(0, 3).map((p, i) => (
              <motion.div
                key={p.id}
                variants={fadeInUp}
                style={{ flex: "1 1 200px", maxWidth: 280 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
            {related.length >= 3 && (
              <motion.div
                variants={fadeInUp}
                style={{ flex: "1 1 200px", maxWidth: 220 }}
              >
                <motion.div
                  style={{
                    background: "var(--c-surface)",
                    border: "1px dashed var(--c-border)",
                    borderRadius: "var(--r-md)",
                    padding: 24,
                    textAlign: "center",
                  }}
                  whileHover={{ borderColor: "var(--c-accent)", background: "rgba(0,200,255,0.05)" }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Bundle Deal</div>
                  <div style={{ fontSize: 13, color: "var(--c-muted)", marginBottom: 12 }}>
                    Buy all 3 + save 5%
                  </div>
                  <motion.button
                    className="btn btn-primary btn-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      related.slice(0, 3).forEach((p) =>
                        useCartStore.getState().add({
                          productId: p.id,
                          slug: p.slug,
                          title: p.title,
                          price: Math.round(p.displayPrice * 0.95 * 100) / 100,
                          imageUrl: (() => { try { return JSON.parse(p.images)[0] || ""; } catch { return ""; } })(),
                          quantity: 1,
                        })
                      )
                    }
                  >
                    Add All to Cart
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </motion.section>
      )}

      {/* Reviews */}
      {product.reviews.length > 0 && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={sectionReveal}
          style={{ marginTop: 60 }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>
            ⭐ Customer Reviews ({product.reviewCount})
          </h2>
          <motion.div
            variants={staggerContainer}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {product.reviews.map((r) => (
              <motion.div
                key={r.id}
                variants={fadeInUp}
                whileHover={{ x: 4 }}
                style={{
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  borderRadius: "var(--r-md)", padding: 20,
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        style={{ color: s <= r.rating ? "#ffc107" : "var(--c-border)", fontSize: 14 }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {r.title && <span style={{ fontWeight: 700, fontSize: 15 }}>{r.title}</span>}
                  <span style={{ fontSize: 12, color: "var(--c-muted)", marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                    {product.verifiedUserIds?.includes(r.user?.id || "") && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 3,
                          padding: "1px 8px", borderRadius: 99,
                          background: "rgba(0,200,255,0.1)",
                          border: "1px solid rgba(0,200,255,0.2)",
                          color: "var(--c-accent)", fontSize: 10, fontWeight: 700,
                        }}
                      >
                        ✓ Verified Purchase
                      </motion.span>
                    )}
                    {r.user?.name || "Customer"} · {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {r.body && <p style={{ fontSize: 14, color: "var(--c-muted)", lineHeight: 1.7 }}>{r.body}</p>}
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* Related products */}
      {related.length > 0 && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={sectionReveal}
          style={{ marginTop: 60 }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>You May Also Like</h2>
          <motion.div variants={staggerContainer} className="products-grid">
            {related.map((p) => (
              <motion.div key={p.id} variants={fadeInUp}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}
    </motion.div>
  );
}

function extractSpecsFromTitle(title: string): { label: string; value: string }[] {
  const specs: { label: string; value: string }[] = [];
  const t = title;

  // RAM
  const ramMatch = t.match(/(\d+)\s*GB\s*(?:DDR[45](?:-?\d+)?)?\s*(?:RAM|ram)?/);
  if (ramMatch) specs.push({ label: 'Memory (RAM)', value: ramMatch[0].trim() });

  // Storage
  const storageMatch = t.match(/(\d+)\s*(?:TB|GB)\s*(?:NVMe|SSD|HDD|Storage)/i);
  if (storageMatch) specs.push({ label: 'Storage', value: storageMatch[0].trim() });

  // CPU
  const cpuMatch = t.match(/(Intel\s+)?(Core\s+)?(i[3579]|Ultra\s+[57]|Celeron|Pentium|Atom)\s*[\dA-Za-z-]*|Ryzen\s+[3579]\s*[\dA-Za-z-]*|Apple\s+M[1234]/i);
  if (cpuMatch) specs.push({ label: 'Processor', value: cpuMatch[0].trim() });

  // GPU
  const gpuMatch = t.match(/(RTX|GTX|GeForce|Radeon|Arc|Iris)\s*[\dA-Za-z\s]*\d{3,4}/i);
  if (gpuMatch) specs.push({ label: 'Graphics', value: gpuMatch[0].trim() });

  // Display
  const dispMatch = t.match(/(\d+\.?\d*)\s*(?:inch|″|″|")[\s\S]{0,30}?(?:FHD|HD|4K|UHD|QHD|WQXGA|OLED|IPS|VA|TN)/i);
  if (dispMatch) specs.push({ label: 'Display', value: dispMatch[0].trim() });

  // Screen size
  const sizeMatch = t.match(/(\d+\.?\d*)\s*(?:inch|″|″|")/i);
  if (sizeMatch && !dispMatch) specs.push({ label: 'Screen Size', value: sizeMatch[0].trim() });

  return specs;
}

function ProductTabs({ product }: { product: Product }) {
  const [tab, setTab] = useState<"description" | "specs">("description");

  // Extract specs from title if specs[] is empty
  const dynamicSpecs = product.specs.length > 0
    ? product.specs
    : extractSpecsFromTitle(product.title);

  // Parse SEO keywords into tag chips
  const tags: string[] = product.seoKeywords
    ? product.seoKeywords.split(',').map((t: string) => t.trim()).filter(Boolean)
    : [];

  const tabs = [
    { id: "description" as const, label: "📖 Description" },
    ...(dynamicSpecs.length > 0 ? [{ id: "specs" as const, label: "⚙️ Specifications" }] : []),
  ];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={sectionReveal}
    >
      {/* Tab nav */}
      <motion.div
        style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--c-border)", marginBottom: 32, overflowX: "auto" }}
        variants={fadeInUp}
      >
        {tabs.map((t) => (
          <motion.button
            key={t.id}
            onClick={() => setTab(t.id)}
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            style={{
              padding: "12px 24px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 700,
              color: tab === t.id ? "var(--c-accent)" : "var(--c-muted)",
              borderBottom: `2px solid ${tab === t.id ? "var(--c-accent)" : "transparent"}`,
              marginBottom: -2,
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {tab === "description" && (
          <motion.div
            key="desc"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="desc-content"
            dangerouslySetInnerHTML={{ __html: product.description || "<p>No description available.</p>" }}
          />
        )}

        {tab === "specs" && dynamicSpecs.length > 0 && (
          <motion.div
            key="specs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{ maxWidth: 640 }}
          >
            <table className="tn-table">
              <tbody>
                {dynamicSpecs.map((s, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ transition: "background 0.2s ease" }}
                    onMouseEnter={(e) => {
                      const tds = e.currentTarget.querySelectorAll("td");
                      tds.forEach((td) => (td.style.background = "var(--c-surface2)"));
                    }}
                    onMouseLeave={(e) => {
                      const tds = e.currentTarget.querySelectorAll("td");
                      tds.forEach((td) => (td.style.background = "transparent"));
                    }}
                  >
                    <td style={{ fontWeight: 600, width: "40%", transition: "background 0.2s" }}>{s.label}</td>
                    <td style={{ transition: "background 0.2s" }}>{s.value}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEO Tags */}
      {tags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--c-border)" }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--c-muted)", marginBottom: 12 }}>
            🏷️ Product Tags
          </h3>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tags.slice(0, 20).map((tag, i) => (
              <Link
                key={i}
                href={`/shop?q=${encodeURIComponent(tag)}`}
                className="tag-chip"
                style={{ textDecoration: "none" }}
              >
                {tag}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
