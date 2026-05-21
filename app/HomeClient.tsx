"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import ProductCard from "@/components/product/ProductCard";
import { Icon } from "@/components/ui/Icon";
import AnimatedSection, { FadeInUp, ScaleIn } from "@/components/ui/AnimatedSection";
import {
  heroText, heroChildren, staggerContainer, fadeInUp,
  scaleIn, springBouncy, smoothEase, sectionReveal,
  blurReveal, clipReveal, staggerHero, easeOutExpo,
  staggerSlowWithDelay, floatSlow, perspectiveReveal,
  fadeInLeft, fadeInRight, easeOutBack,
} from "@/lib/animations";

interface Category { id: string; name: string; slug: string; icon?: string | null; image?: string | null; }
interface Banner { id: string; title: string; subtitle?: string | null; imageUrl: string; linkUrl?: string | null; badge?: string | null; }

interface Props {
  featured: any[];
  categories: Category[];
  banners: Banner[];
  newArrivals: any[];
  deals: any[];
}

const FEATURED_TAGS = [
  "Smartphones", "Laptops", "Gaming", "Audio",
  "Accessories", "Tablets", "Networking", "Cameras",
];

// ─── PARALLAX MOUSE TRACKER ─────────────────────────────────────────────────────
function useMousePosition() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 100, damping: 30 });
  const springY = useSpring(y, { stiffness: 100, damping: 30 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    x.set((e.clientX - cx) / cx);
    y.set((e.clientY - cy) / cy);
  }, [x, y]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return { x: springX, y: springY };
}

