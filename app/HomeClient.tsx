"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { Icon } from "@/components/ui/Icon";
import {
  heroText, staggerContainer, fadeInUp,
  blurReveal, clipReveal, staggerHero,
} from "@/lib/animations";

interface Category { id: string; name: string; slug: string; icon?: string | null; image?: string | null; }
interface Banner { id: string; title: string; subtitle?: string | null; imageUrl: string; linkUrl?: string | null; badge?: string | null; }
interface HeroSlide { id: string; title: string; subtitle?: string; imageUrl: string; linkUrl?: string; badge?: string; imageFit?: "contain" | "cover"; }
type HomeBelowFoldProps = ComponentProps<typeof HomeBelowFold>;
type HomeProduct = HomeBelowFoldProps["featured"][number];

interface Props {
  featured: HomeProduct[];
  categories: Category[];
  banners: Banner[];
  newArrivals: HomeProduct[];
  deals: HomeProduct[];
  catalogStats: {
    productCount: number;
    brandCount: number;
  };
}

function shuffleItems<T>(items: T[]): T[] {
  const next = items.slice();
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function pickRandomItems<T>(items: T[], take: number): T[] {
  return shuffleItems(items).slice(0, take);
}

function pickDiverseProducts(items: HomeProduct[], take: number): HomeProduct[] {
  const shuffled = shuffleItems(items);
  const picked: HomeProduct[] = [];
  const usedCategories = new Set<string>();
  const usedSuppliers = new Set<string>();

  for (const product of shuffled) {
    const categoryKey = (product.category?.name || "").toLowerCase();
    const supplierKey = (product.competitor?.name || product.brand || "").toLowerCase();
    if (usedCategories.has(categoryKey) && usedSuppliers.has(supplierKey)) continue;
    picked.push(product);
    if (categoryKey) usedCategories.add(categoryKey);
    if (supplierKey) usedSuppliers.add(supplierKey);
    if (picked.length >= take) return picked;
  }

  for (const product of shuffled) {
    if (picked.some((p) => p.id === product.id)) continue;
    picked.push(product);
    if (picked.length >= take) break;
  }

  return picked;
}

const FEATURED_TAGS = [
  "Smartphones", "Laptops", "Gaming", "Audio",
  "Accessories", "Tablets", "Networking", "Cameras",
];

const HomeBelowFold = dynamic(() => import("@/components/home/HomeBelowFold"), {
  ssr: false,
  loading: () => (
    <div className="section-lazy" style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "0 24px 80px" }}>
      <div style={{ height: 220, borderRadius: "var(--r-xl)", border: "1px solid var(--c-border)", background: "var(--c-surface)" }} />
    </div>
  ),
});

// ─── PARALLAX MOUSE TRACKER ─────────────────────────────────────────────────────
function useMousePosition(enabled: boolean) {
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
    if (!enabled) return;
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [enabled, handleMouseMove]);

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
function parseFirstImage(images: unknown): string {
  if (!images) return "";
  if (Array.isArray(images)) return typeof images[0] === "string" ? images[0] : "";
  if (typeof images === "string") {
    try {
      const arr = JSON.parse(images);
      return Array.isArray(arr) && typeof arr[0] === "string" ? arr[0] : "";
    } catch {
      return "";
    }
  }
  return "";
}

