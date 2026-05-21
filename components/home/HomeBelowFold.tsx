"use client";

import { useState } from "react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { motion } from "framer-motion";
import ProductCard from "@/components/product/ProductCard";
import AnimatedSection, { FadeInUp } from "@/components/ui/AnimatedSection";
import { Icon } from "@/components/ui/Icon";
import { fadeInUp, perspectiveReveal, scaleIn, staggerContainer } from "@/lib/animations";

interface Category { id: string; name: string; slug: string; icon?: string | null; image?: string | null; }

type ProductCardProduct = ComponentProps<typeof ProductCard>["product"];

interface Props {
  featured: ProductCardProduct[];
  categories: Category[];
  deals: ProductCardProduct[];
  newArrivals: ProductCardProduct[];
}

const staggerGrid = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const DEMO_CATS = [
  { id: "1", slug: "smartphones", name: "Smartphones", icon: "📱" },
  { id: "2", slug: "laptops", name: "Laptops", icon: "💻" },
  { id: "3", slug: "tablets", name: "Tablets", icon: "📲" },
  { id: "4", slug: "gaming", name: "Gaming", icon: "🎮" },
  { id: "5", slug: "audio", name: "Audio", icon: "🎧" },
  { id: "6", slug: "accessories", name: "Accessories", icon: "🔌" },
  { id: "7", slug: "networking", name: "Networking", icon: "📡" },
  { id: "8", slug: "cameras", name: "Cameras", icon: "📷" },
  { id: "9", slug: "printers", name: "Printers", icon: "🖨️" },
  { id: "10", slug: "smart-home", name: "Smart Home", icon: "🏠" },
  { id: "11", slug: "wearables", name: "Wearables", icon: "⌚" },
  { id: "12", slug: "storage", name: "Storage", icon: "💾" },
];

const CAT_COLORS: Record<string, { bg: string; border: string; text: string; accent: string; shadow: string }> = {
  default: { bg: "#1a1a2e", border: "#2a2a4e", text: "#e0e0e0", accent: "#4a4a7e", shadow: "rgba(30,30,60,0.4)" },
  smartphones: { bg: "#0d47a1", border: "#1565c0", text: "#fff", accent: "#42a5f5", shadow: "rgba(13,71,161,0.5)" },
  laptops: { bg: "#006064", border: "#00838f", text: "#fff", accent: "#26c6da", shadow: "rgba(0,96,100,0.5)" },
  tablets: { bg: "#004d40", border: "#00695c", text: "#fff", accent: "#26a69a", shadow: "rgba(0,77,64,0.5)" },
  gaming: { bg: "#4a148c", border: "#6a1b9a", text: "#fff", accent: "#ab47bc", shadow: "rgba(74,20,140,0.5)" },
  audio: { bg: "#880e4f", border: "#ad1457", text: "#fff", accent: "#ec407a", shadow: "rgba(136,14,79,0.5)" },
  accessories: { bg: "#e65100", border: "#ef6c00", text: "#fff", accent: "#ffa726", shadow: "rgba(230,81,0,0.5)" },
  networking: { bg: "#1b5e20", border: "#2e7d32", text: "#fff", accent: "#66bb6a", shadow: "rgba(27,94,32,0.5)" },
  cameras: { bg: "#b71c1c", border: "#c62828", text: "#fff", accent: "#ef5350", shadow: "rgba(183,28,28,0.5)" },
  printers: { bg: "#3e2723", border: "#4e342e", text: "#fff", accent: "#8d6e63", shadow: "rgba(62,39,35,0.5)" },
  "smart-home": { bg: "#1a237e", border: "#283593", text: "#fff", accent: "#5c6bc0", shadow: "rgba(26,35,126,0.5)" },
  wearables: { bg: "#f57f17", border: "#f9a825", text: "#1a1a2e", accent: "#ffd54f", shadow: "rgba(245,127,23,0.4)" },
  storage: { bg: "#37474f", border: "#455a64", text: "#fff", accent: "#78909c", shadow: "rgba(55,71,79,0.5)" },
};

