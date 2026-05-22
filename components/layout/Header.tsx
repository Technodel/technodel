"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
// import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useCartStore } from "@/store/cart";
import { useThemeStore } from "@/store/theme";
import { useCurrencyStore } from "@/store/currency";
import SearchBar from "@/components/layout/SearchBar";
import { Icon } from "@/components/ui/Icon";

export default function Header() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.count());
  const { theme, toggle } = useThemeStore();
  const { currency, setCurrency } = useCurrencyStore();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const scrolledRef = useRef(false);

  useEffect(() => {
    let ticking = false;

    const updateScrolled = () => {
      ticking = false;
      const y = window.scrollY;
      // Use hysteresis to prevent sticky header bounce near threshold.
      const nextScrolled = scrolledRef.current ? y > 40 : y > 90;
      if (scrolledRef.current !== nextScrolled) {
        scrolledRef.current = nextScrolled;
        setScrolled(nextScrolled);
      }
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateScrolled);
    };

    updateScrolled();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isLight = theme === "light";

  return (
    <motion.header
      initial={shouldReduceMotion ? false : { y: -100, opacity: 0 }}
      animate={shouldReduceMotion ? undefined : { y: 0, opacity: 1 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        borderBottom: `1px solid ${scrolled ? "var(--c-border)" : "transparent"}`,
        background: scrolled
          ? isLight ? "rgba(0,48,135,0.95)" : "rgba(4,11,20,0.88)"
          : isLight ? "rgba(0,48,135,0.98)" : "transparent",
        backdropFilter: scrolled ? "blur(24px) saturate(1.8)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(24px) saturate(1.8)" : "none",
        boxShadow: scrolled
          ? isLight ? "0 4px 30px rgba(0,0,0,0.1)" : "0 4px 30px rgba(0,0,0,0.3)"
          : "none",
      }}
    >
      {/* Top bar — premium announcement strip (hidden on mobile) */}
      <motion.div
        className="hide-mobile"
        animate={shouldReduceMotion ? undefined : { maxHeight: scrolled ? 0 : 34, opacity: scrolled ? 0 : 1 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ overflow: "hidden" }}
      >
        <div style={{
          background: isLight ? "#000" : "linear-gradient(135deg, rgba(0,200,255,0.06), rgba(124,58,255,0.04))",
          padding: "6px 0",
          borderBottom: isLight ? "none" : "1px solid rgba(26,46,74,0.3)",
        }}>
          <div style={{
            maxWidth: "var(--max-w)", margin: "0 auto", padding: "0 24px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <motion.span
              style={{ fontSize: 12, color: "var(--c-muted)", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}
              animate={{ opacity: scrolled ? 0 : 1 }}
            >
              <motion.span
                className="pulse-dot"
                style={{ width: 6, height: 6 }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <Icon emoji="🚚" size={14} /> Free delivery on orders over $150 · Lebanon&apos;s #1 Tech Store
            </motion.span>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <Link href="/account" style={{ fontSize: 12, color: "var(--c-muted)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--c-text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--c-muted)")}
              >My Account</Link>
              <Link href="/account/orders" style={{ fontSize: 12, color: "var(--c-muted)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--c-text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--c-muted)")}
              >Orders</Link>
              {/* Currency toggle */}
              <motion.button
                onClick={() => setCurrency(currency === "USD" ? "LBP" : "USD")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  fontSize: 11, padding: "2px 10px", borderRadius: 99,
                  border: "1px solid var(--c-border)", background: "transparent",
                  color: "var(--c-muted)", cursor: "pointer",
                  fontWeight: 700,
                }}
                title="Toggle currency"
              >
                {currency === "USD" ? "LBP" : "USD"}
              </motion.button>
              {/* Theme toggle */}
              <motion.button
                onClick={toggle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  fontSize: 11, padding: "2px 10px", borderRadius: 99,
                  border: "1px solid var(--c-border)", background: "transparent",
                  color: "var(--c-muted)", cursor: "pointer",
                }}
                title="Toggle theme"
              >
                {isLight ? <><Icon name="moon" size={14} /> Dark</> : <><Icon name="sun" size={14} /> Light</>}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main nav */}
      <div style={{ maxWidth: "var(--max-w)", margin: "0 auto", padding: "0 clamp(14px, 4vw, 24px)" }}>
        <motion.div
          animate={shouldReduceMotion ? undefined : { height: scrolled ? "clamp(48px, 8vw, 64px)" : "clamp(56px, 10vw, 94px)" }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3, ease: "easeInOut" }}
          style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 2vw, 24px)", overflow: "visible", minWidth: 0 }}
        >
          {/* Logo — responsive sizing */}
          <motion.div
            animate={shouldReduceMotion ? undefined : { scale: scrolled ? 0.85 : 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
            className="header-logo"
          >
            <Link href="/" style={{ textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center" }}>
              <Image
                src="/new/logo.png"
                alt="Technodel"
                width={220}
                height={110}
                priority
                style={{
                  width: "auto",
                  height: "clamp(60px, 9vw, 110px)",
                  objectFit: "contain",
                  maxWidth: "100%",
                }}
              />
            </Link>
          </motion.div>

          {/* Search — grows to fill space */}
          <motion.div
            animate={shouldReduceMotion ? undefined : { width: scrolled ? "60%" : "100%" }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
            style={{ flex: 1, maxWidth: 560 }}
            className="hide-mobile"
          >
            <SearchBar />
          </motion.div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }} className="hide-mobile">
            <NavLink href="/shop" label={<><Icon emoji="🛍️" size={16} /> Shop</>} active={pathname.startsWith("/shop")} isLight={isLight} />
            <NavLink href="/deals" label={<><Icon emoji="🔥" size={16} /> Deals</>} active={pathname === "/deals"} isLight={isLight} />
            <NavLink href="/account" label={<><Icon emoji="👤" size={16} /> Account</>} active={pathname.startsWith("/account") && !pathname.startsWith("/account/orders")} isLight={isLight} />
            <NavLink href="/account/orders" label={<><Icon emoji="📦" size={16} /> Orders</>} active={pathname.startsWith("/account/orders")} isLight={isLight} />

            {/* Cart — Premium glow button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ position: "relative" }}
            >
              <Link
                href="/cart"
                className="shine"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  borderRadius: "var(--r-md)",
                  background: isLight ? "#ffe000" : "var(--grad-primary)",
                  color: isLight ? "#003087" : "#fff",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow: isLight
                    ? "0 4px 16px rgba(255,224,0,0.3)"
                    : "0 4px 20px rgba(0,200,255,0.3)",
                  transition: "box-shadow 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isLight) e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,200,255,0.5)";
                }}
                onMouseLeave={(e) => {
                  if (!isLight) e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,200,255,0.3)";
                }}
              >
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ display: "inline-flex" }}
                >
                  <Icon emoji="🛒" size={18} />
                </motion.span>
                <AnimatePresence mode="wait">
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 1.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.3, opacity: 0 }}
                      transition={{ duration: 0.25, type: "spring", stiffness: 400, damping: 12 }}
                      style={{
                        background: isLight ? "#003087" : "#ff4444",
                        color: "#fff", borderRadius: 99,
                        minWidth: 20, height: 20,
                        padding: "0 6px", fontSize: 11, fontWeight: 800,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        position: "absolute", top: 4, right: 6,
                        boxShadow: "0 2px 8px rgba(255,68,68,0.3)",
                      }}
                    >
                      {cartCount > 99 ? "99+" : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
                Cart
              </Link>
            </motion.div>
          </div>

          {/* Mobile menu toggle */}
          <motion.button
            onClick={() => setMenuOpen(!menuOpen)}
            whileTap={{ scale: 0.9 }}
            style={{
              background: "transparent", border: "none",
              color: "var(--c-text)", fontSize: 24,
              cursor: "pointer", padding: 10,
            }}
            className="hide-desktop"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <motion.span
              key={menuOpen ? "close" : "open"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{ display: "inline-flex" }}
            >
              {menuOpen ? <Icon name="x" size={22} /> : <Icon name="menu" size={22} />}
            </motion.span>
          </motion.button>
        </motion.div>
      </div>

      {/* Category nav strip — Premium */}
      <motion.div
        animate={{
          maxHeight: scrolled ? 0 : 52,
          opacity: scrolled ? 0 : 1,
        }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          overflow: "hidden",
          borderTop: "1px solid var(--c-border)",
          background: isLight ? "#003087" : "linear-gradient(180deg, rgba(13,26,45,0.6), var(--c-surface))",
        }}
        className="hide-mobile"
      >
        <div style={{
          maxWidth: "var(--max-w)", margin: "0 auto",
          padding: "0 24px", display: "flex", gap: 2, overflowX: "auto",
          scrollbarWidth: "none",
        }}>
          {NAV_CATS.map((c, i) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.03, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ flexShrink: 0 }}
            >
              <CatNavLink href={`/shop/${c.slug}`} icon={c.icon} label={c.name} active={pathname === `/shop/${c.slug}`} isLight={isLight} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Mobile drawer — Premium glass with categories */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              overflow: "hidden",
              background: isLight ? "rgba(0,48,135,0.98)" : "rgba(4,11,20,0.95)",
              backdropFilter: "blur(24px)",
              borderTop: "1px solid var(--c-border)",
              maxHeight: "calc(100dvh - var(--header-h))",
              overflowY: "auto",
            }}
            className="hide-desktop"
          >
            <div style={{ padding: 16 }}>
              <SearchBar />
              <motion.div
                initial="closed"
                animate="open"
                variants={{
                  open: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
                  closed: {},
                }}
                style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 2 }}
              >
                {/* Main navigation items */}
                {[
                  { href: "/shop", label: "Shop All", icon: "shopping-bag" },
                  { href: "/deals", label: "Hot Deals", icon: "flame" },
                  { href: "/cart", label: `Cart${cartCount > 0 ? ` (${cartCount})` : ""}`, icon: "shopping-cart" },
                  { href: "/account", label: "My Account", icon: "user" },
                ].map((item: { href: string; label: string; icon: string }, i: number) => (
                  <motion.div
                    key={item.href}
                    variants={{
                      open: { opacity: 1, x: 0 },
                      closed: { opacity: 0, x: -24 },
                    }}
                    custom={i}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      style={{
                        padding: "14px 0", color: "var(--c-text)",
                        textDecoration: "none", fontWeight: 600,
                        display: "flex", gap: 14, alignItems: "center",
                        borderBottom: "1px solid rgba(26,46,74,0.3)",
                        transition: "color 0.2s",
                        minHeight: 48,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--c-accent)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--c-text)")}
                    >
                      <span style={{ display: "inline-flex", width: 24, justifyContent: "center" }}>
                        <Icon name={item.icon} size={20} />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </motion.div>
                ))}

                {/* Category links */}
                <div style={{ marginTop: 16, marginBottom: 8 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "1px", color: "var(--c-muted)",
                    marginBottom: 8, paddingLeft: 2,
                  }}>
                    Categories
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {NAV_CATS.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/shop/${c.slug}`}
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "12px 10px", minHeight: 44,
                          borderRadius: "var(--r-sm)",
                          background: "var(--c-surface)",
                          textDecoration: "none", fontSize: 13, fontWeight: 500,
                          color: "var(--c-text2)",
                          border: "1px solid var(--c-border-light)",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--c-accent)";
                          e.currentTarget.style.color = "var(--c-accent)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--c-border-light)";
                          e.currentTarget.style.color = "var(--c-text2)";
                        }}
                      >
                        <Icon emoji={c.icon} size={16} />
                        <span>{c.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Quick actions row */}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <motion.button
                    onClick={() => { setCurrency(currency === "USD" ? "LBP" : "USD"); }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: "var(--r-sm)",
                      border: "1px solid var(--c-border)", background: "var(--c-surface)",
                      color: "var(--c-text)", cursor: "pointer", fontWeight: 600,
                      fontSize: 13, minHeight: 44,
                    }}
                  >
                    {currency === "USD" ? "LBP" : "USD"}
                  </motion.button>
                  <motion.button
                    onClick={() => { toggle(); }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: "var(--r-sm)",
                      border: "1px solid var(--c-border)", background: "var(--c-surface)",
                      color: "var(--c-text)", cursor: "pointer", fontWeight: 600,
                      fontSize: 13, minHeight: 44,
                    }}
                  >
                    {isLight ? <><Icon name="moon" size={16} /> Dark</> : <><Icon name="sun" size={16} /> Light</>}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

function NavLink({ href, label, active, isLight }: { href: string; label: string | React.ReactNode; active: boolean; isLight: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <Link
        href={href}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          whiteSpace: "nowrap",
          lineHeight: 1,
          padding: "8px 16px",
          borderRadius: "var(--r-md)",
          fontSize: 14,
          fontWeight: active ? 700 : 500,
          color: active ? (isLight ? "#ffe000" : "var(--c-accent)") : isLight ? "#fff" : "var(--c-muted)",
          textDecoration: "none",
          transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
          background: active
            ? isLight ? "rgba(255,224,0,0.12)" : "rgba(0,200,255,0.1)"
            : hovered
              ? isLight ? "rgba(255,255,255,0.08)" : "rgba(0,200,255,0.05)"
              : "transparent",
          position: "relative",
        }}
      >
        {label}
        {active && (
          <motion.div
            layoutId="navActive"
            style={{
              position: "absolute",
              bottom: -2,
              left: "50%",
              transform: "translateX(-50%)",
              width: "60%",
              height: 2,
              borderRadius: 99,
              background: isLight ? "#ffe000" : "var(--c-accent)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        )}
      </Link>
    </motion.div>
  );
}

// ─── CATEGORY NAV LINK ──────────────────────────────────────────────────────────
function CatNavLink({ href, icon, label, active, isLight }: {
  href: string; icon: string; label: string; active: boolean; isLight: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "10px 14px", fontSize: 13, fontWeight: active ? 700 : 500,
        color: active ? "var(--c-accent)" : isLight ? "rgba(255,255,255,0.75)" : "var(--c-muted)",
        textDecoration: "none", whiteSpace: "nowrap",
        borderBottom: active ? "2px solid var(--c-accent)" : "2px solid transparent",
        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        background: hovered && !active
          ? isLight ? "rgba(255,255,255,0.06)" : "rgba(0,200,255,0.04)"
          : "transparent",
        borderRadius: "4px 4px 0 0",
      }}
    >
      <motion.span
        animate={hovered ? { rotate: [0, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        style={{ display: "inline-flex" }}
      >
        <Icon emoji={icon} size={16} />
      </motion.span>
      {label}
    </Link>
  );
}

const NAV_CATS = [
  { slug: "smartphones", name: "Smartphones", icon: "📱" },
  { slug: "laptops", name: "Laptops", icon: "💻" },
  { slug: "tablets", name: "Tablets", icon: "📲" },
  { slug: "gaming", name: "Gaming", icon: "🎮" },
  { slug: "audio", name: "Audio", icon: "🎧" },
  { slug: "accessories", name: "Accessories", icon: "🔌" },
  { slug: "networking", name: "Networking", icon: "📡" },
  { slug: "cameras", name: "Cameras", icon: "📷" },
  { slug: "printers", name: "Printers", icon: "🖨️" },
  { slug: "smart-home", name: "Smart Home", icon: "🏠" },
];