function normalizeHeroLink(link?: string | null): string {
  if (!link) return "/shop";
  if (link.startsWith("/product/")) return link;
  if (link.startsWith("/shop") || link.startsWith("/deals") || link.startsWith("/product")) return link;
  try {
    const u = new URL(link);
    if (u.pathname.startsWith("/new/product/")) return u.pathname.replace("/new", "");
    if (u.pathname.startsWith("/product/")) return u.pathname;
  } catch {
    // non-URL string fallback below
  }
  return "/shop";
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

export default function HomeClient({ featured, categories, banners, newArrivals, deals, catalogStats }: Props) {
  const router = useRouter();
  const performanceMode = true;
  const [showBelowFold, setShowBelowFold] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [tagIndex, setTagIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const belowFoldRef = useRef<HTMLDivElement>(null);
  const mouse = useMousePosition(!performanceMode);
  const { scrollY } = useScroll();
  const [featuredProducts] = useState(() => pickDiverseProducts(featured, 8));
  const [dealProducts] = useState(() => pickDiverseProducts(deals, 8));
  const [newArrivalProducts] = useState(() => pickDiverseProducts(newArrivals, 8));

  // Parallax values
  const heroParallaxY = useTransform(scrollY, [0, 600], [0, performanceMode ? 0 : 150]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, performanceMode ? 1 : 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, performanceMode ? 1 : 0.95]);
  const gridParallaxX = useTransform(mouse.x, [-1, 1], [-20, 20]);
  const gridParallaxY = useTransform(mouse.y, [-1, 1], [-20, 20]);

  // Typewriter-like tag cycling
  useEffect(() => {
    const t = setInterval(() => setTagIndex((p) => (p + 1) % FEATURED_TAGS.length), 2500);
    return () => clearInterval(t);
  }, []);

  const dealSlides: HeroSlide[] = (dealProducts || []).slice(0, 5).map((p) => {
    const img = parseFirstImage(p.images);
    const comparePrice = typeof p.comparePrice === "number" ? p.comparePrice : null;
    const hasDiscount = comparePrice !== null && typeof p.displayPrice === "number" && comparePrice > p.displayPrice;
    const pct = hasDiscount ? Math.round(((comparePrice - p.displayPrice) / comparePrice) * 100) : 0;
    return {
      id: p.id,
      title: p.title,
      subtitle: p.category?.name ? `${p.category.name} Deal` : "Hot Deal",
      imageUrl: img,
      linkUrl: `/product/${encodeURIComponent(p.slug)}`,
      badge: hasDiscount && pct > 0 ? `🔥 -${pct}%` : "🔥 Deal",
      imageFit: "contain" as const,
    };
  }).filter((s) => !!s.imageUrl && !!s.linkUrl);

  const bannerSlides: HeroSlide[] = (banners || []).map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle || undefined,
    imageUrl: b.imageUrl,
    linkUrl: normalizeHeroLink(b.linkUrl),
    badge: b.badge || undefined,
  })).filter((s) => !!s.imageUrl);

  const featuredSlides: HeroSlide[] = (featuredProducts || [])
    .slice()
    .sort((left, right) => {
      const leftLaptop = left.category?.name?.toLowerCase().includes("laptop") ? 1 : 0;
      const rightLaptop = right.category?.name?.toLowerCase().includes("laptop") ? 1 : 0;
      return rightLaptop - leftLaptop;
    })
    .slice(0, 4)
    .map((product) => ({
      id: `featured-${product.id}`,
      title: product.title,
      subtitle: product.category?.name ? `Featured ${product.category.name}` : "Featured Product",
      imageUrl: parseFirstImage(product.images),
      linkUrl: `/product/${encodeURIComponent(product.slug)}`,
      badge: product.category?.name?.toLowerCase().includes("laptop") ? "💻 Featured Laptops" : "⭐ Featured",
    }))
    .filter((slide) => !!slide.imageUrl);

  const heroBanners: HeroSlide[] = dealSlides.length > 0
    ? [...dealSlides, ...featuredSlides].slice(0, 6)
    : featuredSlides.length > 0
    ? [...featuredSlides, ...bannerSlides].slice(0, 6)
    : bannerSlides.length > 0
    ? bannerSlides
    : [
        { id: "fallback-1", title: "New Arrivals Daily", subtitle: "Discover the latest tech at Technodel", imageUrl: "", badge: "🔥 Hot", linkUrl: "/shop" },
      ];

  // Auto-rotate hero banner
  useEffect(() => {
    if (heroBanners.length < 2) return;
    timerRef.current = setInterval(() => setActiveSlide((p) => (p + 1) % heroBanners.length), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [heroBanners.length]);

  useEffect(() => {
    if (showBelowFold) return;
    const node = belowFoldRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowBelowFold(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [showBelowFold]);

  return (
    <div className="page-enter">

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION — Immersive 3D Parallax Experience
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className="hero-gradient hero-section"
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
        {!performanceMode && (
          <>
            <FloatingOrb colorClass="orb-cyan" size={600} initialX={5} initialY={-10} speed={1.2} />
            <FloatingOrb colorClass="orb-purple" size={400} initialX={75} initialY={5} speed={0.8} />
            <FloatingOrb colorClass="orb-green" size={300} initialX={50} initialY={60} speed={0.6} />
            <FloatingOrb colorClass="orb-orange" size={250} initialX={85} initialY={70} speed={0.9} />
          </>
        )}

        {/* Mouse-parallax decorative grid lines */}
        {!performanceMode && (
          <motion.div
            style={{
              position: "absolute", inset: 0,
              backgroundImage: `
                linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
              x: gridParallaxX,
              y: gridParallaxY,
              pointerEvents: "none",
            }}
          />
        )}

        <motion.div
          className="hero-content"
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
                  { label: "Products", end: Math.max(0, catalogStats.productCount) },
                  { label: "Brands", end: Math.max(0, catalogStats.brandCount) },
                  { label: "Delivery", value: "1-3 Days", end: 0 },
                  { label: "Happy Clients", end: 15000, suffix: "+" },
                ].map((stat: { label: string; end: number; suffix?: string; value?: string }, i) => (
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
                        <CountUp end={stat.end} duration={2000 + i * 300} />
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
              <div>
                <div style={{
                  position: "relative",
                  borderRadius: "var(--r-xxl)",
                  overflow: "hidden",
                  aspectRatio: "4/3",
                  boxShadow: "0 40px 80px rgba(0,0,0,0.4), 0 0 60px rgba(0,200,255,0.06)",
                }} className="grad-border-accent hero-banner">
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
                          onClick={() => {
                            if (b.linkUrl) router.push(normalizeHeroLink(b.linkUrl));
                          }}
                        >
                          {b.imageUrl ? (
                            <OptimizedImage
                              src={b.imageUrl}
                              alt={b.title}
                              fill
                              priority={activeSlide === i}
                              objectFit={b.imageFit || "cover"}
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
                          }} className="banner-content">
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
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.section>

      <div ref={belowFoldRef}>
        {showBelowFold ? (
          <HomeBelowFold featured={featuredProducts} categories={categories} deals={dealProducts} newArrivals={newArrivalProducts} />
        ) : (
          <div className="section-lazy" style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "0 24px 80px" }}>
            <div style={{ height: 800, borderRadius: "var(--r-xl)", border: "1px solid var(--c-border)", background: "var(--c-surface)" }} />
          </div>
        )}
      </div>

    </div>
  );
}
