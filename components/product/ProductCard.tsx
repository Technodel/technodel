"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCartStore } from "@/store/cart";
import { useCurrencyStore } from "@/store/currency";
import { useAuthStore } from "@/store/auth";
import { useWishlistStore } from "@/store/wishlist";
import { cardHover, cardImageZoom } from "@/lib/animations";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { Icon } from "@/components/ui/Icon";
import { useState } from "react";

interface Props {
  product: {
    id: string;
    slug: string;
    title: string;
    displayPrice: number;
    comparePrice?: number | null;
    images: string;
    brand?: string | null;
    isNew: boolean;
    isOnSale: boolean;
    isFeatured: boolean;
    category: { name: string };
    stock?: number;
    lowStockThresh?: number;
    competitor?: { name: string; url: string } | null;
    competitorPrice?: number | null;
  };
}

export default function ProductCard({ product }: Props) {
  const add = useCartStore((s) => s.add);
  const { format } = useCurrencyStore();
  const user = useAuthStore((s) => s.user);
  const { isInWishlist, add: addWish, remove: removeWish } = useWishlistStore();
  const [added, setAdded] = useState(false);
  const [wishToggle, setWishToggle] = useState(false);
  let images: string[] = [];
  try { images = JSON.parse(product.images); } catch {}
  const img = images[0] || "/placeholder.png";
  const savings = product.comparePrice ? product.comparePrice - product.displayPrice : 0;
  const pctOff = product.comparePrice ? Math.round((savings / product.comparePrice) * 100) : 0;

  const isLowStock = product.stock !== undefined && product.lowStockThresh !== undefined &&
    product.stock > 0 && product.stock <= product.lowStockThresh;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: product.displayPrice,
      imageUrl: img,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const inWish = isInWishlist(product.id);
  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setWishToggle(true);
    if (inWish) {
      removeWish(product.id).finally(() => setWishToggle(false));
    } else {
      addWish(product.id).finally(() => setWishToggle(false));
    }
  };

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={cardHover}
      style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Link href={`/product/${encodeURIComponent(product.slug)}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", height: "100%" }}>
        <div
          className="product-card"
          style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          {/* Badges */}
          <div style={{
            position: "absolute", top: 10, left: 10, zIndex: 2,
            display: "flex", flexDirection: "column", gap: 4,
          }}>
            {product.isNew && (
              <motion.span
                className="badge badge-new"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                New
              </motion.span>
            )}
            {product.isOnSale && pctOff > 0 && (
              <motion.span
                className="badge badge-sale"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                -{pctOff}%
              </motion.span>
            )}
            {product.isFeatured && (
              <motion.span
                className="badge badge-featured"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Icon name="star" size={12} />
              </motion.span>
            )}
            {isLowStock && (
              <motion.span
                className="badge badge-hot"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                style={{ animation: "urgencyPulse 1.5s ease infinite" }}
              >
                <Icon name="flame" size={12} /> Only {product.stock} left
              </motion.span>
            )}
          </div>

          {/* Image with zoom — using OptimizedImage */}
          <motion.div
            className="card-img"
            variants={cardImageZoom}
            style={{
              height: 200,
              background: "var(--c-surface2)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <OptimizedImage
              src={img}
              alt={product.title}
              fill
              priority={product.isFeatured}
              style={{ padding: 12 }}
              objectFit="contain"
            />
            {/* Wishlist heart button */}
            <motion.button
              onClick={handleWishlist}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              style={{
                position: "absolute", top: 10, right: 10, zIndex: 3,
                width: 34, height: 34, borderRadius: "50%",
                border: "none", cursor: "pointer", fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: inWish ? "rgba(239,68,68,0.9)" : "rgba(0,0,0,0.4)",
                color: inWish ? "#fff" : "rgba(255,255,255,0.8)",
                backdropFilter: "blur(4px)",
                transition: "all 0.2s",
              }}
              aria-label={inWish ? "Remove from wishlist" : "Add to wishlist"}
            >
              {wishToggle ? <Icon name="loader" size={16} /> : inWish ? <Icon name="heart" size={16} style={{ fill: "currentColor" }} /> : <Icon name="heart" size={16} />}
            </motion.button>

            {/* Shine overlay */}
            <div
              className="shine-overlay"
              style={{
                position: "absolute", top: 0, left: "-100%",
                width: "60%", height: "100%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
              }}
            />
          </motion.div>

          {/* Content */}
          <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            {product.brand && (
              <motion.span
                style={{
                  fontSize: 11, color: "var(--c-accent)", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.5px",
                }}
              >
                {product.brand}
              </motion.span>
            )}
            <h3 style={{
              fontSize: 14, fontWeight: 500, color: "var(--c-text)",
              lineHeight: 1.4, overflow: "hidden",
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}>
              {product.title}
            </h3>
            <div style={{ fontSize: 11, color: "var(--c-muted)" }}>{product.category?.name || ""}</div>

            {/* Market price badge */}
            {product.competitorPrice && product.competitorPrice > product.displayPrice && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{
                  fontSize: 11, color: "var(--c-muted)", display: "flex",
                  alignItems: "center", gap: 4, marginTop: -4,
                }}
              >
                <Icon emoji="🏪" size={14} style={{ color: "#ffc107" }} />
                Market price:{" "}
                <span className="price-old">{format(product.competitorPrice)}</span>
              </motion.div>
            )}

            {/* Price row */}
            <div style={{
              marginTop: "auto", display: "flex",
              alignItems: "flex-end", justifyContent: "space-between", gap: 8,
            }}>
              <div>
                <div className="price-main">{format(product.displayPrice)}</div>
                {product.comparePrice && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span className="price-old">{format(product.comparePrice)}</span>
                    <motion.span
                      className="price-save"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      Save {format(savings)}
                    </motion.span>
                  </div>
                )}
              </div>
              <motion.button
                className="btn btn-primary btn-sm"
                onClick={handleAddToCart}
                style={{ flexShrink: 0, minWidth: 64 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {added ? <Icon name="check" size={14} /> : <><Icon name="shopping-cart" size={14} /> Add</>}
              </motion.button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