export default function HomeBelowFold({ featured, categories, deals, newArrivals }: Props) {
  return (
    <>
      <AnimatedSection className="section-lazy" style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "0 24px 80px" }}>
        <FadeInUp>
          <SectionHeader title="Browse by Category" link="/shop" linkLabel="All categories →" />
        </FadeInUp>
        <div className="cat-row">
          {(categories.length > 0 ? categories : DEMO_CATS).map((cat, index) => {
            const color = CAT_COLORS[cat.slug] || CAT_COLORS.default;
            return (
              <motion.div
                key={cat.id || cat.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.35 }}
              >
                <Link href={`/shop/${cat.slug}`} style={{ textDecoration: "none" }}>
                  <motion.div
                    className="cat-tile"
                    style={{
                      background: `linear-gradient(135deg, ${color.bg}, ${color.bg}dd)`,
                      borderColor: color.border,
                      color: color.text,
                    }}
                    whileHover={{ y: -6, borderColor: color.accent, boxShadow: `0 12px 32px ${color.shadow}` }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className="cat-icon"
                      style={{ color: color.text }}
                      whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.35 }}
                    >
                      <Icon emoji={cat.icon || "📦"} size={28} />
                    </motion.div>
                    <span className="cat-label" style={{ color: color.text }}>{cat.name}</span>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </AnimatedSection>

      <ProductSection title={<><Icon emoji="⭐" size={22} /> Featured Products</>} link="/shop?featured=1" linkLabel="View all →" products={featured} emptyMessage="Featured products will appear here" emptyIcon="⭐" />
      <ProductSection title={<><Icon emoji="🔥" size={22} /> Hot Deals</>} link="/deals" linkLabel="View all deals →" products={deals} emptyMessage="Hot deals are loading — check back soon!" emptyIcon="🔥" />

      <AnimatedSection className="section-lazy trust-strip" stagger style={{ margin: "0 0 80px" }}>
        <motion.div
          className="glass-strong"
          style={{ borderTop: "1px solid var(--c-border)", borderBottom: "1px solid var(--c-border)", overflow: "hidden", position: "relative" }}
        >
          <div style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "48px 24px" }}>
            <motion.div
              variants={staggerContainer}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 40 }}
            >
              {[
                { icon: "🚚", title: "Lightning Delivery", desc: "1-3 days across Lebanon", color: "var(--c-accent)" },
                { icon: "✅", title: "100% Authentic", desc: "Only genuine, warrantied products", color: "var(--c-success)" },
                { icon: "💰", title: "Price Match", desc: "Matched with competitors daily", color: "var(--c-warning)" },
                { icon: "🔄", title: "Easy Returns", desc: "7-day hassle-free returns", color: "var(--c-accent2)" },
              ].map((feature, index) => (
                <motion.div key={feature.title} variants={perspectiveReveal} custom={index} className="trust-item" style={{ display: "flex", gap: 18, alignItems: "flex-start", padding: 8 }}>
                  <motion.div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "var(--r-md)",
                      background: `rgba(from ${feature.color} r g b / 0.1)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      border: `1px solid rgba(from ${feature.color} r g b / 0.2)`,
                    }}
                    whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <Icon emoji={feature.icon} size={24} />
                  </motion.div>
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: "var(--c-text)" }}>{feature.title}</div>
                    <div style={{ fontSize: 13, color: "var(--c-muted)", lineHeight: 1.5 }}>{feature.desc}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </AnimatedSection>

      <ProductSection title={<><Icon emoji="🆕" size={22} /> New Arrivals</>} link="/shop?new=1" linkLabel="See all new →" products={newArrivals} emptyMessage="New products will appear here once added" emptyIcon="🆕" />

      <AnimatedSection className="section-lazy" style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "0 24px 80px" }}>
        <FadeInUp>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32, letterSpacing: "-0.3px", textAlign: "center" }}>
            Trusted Brands
          </h2>
        </FadeInUp>
        <motion.div className="brand-row" variants={staggerContainer} style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", alignItems: "center" }}>
          {["Apple", "Samsung", "Sony", "HP", "Dell", "Lenovo", "ASUS", "Acer", "MSI", "Logitech", "JBL", "Canon"].map((brand, index) => (
            <motion.div key={brand} variants={scaleIn} custom={index} whileHover={{ scale: 1.08, y: -4 }}>
              <Link href={`/shop?brand=${brand}`} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", padding: "10px 22px", borderRadius: "var(--r-md)", background: "var(--c-surface)", border: "1px solid var(--c-border-light)", color: "var(--c-muted)", fontSize: 14, fontWeight: 700, letterSpacing: "0.5px", transition: "all 0.25s ease" }}>
                {brand}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </AnimatedSection>

      <AnimatedSection className="section-lazy newsletter-section" style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "0 24px 80px" }}>
        <motion.div
          style={{ borderRadius: "var(--r-xxl)", padding: "56px 48px", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, rgba(0,200,255,0.08), rgba(124,58,255,0.08))", border: "1px solid var(--c-border)" }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="newsletter-flex" style={{ display: "flex", gap: 40, alignItems: "center", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <motion.h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 12, letterSpacing: "-0.5px", lineHeight: 1.15 }} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                <span className="grad-text">Order via WhatsApp</span> <Icon emoji="💬" size={22} />
              </motion.h2>
              <motion.p style={{ color: "var(--c-muted)", fontSize: 16, lineHeight: 1.7, marginBottom: 24 }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
                Prefer personal service? Chat with us on WhatsApp. We&apos;ll help you find the perfect product and arrange fast delivery anywhere in Lebanon.
              </motion.p>
              <motion.a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "961XXXXXXXX"}?text=Hi%20Technodel%2C%20I%20need%20help%20choosing%20tech`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "16px 32px", background: "#25d366", color: "#fff", borderRadius: "var(--r-md)", fontWeight: 700, fontSize: 17, textDecoration: "none", boxShadow: "0 8px 32px rgba(37,211,102,0.3)", position: "relative", overflow: "hidden" }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon emoji="💬" size={22} />
                Chat on WhatsApp
              </motion.a>
            </div>
            <div style={{ flex: "0 0 auto", textAlign: "center" }}>
              <motion.div style={{ width: 140, height: 140, borderRadius: "50%", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                <Icon emoji="💬" size={64} />
              </motion.div>
              <div style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 8, fontWeight: 600 }}>Response in minutes</div>
            </div>
          </div>
        </motion.div>
      </AnimatedSection>
    </>
  );
}