// ─── FLOATING ORB ───────────────────────────────────────────────────────────────
function FloatingOrb({ colorClass, size, initialX, initialY, speed = 1 }: {
  colorClass: string; size: number; initialX: number; initialY: number; speed?: number;
}) {
  return (
    <motion.div
      className={`orb ${colorClass}`}
      style={{
        width: size, height: size,
        left: `${initialX}%`, top: `${initialY}%`,
      }}
      animate={{
        x: [0, 30 * speed, -20 * speed, 0],
        y: [0, -20 * speed, 25 * speed, 0],
        scale: [1, 1.1 * speed, 0.9 * speed, 1],
      }}
      transition={{
        duration: 8 / speed,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// ─── 3D TILT CARD ────────────────────────────────────────────────────────────────
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(-y * 8);
    rotateY.set(x * 8);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX, rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── PRICE COUNTER ───────────────────────────────────────────────────────────────
function CountUp({ end, duration = 2000, prefix = "", suffix = "" }: {
  end: number; duration?: number; prefix?: string; suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function HomeClient({ featured, categories, banners, newArrivals, deals }: Props) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [tagIndex, setTagIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mouse = useMousePosition();
  const { scrollY } = useScroll();

  // Parallax values
  const heroParallaxY = useTransform(scrollY, [0, 600], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.95]);

  // Auto-rotate hero banner
  useEffect(() => {
    if (banners.length < 2) return;
    timerRef.current = setInterval(() => setActiveSlide((p) => (p + 1) % banners.length), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length]);

  // Typewriter-like tag cycling
  useEffect(() => {
    const t = setInterval(() => setTagIndex((p) => (p + 1) % FEATURED_TAGS.length), 2500);
    return () => clearInterval(t);
  }, []);

  const heroBanners = banners.length > 0 ? banners : [
    { id: "fallback-1", title: "New Arrivals Daily", subtitle: "Discover the latest tech at Technodel", imageUrl: "", badge: "🔥 Hot", linkUrl: "/shop" },
  ];

  return (
    <div className="page-enter">

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION — Immersive 3D Parallax Experience
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className="hero-gradient"
        style={{
          padding: "0 0 100px",
          position: "relative",
          overflow: "hidden",
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Animated floating orbs */}
        <FloatingOrb colorClass="orb-cyan" size={600} initialX={5} initialY={-10} speed={1.2} />
        <FloatingOrb colorClass="orb-purple" size={400} initialX={75} initialY={5} speed={0.8} />
        <FloatingOrb colorClass="orb-green" size={300} initialX={50} initialY={60} speed={0.6} />
        <FloatingOrb colorClass="orb-orange" size={250} initialX={85} initialY={70} speed={0.9} />

        {/* Mouse-parallax decorative grid lines */}
        <motion.div
          style={{
            position: "absolute", inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            x: useTransform(mouse.x, [-1, 1], [-20, 20]),
            y: useTransform(mouse.y, [-1, 1], [-20, 20]),
            pointerEvents: "none",
          }}
        />

        <motion.div
          style={{
            maxWidth: "var(--max-w)",
            margin: "0 auto",
            padding: "80px 24px 0",
            y: heroParallaxY,
            opacity: heroOpacity,
            scale: heroScale,
            width: "100%",
          }}
        >
          <div className="hero-grid" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(24px, 4vw, 60px)",
            alignItems: "center",
            minHeight: "clamp(400px, 70vh, 520px)",
          }}>

            {/* ── LEFT: Text Content ──────────────────────────────────── */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerHero}
            >
              {/* Live status badge */}
              <motion.div
                variants={heroText}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  padding: "8px 18px", borderRadius: 99,
                  background: "rgba(0,200,255,0.08)",
                  border: "1px solid rgba(0,200,255,0.2)",
                  marginBottom: 28,
                  backdropFilter: "blur(10px)",
                }}
              >
                <motion.span
                  className="pulse-dot"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span style={{ fontSize: 13, color: "var(--c-accent)", fontWeight: 700, letterSpacing: "0.3px" }}>
                  Lebanon&apos;s Premium Tech Destination
                </span>
              </motion.div>

              {/* Headline with clip reveal */}
              <motion.div variants={clipReveal}>
                <h1 style={{
                  fontSize: "clamp(36px, 5.5vw, 64px)",
                  fontWeight: 900,
                  lineHeight: 1.05,
                  marginBottom: 24,
                  letterSpacing: "-1.5px",
                }}>
                  Tech That{" "}
                  <span className="grad-text glow-text">Elevates</span>
                  <br />
                  <motion.span
                    style={{ display: "inline-block", color: "var(--c-text)" }}
                  >
                    Your Everyday
                  </motion.span>
                </h1>
              </motion.div>

              {/* Animated tag cycling */}
              <motion.p
                variants={blurReveal}
                style={{
                  fontSize: 18, color: "var(--c-text2)",
                  lineHeight: 1.7, marginBottom: 36, maxWidth: 520,
                }}
              >
                Discover the latest{" "}
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={FEATURED_TAGS[tagIndex]}
                    initial={{ opacity: 0, y: 15, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.9 }}
                    transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{
                      color: "var(--c-accent)",
                      fontWeight: 800,
                      display: "inline-block",
                    }}
                  >
                    {FEATURED_TAGS[tagIndex]}
                  </motion.span>
                </AnimatePresence>
                , gaming gear and accessories — all at unbeatable prices with
                fast delivery across Lebanon.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={staggerContainer}
                style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
              >
                <motion.div variants={fadeInUp} style={{ flex: "1 1 auto", minWidth: 160 }}>
                  <Link
                    href="/shop"
                    className="btn btn-primary btn-xl"
                    style={{ fontSize: "clamp(14px, 3vw, 17px)", padding: "clamp(14px, 2vw, 18px) clamp(24px, 4vw, 40px)", width: "100%", justifyContent: "center" }}
                  >
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ display: "inline-flex" }}
                    >
                      <Icon name="shopping-bag" size={20} />
                    </motion.span>
                    Explore Products
                  </Link>
                </motion.div>
                <motion.div variants={fadeInUp} style={{ flex: "1 1 auto", minWidth: 160 }}>
                  <Link
                    href="/deals"
                    className="btn btn-secondary btn-xl"
                    style={{ fontSize: "clamp(14px, 3vw, 17px)", padding: "clamp(14px, 2vw, 18px) clamp(24px, 4vw, 40px)", width: "100%", justifyContent: "center" }}
                  >
                    <Icon name="flame" size={20} /> Today&apos;s Deals
                  </Link>
                </motion.div>
              </motion.div>

              {/* Live Stats */}
              <motion.div
                className="stats-row"
                variants={staggerContainer}
                style={{
                  display: "flex", gap: "clamp(16px, 4vw, 40px)",
                  marginTop: "clamp(32px, 6vw, 56px)", paddingTop: "clamp(16px, 3vw, 32px)",
                  borderTop: "1px solid var(--c-border-light)",
                  flexWrap: "wrap",
                }}
              >
                {[
                  { label: "Products", end: 5000, suffix: "+" },
                  { label: "Brands", end: 200, suffix: "+" },
                  { label: "Delivery", value: "1-3 Days", end: 0 },
                  { label: "Happy Clients", end: 15000, suffix: "+" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    variants={fadeInUp}
                    custom={i}
                  >
                    <motion.div
                      style={{
                        fontSize: 26, fontWeight: 900,
                        color: "var(--c-accent)",
                        letterSpacing: "-0.5px",
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + i * 0.1, duration: 0.6 }}
                    >
                      {stat.value ? (
                        stat.value
                      ) : (
                        <CountUp end={(stat as any).end || 0} duration={2000 + i * 300} />
                      )}
                      {stat.suffix || ""}
                    </motion.div>
                    <div style={{
                      fontSize: 12, color: "var(--c-muted)",
                      fontWeight: 500, marginTop: 2,
                    }}>
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* ── RIGHT: 3D Banner Carousel ────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 80, rotateY: 10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="tilt-3d"
            >
              <TiltCard>
                <div style={{
                  position: "relative",
                  borderRadius: "var(--r-xxl)",
                  overflow: "hidden",
                  aspectRatio: "4/3",
                  boxShadow: "0 40px 80px rgba(0,0,0,0.4), 0 0 60px rgba(0,200,255,0.06)",
                }} className="grad-border-accent">
                  <AnimatePresence mode="wait">
                    {heroBanners.map((b, i) =>
                      i === activeSlide ? (
                        <motion.div
                          key={b.id + activeSlide}
                          initial={{ opacity: 0, scale: 1.08 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.92 }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          style={{ position: "absolute", inset: 0, cursor: b.linkUrl ? "pointer" : "default" }}
                          onClick={() => b.linkUrl && window.location.assign(b.linkUrl)}
                        >
                          {b.imageUrl ? (
                            <img
                              src={b.imageUrl}
                              alt={b.title}
                              style={{
                                width: "100%", height: "100%",
                                objectFit: "cover",
                              }}
                              loading="lazy"
                            />
                          ) : (
                            <div style={{
                              width: "100%", height: "100%",
                              display: "flex", alignItems: "center",
                              justifyContent: "center", flexDirection: "column",
                              gap: 16,
                              background: "linear-gradient(135deg, var(--c-surface), var(--c-surface2))",
                              position: "relative",
                              overflow: "hidden",
                            }}>
                              {/* Tech pattern overlay */}
                              <div style={{
                                position: "absolute", inset: 0,
                                backgroundImage: `
                                  radial-gradient(circle at 20% 50%, rgba(0,200,255,0.05) 0%, transparent 50%),
                                  radial-gradient(circle at 80% 20%, rgba(124,58,255,0.05) 0%, transparent 50%)
                                `,
                              }} />
                              <motion.span
                                style={{ fontSize: 100, position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                                animate={{
                                  rotate: [0, 5, -5, 0],
                                  scale: [1, 1.05, 1],
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                              >
                                <Icon emoji="🔥" size={80} />
                              </motion.span>
                              <motion.span
                                style={{
                                  fontSize: 14, color: "var(--c-muted)",
                                  position: "relative", zIndex: 1,
                                }}
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                {b.title || "Epic Deals Loading..."}
                              </motion.span>
                            </div>
                          )}

                          {/* Gradient overlay + content */}
                          <div style={{
                            position: "absolute", bottom: 0, left: 0, right: 0,
                            padding: "40px 28px 32px",
                            background: "linear-gradient(to top, rgba(4,11,20,0.95) 0%, rgba(4,11,20,0.4) 50%, transparent 100%)",
                          }}>
                            {b.badge && (
                              <motion.span
                                className="badge badge-hot"
                                style={{
                                  marginBottom: 10, display: "inline-block",
                                  fontSize: 12,
                                }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                              >
                                {b.badge}
                              </motion.span>
                            )}
                            <motion.h2
                              style={{
                                fontSize: 26, fontWeight: 800,
                                color: "#fff", letterSpacing: "-0.3px",
                              }}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              {b.title}
                            </motion.h2>
                            {b.subtitle && (
                              <motion.p
                                style={{
                                  fontSize: 15, color: "rgba(255,255,255,0.7)",
                                  marginTop: 6,
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                              >
                                {b.subtitle}
                              </motion.p>
                            )}
                            {b.linkUrl && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                              >
                                <span
                                  className="btn btn-primary btn-sm"
                                  style={{ marginTop: 14, display: "inline-block", pointerEvents: "none" }}
                                >
                                  Shop Now →
                                </span>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      ) : null
                    )}
                  </AnimatePresence>

                  {/* Carousel dots */}
                  {heroBanners.length > 1 && (
                    <div style={{
                      position: "absolute", bottom: 20, right: 20,
                      display: "flex", gap: 8, zIndex: 3,
                    }}>
                      {heroBanners.map((_, i) => (
                        <motion.button
                          key={i}
                          onClick={() => setActiveSlide(i)}
                          style={{
                            height: 8, borderRadius: 99,
                            background: i === activeSlide ? "var(--c-accent)" : "rgba(255,255,255,0.3)",
                            border: "none", cursor: "pointer", padding: 0,
                          }}
                          animate={{ width: i === activeSlide ? 28 : 8 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </TiltCard>
            </motion.div>
          </div>
        </motion.div>
      </motion.section>

      {/* ═══ CATEGORIES — Premium Grid ════════════════════════════════════ */}
      <AnimatedSection style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "0 24px 80px" }}>
        <FadeInUp>
          <SectionHeader title="Browse by Category" link="/shop" linkLabel="All categories →" />
        </FadeInUp>
        <motion.div
          variants={staggerContainer}
          className="cat-grid"
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          {(categories.length > 0 ? categories : DEMO_CATS).map((cat, i) => (
            <motion.div
              key={cat.id || cat.slug}
              variants={scaleIn}
              custom={i}
            >
              <Link href={`/shop/${cat.slug}`} style={{ textDecoration: "none" }}>
                <motion.div
                  className="glass"
                  style={{
                    padding: "28px 16px",
                    borderRadius: "var(--r-lg)",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    border: "1px solid var(--c-border-light)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  whileHover={{
                    y: -8,
                    borderColor: "rgba(0,200,255,0.3)",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
                  }}
                >
                  <motion.div
                    style={{ marginBottom: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <Icon emoji={cat.icon || "📦"} size={36} />
                  </motion.div>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: "var(--c-text)",
                    letterSpacing: "-0.2px",
                  }}>
                    {cat.name}
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </AnimatedSection>

      {/* ═══ FEATURED PRODUCTS ═══════════════════════════════════════════ */}
      <AnimatedSection style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "0 24px 80px" }}>
        <FadeInUp>
          <SectionHeader title={<><Icon emoji="⭐" size={22} /> Featured Products</>} link="/shop?featured=1" linkLabel="View all →" />
        </FadeInUp>
        {featured.length > 0 ? (
          <motion.div
            className="products-grid"
            variants={staggerGrid}
          >
            {featured.map((p) => (
              <motion.div key={p.id} variants={fadeInUp}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <EmptyState message="Featured products will appear here" icon="⭐" />
        )}
      </AnimatedSection>

      {/* ═══ HOT DEALS ════════════════════════════════════════════════════ */}
      <AnimatedSection style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "0 24px 80px" }}>
        <FadeInUp>
          <SectionHeader title={<><Icon emoji="🔥" size={22} /> Hot Deals</>} link="/deals" linkLabel="View all deals →" />
        </FadeInUp>
        {deals.length > 0 ? (
          <motion.div
            className="products-grid"
            variants={staggerGrid}
          >
            {deals.map((p: any) => (
              <motion.div key={p.id} variants={fadeInUp}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <EmptyState message="Hot deals are loading — check back soon!" icon="🔥" />
        )}
      </AnimatedSection>

      {/* ═══ PROMO BANNER STRIP — Why Technodel ═══════════════════════════ */}
      <AnimatedSection stagger style={{ margin: "0 0 80px" }}>
        <motion.div
          className="glass-strong"
          style={{
            borderTop: "1px solid var(--c-border)",
            borderBottom: "1px solid var(--c-border)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <FloatingOrb colorClass="orb-cyan" size={300} initialX={-5} initialY={20} speed={0.5} />
          <div style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "48px 24px" }}>
            <motion.div
              variants={staggerContainer}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 40,
              }}
            >
              {[
                { icon: "🚚", title: "Lightning Delivery", desc: "1-3 days across Lebanon", color: "var(--c-accent)" },
                { icon: "✅", title: "100% Authentic", desc: "Only genuine, warrantied products", color: "var(--c-success)" },
                { icon: "💰", title: "Price Match", desc: "Matched with competitors daily", color: "var(--c-warning)" },
                { icon: "🔄", title: "Easy Returns", desc: "7-day hassle-free returns", color: "var(--c-accent2)" },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  variants={perspectiveReveal}
                  custom={i}
                  style={{
                    display: "flex", gap: 18,
                    alignItems: "flex-start",
                    padding: "8px",
                  }}
                >
                  <motion.div
                    style={{
                      width: 52, height: 52, borderRadius: "var(--r-md)",
                      background: `rgba(from ${f.color} r g b / 0.1)`,
                      display: "flex", alignItems: "center",
                      justifyContent: "center", flexShrink: 0,
                      border: `1px solid rgba(from ${f.color} r g b / 0.2)`,
                    }}
                    whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <Icon emoji={f.icon} size={24} />
                  </motion.div>
                  <div style={{ paddingTop: 4 }}>
                    <div style={{
                      fontWeight: 700, fontSize: 15,
                      marginBottom: 4, color: "var(--c-text)",
                    }}>
                      {f.title}
                    </div>
                    <div style={{
                      fontSize: 13, color: "var(--c-muted)",
                      lineHeight: 1.5,
                    }}>
                      {f.desc}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </AnimatedSection>

      {/* ═══ NEW ARRIVALS ════════════════════════════════════════════════ */}
      <AnimatedSection style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "0 24px 80px" }}>
        <FadeInUp>
          <SectionHeader title={<><Icon emoji="🆕" size={22} /> New Arrivals</>} link="/shop?new=1" linkLabel="See all new →" />
        </FadeInUp>
        {newArrivals.length > 0 ? (
          <motion.div
            className="products-grid"
            variants={staggerGrid}
          >
            {newArrivals.map((p) => (
              <motion.div key={p.id} variants={fadeInUp}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <EmptyState message="New products will appear here once added" icon="🆕" />
        )}
      </AnimatedSection>

      {/* ═══ BRANDS SHOWCASE ════════════════════════════════════════════ */}
      <AnimatedSection style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "0 24px 80px" }}>
        <FadeInUp>
          <h2 style={{
            fontSize: 24, fontWeight: 800,
            marginBottom: 32, letterSpacing: "-0.3px",
            textAlign: "center",
          }}>
            Trusted Brands
          </h2>
        </FadeInUp>
        <motion.div
          variants={staggerContainer}
          style={{
            display: "flex", flexWrap: "wrap", gap: 16,
            justifyContent: "center", alignItems: "center",
          }}
        >
          {["Apple", "Samsung", "Sony", "HP", "Dell", "Lenovo", "ASUS", "Acer", "MSI", "Logitech", "JBL", "Canon"].map((brand, i) => (
            <motion.div
              key={brand}
              variants={scaleIn}
              custom={i}
              whileHover={{ scale: 1.08, y: -4 }}
            >
              <Link
                href={`/shop?brand=${brand}`}
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "10px 22px",
                  borderRadius: "var(--r-md)",
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border-light)",
                  color: "var(--c-muted)",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,200,255,0.3)";
                  e.currentTarget.style.color = "var(--c-accent)";
                  e.currentTarget.style.background = "rgba(0,200,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--c-border-light)";
                  e.currentTarget.style.color = "var(--c-muted)";
                  e.currentTarget.style.background = "var(--c-surface)";
                }}
              >
                {brand}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </AnimatedSection>

      {/* ═══ NEWSLETTER + WHATSAPP CTA ══════════════════════════════════ */}
      <AnimatedSection style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "0 24px 80px" }}>
        <motion.div
          style={{
            borderRadius: "var(--r-xxl)",
            padding: "56px 48px",
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, rgba(0,200,255,0.08), rgba(124,58,255,0.08))",
            border: "1px solid var(--c-border)",
          }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <FloatingOrb colorClass="orb-cyan" size={400} initialX={80} initialY={-20} speed={0.7} />
          <FloatingOrb colorClass="orb-purple" size={300} initialX={-10} initialY={60} speed={0.5} />

          <div style={{
            display: "flex", gap: 40,
            alignItems: "center",
            flexWrap: "wrap",
            position: "relative",
            zIndex: 1,
          }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <motion.h2
                style={{
                  fontSize: 30, fontWeight: 900,
                  marginBottom: 12,
                  letterSpacing: "-0.5px",
                  lineHeight: 1.15,
                }}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <span className="grad-text">Order via WhatsApp</span> <Icon emoji="💬" size={22} />
              </motion.h2>
              <motion.p
                style={{
                  color: "var(--c-muted)",
                  fontSize: 16,
                  lineHeight: 1.7,
                  marginBottom: 24,
                }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                Prefer personal service? Chat with us on WhatsApp.
                We&apos;ll help you find the perfect product and arrange
                fast delivery anywhere in Lebanon.
              </motion.p>

              {/* WhatsApp CTA */}
              <motion.a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "961XXXXXXXX"}?text=Hi%20Technodel%2C%20I%20need%20help%20choosing%20tech`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 12,
                  padding: "16px 32px",
                  background: "#25d366",
                  color: "#fff",
                  borderRadius: "var(--r-md)",
                  fontWeight: 700,
                  fontSize: 17,
                  textDecoration: "none",
                  boxShadow: "0 8px 32px rgba(37,211,102,0.3)",
                  position: "relative",
                  overflow: "hidden",
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <motion.svg
                  width="24" height="24" viewBox="0 0 24 24" fill="currentColor"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.845L.057 23.512a.5.5 0 0 0 .612.612l5.716-1.465A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.955 0-3.792-.537-5.368-1.472l-.385-.229-3.99 1.023 1.037-3.898-.247-.4A9.961 9.961 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </motion.svg>
                Chat on WhatsApp
              </motion.a>
            </div>

            <div style={{ flex: "0 0 auto", textAlign: "center" }}>
              <motion.div
                style={{
                  width: 140, height: 140,
                  borderRadius: "50%",
                  background: "rgba(37,211,102,0.08)",
                  border: "1px solid rgba(37,211,102,0.2)",
                  display: "flex", alignItems: "center",
                  justifyContent: "center",
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Icon emoji="💬" size={64} />
              </motion.div>
              <div style={{
                fontSize: 12, color: "var(--c-muted)",
                marginTop: 8, fontWeight: 600,
              }}>
                Response in minutes
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatedSection>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════════════════════
function SectionHeader({ title, link, linkLabel }: { title: string | ReactNode; link: string; linkLabel: string }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div
      style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 28,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h2 style={{
        fontSize: 26, fontWeight: 800,
        letterSpacing: "-0.3px",
        background: isHovered ? "var(--grad-accent)" : "none",
        WebkitBackgroundClip: isHovered ? "text" : "none",
        WebkitTextFillColor: isHovered ? "transparent" : "var(--c-text)",
        backgroundClip: isHovered ? "text" : "none",
        transition: "all 0.3s ease",
      }}>
        {title}
      </h2>
      <Link href={link} style={{
        fontSize: 14, color: isHovered ? "var(--c-accent)" : "var(--c-muted)",
        textDecoration: "none", fontWeight: 600,
        display: "flex", alignItems: "center", gap: 6,
        transition: "color 0.3s ease",
      }}>
        {linkLabel}
        <motion.span
          animate={{ x: isHovered ? 4 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: "inline-flex" }}
        >
          <Icon name="arrow-right" size={14} />
        </motion.span>
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════════════
function EmptyState({ message, icon = "📦" }: { message: string; icon?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        textAlign: "center", padding: "60px 24px",
        color: "var(--c-muted)",
        background: "var(--c-surface)",
        borderRadius: "var(--r-xl)",
        border: "1px dashed var(--c-border)",
      }}
    >
      <motion.div
        style={{ marginBottom: 12, display: "inline-flex" }}
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <Icon emoji={icon} size={48} />
      </motion.div>
      <p style={{ fontSize: 15 }}>{message}</p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STARTER DATA
// ═══════════════════════════════════════════════════════════════════════════════
const staggerGrid = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const DEMO_CATS = [
  { id: "1", slug: "smartphones",  name: "Smartphones",  icon: "📱" },
  { id: "2", slug: "laptops",      name: "Laptops",      icon: "💻" },
  { id: "3", slug: "tablets",      name: "Tablets",      icon: "📲" },
  { id: "4", slug: "gaming",       name: "Gaming",       icon: "🎮" },
  { id: "5", slug: "audio",        name: "Audio",        icon: "🎧" },
  { id: "6", slug: "accessories",  name: "Accessories",  icon: "🔌" },
  { id: "7", slug: "networking",   name: "Networking",   icon: "📡" },
  { id: "8", slug: "cameras",      name: "Cameras",      icon: "📷" },
  { id: "9", slug: "printers",     name: "Printers",     icon: "🖨️" },
  { id: "10", slug: "smart-home",  name: "Smart Home",   icon: "🏠" },
  { id: "11", slug: "wearables",   name: "Wearables",    icon: "⌚" },
  { id: "12", slug: "storage",     name: "Storage",      icon: "💾" },
];
