"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useCartStore } from "@/store/cart";

export default function FloatingActions() {
  const cartCount = useCartStore((s) => s.count());
  const { scrollY } = useScroll();
  const [showTop, setShowTop] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setShowTop(latest > 400);
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.div
      className="fab"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* WhatsApp */}
      <TooltipWrapper label="Chat on WhatsApp" show={activeTooltip === "whatsapp"}>
        <motion.a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "961XXXXXXXX"}?text=Hi%20Technodel%2C%20I%20need%20help`}
          target="_blank"
          rel="noopener noreferrer"
          className="fab-btn fab-btn-whatsapp"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onMouseEnter={() => setActiveTooltip("whatsapp")}
          onMouseLeave={() => setActiveTooltip(null)}
          aria-label="Chat on WhatsApp"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.845L.057 23.512a.5.5 0 0 0 .612.612l5.716-1.465A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.955 0-3.792-.537-5.368-1.472l-.385-.229-3.99 1.023 1.037-3.898-.247-.4A9.961 9.961 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
        </motion.a>
      </TooltipWrapper>

      {/* Cart */}
      <TooltipWrapper label={`Cart (${cartCount})`} show={activeTooltip === "cart"}>
        <Link
          href="/cart"
          className="fab-btn fab-btn-cart"
          onMouseEnter={() => setActiveTooltip("cart")}
          onMouseLeave={() => setActiveTooltip(null)}
          aria-label="View cart"
        >
          🛒
          <AnimatePresence>
            {cartCount > 0 && (
              <motion.span
                className="fab-badge"
                key={cartCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {cartCount > 9 ? "9+" : cartCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </TooltipWrapper>

      {/* Back to Top */}
      <AnimatePresence>
        {showTop && (
          <TooltipWrapper label="Back to top" show={activeTooltip === "top"}>
            <motion.button
              className="fab-btn fab-btn-top"
              onClick={scrollToTop}
              initial={{ opacity: 0, y: 40, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={() => setActiveTooltip("top")}
              onMouseLeave={() => setActiveTooltip(null)}
              aria-label="Scroll to top"
            >
              <motion.svg
                width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <path d="M18 15l-6-6-6 6" />
              </motion.svg>
            </motion.button>
          </TooltipWrapper>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── TOOLTIP WRAPPER ────────────────────────────────────────────────────────
function TooltipWrapper({ label, show, children }: {
  label: string; show: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative" }}>
      <AnimatePresence>
        {show && (
          <motion.div
            style={{
              position: "absolute", right: 68, top: "50%",
              transform: "translateY(-50%)",
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              borderRadius: "var(--r-sm)",
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--c-text)",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              pointerEvents: "none",
            }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}