function ProductSection({ title, link, linkLabel, products, emptyMessage, emptyIcon }: { title: string | ReactNode; link: string; linkLabel: string; products: ProductCardProduct[]; emptyMessage: string; emptyIcon: string }) {
  return (
    <AnimatedSection className="section-lazy" style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "0 24px 80px" }}>
      <FadeInUp>
        <SectionHeader title={title} link={link} linkLabel={linkLabel} />
      </FadeInUp>
      {products.length > 0 ? (
        <motion.div className="products-grid" variants={staggerGrid}>
          {products.map((product) => (
            <motion.div key={product.id} variants={fadeInUp}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState message={emptyMessage} icon={emptyIcon} />
      )}
    </AnimatedSection>
  );
}

function SectionHeader({ title, link, linkLabel }: { title: string | ReactNode; link: string; linkLabel: string }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, gap: 12, flexWrap: "wrap" }} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.3px", background: isHovered ? "var(--grad-accent)" : "none", WebkitBackgroundClip: isHovered ? "text" : "none", WebkitTextFillColor: isHovered ? "transparent" : "var(--c-text)", backgroundClip: isHovered ? "text" : "none", transition: "all 0.3s ease" }}>
        {title}
      </h2>
      <Link href={link} style={{ fontSize: 14, color: isHovered ? "var(--c-accent)" : "var(--c-muted)", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "color 0.3s ease" }}>
        {linkLabel}
        <motion.span animate={{ x: isHovered ? 4 : 0 }} transition={{ duration: 0.2 }} style={{ display: "inline-flex" }}>
          <Icon name="arrow-right" size={14} />
        </motion.span>
      </Link>
    </motion.div>
  );
}

function EmptyState({ message, icon = "📦" }: { message: string; icon?: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "60px 24px", color: "var(--c-muted)", background: "var(--c-surface)", borderRadius: "var(--r-xl)", border: "1px dashed var(--c-border)" }}>
      <motion.div style={{ marginBottom: 12, display: "inline-flex" }} animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>
        <Icon emoji={icon} size={48} />
      </motion.div>
      <p style={{ fontSize: 15 }}>{message}</p>
    </motion.div>
  );
}
