import { Variants, Transition } from "framer-motion";

// ═════════════════════════════════════════════════════════════════════════
// TECHNODEL REVOLUTIONARY ANIMATION ENGINE v2.0
// Premium animation system powering Lebanon's most advanced e‑commerce UX
// ═════════════════════════════════════════════════════════════════════════

// ─── REUSABLE TRANSITIONS ───────────────────────────────────────────────

export const spring: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
  mass: 0.8,
};

export const springBouncy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 15,
  mass: 0.6,
};

export const springSuperBouncy: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 8,
  mass: 0.4,
};

export const smoothEase: Transition = {
  type: "tween",
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1],
};

export const smoothEaseSlow: Transition = {
  type: "tween",
  duration: 0.35,
  ease: [0.25, 0.1, 0.25, 1],
};

export const easeOutExpo: Transition = {
  type: "tween",
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1],
};

export const easeOutBack: Transition = {
  type: "tween",
  duration: 0.3,
  ease: [0.34, 1.56, 0.64, 1],
};

export const staggerFast = {
  animate: { transition: { staggerChildren: 0.04 } },
};

export const staggerSlow = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export const staggerMedium = {
  animate: { transition: { staggerChildren: 0.04 } },
};

export const staggerHero = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

// ─── ENTRY VARIANTS ─────────────────────────────────────────────────────

const fadeFast: Transition = { type: "tween" as const, duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] };

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: fadeFast },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: fadeFast },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -15 },
  visible: { opacity: 1, y: 0, transition: fadeFast },
};

const springFast: Transition = {
  type: "spring" as const,
  stiffness: 500,
  damping: 35,
  mass: 0.5,
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: springFast },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: springFast },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: springFast },
};

export const scaleInBouncy: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: springBouncy },
};

export const scaleInSuperBouncy: Variants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: { opacity: 1, scale: 1, transition: springSuperBouncy },
};

// ─── ADVANCED ENTRY VARIANTS ────────────────────────────────────────────

export const clipReveal: Variants = {
  hidden: { clipPath: "inset(0 50% 0 50%)", opacity: 0 },
  visible: {
    clipPath: "inset(0 0% 0 0%)",
    opacity: 1,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

export const clipRevealVertical: Variants = {
  hidden: { clipPath: "inset(50% 0 50% 0)", opacity: 0 },
  visible: {
    clipPath: "inset(0% 0 0% 0)",
    opacity: 1,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

export const blurReveal: Variants = {
  hidden: { opacity: 0, filter: "blur(12px)", y: 12 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

export const scaleRotateIn: Variants = {
  hidden: { opacity: 0, scale: 0, rotate: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

export const perspectiveReveal: Variants = {
  hidden: { opacity: 0, y: 30, rotateX: -8, transformPerspective: 1000 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

export const wordFadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  }),
};

// ─── STAGGERED CONTAINER ────────────────────────────────────────────────

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export const staggerGrid: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.025,
      delayChildren: 0.04,
    },
  },
};

export const staggerSlowWithDelay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
};

// ─── PRODUCT CARD ───────────────────────────────────────────────────────

export const cardHover: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    transition: { duration: 0.15, ease: "easeOut" },
  },
  hover: {
    scale: 1.02,
    y: -6,
    boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(0,200,255,0.08)",
    transition: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] },
  },
};

export const cardImageZoom: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.08, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

export const cardContentReveal: Variants = {
  rest: { y: 0 },
  hover: { y: -3, transition: { duration: 0.15 } },
};

// ─── COUNTER (for price/numbers) ───────────────────────────────────────

export const countUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
  }),
};

// ─── MAGNETIC BUTTON ────────────────────────────────────────────────────

export const magneticHover = {
  rest: { x: 0, y: 0 },
};

// ─── HERO ───────────────────────────────────────────────────────────────

export const heroText: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

export const heroChildren: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

export const heroImageReveal: Variants = {
  hidden: { opacity: 0, scale: 1.05, clipPath: "inset(5%" },
  visible: {
    opacity: 1,
    scale: 1,
    clipPath: "inset(0%)",
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

// ─── SECTION REVEAL ─────────────────────────────────────────────────────

export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// ─── PARALLAX TILT (for 3D hover cards) ───────────────────────────────

export const tiltHover = {
  rest: { rotateX: 0, rotateY: 0, scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

// ─── 3D PERSPECTIVE TILT ───────────────────────────────────────────────

export const perspectiveTilt = {
  rest: {
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

// ─── LIST ITEM ──────────────────────────────────────────────────────────

export const listItemReveal: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.03, duration: 0.2, ease: "easeOut" },
  }),
};

// ─── FLOATING ANIMATION ─────────────────────────────────────────────────

export const float = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

export const floatSlow = {
  y: [0, -6, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

// ─── PULSE GLOW ─────────────────────────────────────────────────────────

export const pulseGlow = {
  scale: [1, 1.05, 1],
  opacity: [0.7, 1, 0.7],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut",
  },
};
