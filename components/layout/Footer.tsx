"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { sectionReveal, staggerContainer, fadeInUp } from "@/lib/animations";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={sectionReveal}
      style={{
        background: "linear-gradient(180deg, var(--c-surface) 0%, var(--c-surface2) 100%)",
        borderTop: "1px solid var(--c-border)",
        marginTop: 80,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle top gradient */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, var(--c-accent), transparent)",
        opacity: 0.3,
      }} />

      {/* ═══ NEWSLETTER SECTION ═══════════════════════════════════════════ */}
      <motion.div
        variants={staggerContainer}
        style={{
          maxWidth: "var(--max-w)", margin: "0 auto",
          padding: "60px 24px 0",
          textAlign: "center",
        }}
      >
        <motion.div variants={fadeInUp} style={{ maxWidth: 520, margin: "0 auto" }}>
          <motion.span
            style={{ fontSize: 40, display: "inline-block", marginBottom: 12 }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon name="mail" size={36} />
          </motion.span>
          <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.3px" }}>
            Stay Ahead of the <span className="grad-text">Tech</span> Curve
          </h3>
          <p style={{ fontSize: 14, color: "var(--c-muted)", marginBottom: 24, lineHeight: 1.6 }}>
            Get exclusive deals, new arrivals, and tech tips delivered to your inbox.
            No spam, ever.
          </p>
          <form onSubmit={handleSubscribe} className="newsletter-form" style={{ display: "flex", gap: 8, maxWidth: 440, margin: "0 auto", flexWrap: "wrap" }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
              style={{ flex: 1 }}
            />
            <motion.button
              type="submit"
              className="btn btn-primary"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{ flexShrink: 0, padding: "10px 24px", fontSize: 14 }}
            >
              {subscribed ? <><Icon emoji="✅" size={16} /> Subscribed!</> : "Subscribe"}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>

      {/* ═══ MAIN FOOTER GRID ═════════════════════════════════════════════ */}
      <div style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "60px 24px 40px" }}>
        <motion.div
          className="footer-grid"
          variants={staggerContainer}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 40,
          }}
        >
          {/* ═══ Brand ═════════════════════════════════════════════════ */}
          <motion.div variants={fadeInUp}>
            <motion.div
              style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 12 }}
              whileHover={{ scale: 1.02 }}
            >
              <span className="grad-text">TECHNO</span><span style={{ color: "var(--c-text)" }}>DEL</span>
            </motion.div>
            <p style={{ fontSize: 13, color: "var(--c-muted)", lineHeight: 1.7, marginBottom: 16, maxWidth: 260 }}>
              Lebanon&apos;s premium tech destination. Best prices, genuine products with warranty, fast delivery across all Lebanon.
            </p>
            {/* Trust badges */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { icon: "✅", label: "100% Authentic" },
                { icon: "🛡️", label: "Warranty" },
                { icon: "🚚", label: "Free Delivery $150+" },
                { icon: "🔄", label: "7-Day Returns" },
              ].map((badge, i) => (
                <motion.span
                  key={badge.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: "4px 10px",
                    borderRadius: 99, background: "rgba(0,200,255,0.06)",
                    border: "1px solid rgba(0,200,255,0.12)",
                    color: "var(--c-text2)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon emoji={badge.icon} size={12} /> {badge.label}
                </motion.span>
              ))}
            </div>
            {/* Social icons — real SVG icons */}
            <div style={{ display: "flex", gap: 8 }}>
              {SOCIAL_LINKS.map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -3, backgroundColor: "rgba(0,200,255,0.1)" }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: 40, height: 40, borderRadius: "var(--r-sm)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "var(--c-surface2)",
                    border: "1px solid var(--c-border-light)",
                    color: "var(--c-muted)", transition: "all 0.25s ease",
                    fontSize: 18, textDecoration: "none",
                  }}
                  title={s.label}
                >
                  <Icon emoji={s.icon} size={18} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* ═══ Categories ══════════════════════════════════════════════ */}
          <motion.div variants={fadeInUp}>
            <FooterSectionTitle text="Categories" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {["Smartphones", "Laptops", "Tablets", "Gaming", "Audio", "Accessories", "Networking", "Cameras"].map((c, i) => (
                <motion.div
                  key={c}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                >
                  <FooterLink href={`/shop/${c.toLowerCase().replace(/\s+/g, "-")}`} label={c} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ═══ Customer Service ═══════════════════════════════════════ */}
          <motion.div variants={fadeInUp}>
            <FooterSectionTitle text="Customer Service" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { href: "/account/orders", label: "Track Order" },
                { href: "/warranty", label: "Warranty Policy" },
                { href: "/returns", label: "Returns & Exchanges" },
                { href: "/faq", label: "FAQ" },
                { href: "/contact", label: "Contact Us" },
                { href: "/about", label: "About Us" },
                { href: "/locations", label: "Our Locations" },
              ].map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                >
                  <FooterLink href={l.href} label={l.label} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ═══ Contact ════════════════════════════════════════════════ */}
          <motion.div variants={fadeInUp}>
            <FooterSectionTitle text="Get In Touch" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: "📍", content: "Beirut, Lebanon", href: null },
                { icon: "📞", content: "+961 XX XXX XXX", href: "tel:+961XXXXXXXX" },
                { icon: "💬", content: "WhatsApp Order", href: "https://wa.me/961XXXXXXXX", accent: true },
                { icon: "✉️", content: "info@technodel.net", href: "mailto:info@technodel.net" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  style={{ display: "flex", gap: 10, alignItems: item.href ? "center" : "flex-start" }}
                >
                  <motion.span
                    style={{ flexShrink: 0, display: "inline-flex" }}
                    whileHover={{ scale: 1.2 }}
                  >
                    <Icon emoji={item.icon} size={16} />
                  </motion.span>
                  {item.href ? (
                    <a
                      href={item.href}
                      style={{
                        fontSize: 13,
                        color: item.accent ? "#00e676" : "var(--c-muted)",
                        textDecoration: "none",
                        fontWeight: item.accent ? 600 : 400,
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => { if (!item.accent) e.currentTarget.style.color = "var(--c-text)"; }}
                      onMouseLeave={(e) => { if (!item.accent) e.currentTarget.style.color = "var(--c-muted)"; }}
                    >
                      {item.content}
                    </a>
                  ) : (
                    <span style={{ fontSize: 13, color: "var(--c-muted)", lineHeight: 1.5 }}>{item.content}</span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Payment methods */}
            <motion.div
              variants={fadeInUp}
              style={{ marginTop: 24 }}
            >
              <FooterSectionTitle text="We Accept" />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { icon: "💵", label: "Cash on Delivery" },
                  { icon: "📱", label: "Wish Money" },
                  { icon: "🪙", label: "Crypto (USDT/BTC)" },
                ].map((p, i) => (
                  <motion.span
                    key={p.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    style={{
                      fontSize: 11, fontWeight: 600, padding: "4px 10px",
                      borderRadius: 99, background: "rgba(0,230,118,0.06)",
                      border: "1px solid rgba(0,230,118,0.12)",
                      color: "var(--c-muted)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Icon emoji={p.icon} size={12} /> {p.label}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* ═══ BOTTOM BAR ════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        style={{
          borderTop: "1px solid var(--c-border)",
          padding: "20px 24px",
          background: "var(--c-surface2)",
        }}
      >
        <div className="footer-bottom" style={{
          maxWidth: "var(--max-w)", margin: "0 auto",
          display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 12,
        }}>
          <p style={{ fontSize: 12, color: "var(--c-muted)" }}>
            © {new Date().getFullYear()} Technodel. All rights reserved.
            <motion.span
              style={{ display: "inline-flex", marginLeft: 8, verticalAlign: "middle" }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Icon emoji="🇱🇧" size={14} />
            </motion.span>
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { href: "/privacy", label: "Privacy Policy" },
              { href: "/terms", label: "Terms of Service" },
              { href: "/sitemap", label: "Sitemap" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{ fontSize: 12, color: "var(--c-muted)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--c-text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--c-muted)")}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.footer>
  );
}

// ─── FOOTER SUB-COMPONENTS ──────────────────────────────────────────────────────

function FooterSectionTitle({ text }: { text: string }) {
  return (
    <motion.h4
      style={{
        fontSize: 12, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "1px", color: "var(--c-muted)",
        marginBottom: 16, position: "relative",
        display: "inline-block",
      }}
      whileHover={{ color: "var(--c-accent)" }}
    >
      {text}
      <motion.div
        style={{
          position: "absolute", bottom: -4, left: 0,
          width: "60%", height: 2,
          background: "var(--grad-accent)",
          borderRadius: 99,
        }}
        layoutId="footerTitleUnderline"
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />
    </motion.h4>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize: 14, color: hovered ? "var(--c-accent)" : "var(--c-muted)",
        textDecoration: "none", transition: "all 0.2s ease",
        display: "inline-flex", alignItems: "center", gap: 4,
      }}
    >
      <motion.span
        animate={{ x: hovered ? 4 : 0, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ display: "inline-flex" }}
      >
        <Icon name="chevron-right" size={12} />
      </motion.span>
      {label}
    </Link>
  );
}

// ─── SOCIAL LINKS ───────────────────────────────────────────────────────────────
const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://facebook.com/technodel", icon: "📘" },
  { label: "Instagram", href: "https://instagram.com/technodel", icon: "📸" },
  { label: "Twitter", href: "https://twitter.com/technodel", icon: "🐦" },
  { label: "TikTok", href: "https://tiktok.com/@technodel", icon: "🎵" },
  { label: "LinkedIn", href: "https://linkedin.com/company/technodel", icon: "💼" },
];
