"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import {
  sectionReveal, staggerContainer, fadeInUp, scaleIn,
  clipReveal, blurReveal, perspectiveReveal, easeOutExpo,
} from "@/lib/animations";

// ─── ANIMATION VARIANT PRESETS ───────────────────────────────────────────────

type AnimationPreset = "default" | "fadeUp" | "scale" | "clip" | "blur" | "perspective";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: boolean;
  once?: boolean;
  style?: React.CSSProperties;
  preset?: AnimationPreset;
}

const variantMap: Record<AnimationPreset, any> = {
  default: sectionReveal,
  fadeUp: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeOutExpo } },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: easeOutExpo } },
  },
  clip: clipReveal,
  blur: blurReveal,
  perspective: perspectiveReveal,
};

export default function AnimatedSection({
  children,
  className,
  delay = 0,
  stagger = false,
  once = true,
  style,
  preset = "default",
}: Props) {
  const base = stagger ? staggerContainer : variantMap[preset];

  return (
    <motion.section
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-60px" }}
      variants={base}
      custom={delay}
      style={style}
    >
      {children}
    </motion.section>
  );
}

// ─── ANIMATED CHILDREN ──────────────────────────────────────────────────────

type ChildVariant = "fadeUp" | "scaleIn" | "blurReveal" | "clipReveal" | "perspective";

interface ChildProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
  variant?: ChildVariant;
}

const childVariants: Record<ChildVariant, any> = {
  fadeUp: {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1, scale: 1,
      transition: { type: "spring", stiffness: 500, damping: 30, mass: 0.5 },
    },
  },
  blurReveal: {
    hidden: { opacity: 0, filter: "blur(8px)", y: 10 },
    visible: {
      opacity: 1, filter: "blur(0px)", y: 0,
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
    },
  },
  clipReveal: {
    hidden: { clipPath: "inset(0 50% 0 50%)", opacity: 0 },
    visible: {
      clipPath: "inset(0 0% 0 0%)", opacity: 1,
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    },
  },
  perspective: {
    hidden: { opacity: 0, y: 20, rotateX: -6, transformPerspective: 800 },
    visible: {
      opacity: 1, y: 0, rotateX: 0,
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    },
  },
};

export function FadeInUp({ children, className, delay = 0, style }: ChildProps) {
  return (
    <motion.div
      className={className}
      variants={childVariants.fadeUp}
      style={style}
      custom={delay}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, className, delay = 0, style }: ChildProps) {
  return (
    <motion.div
      className={className}
      variants={childVariants.scaleIn}
      style={style}
      custom={delay}
    >
      {children}
    </motion.div>
  );
}

export function BlurReveal({ children, className, delay = 0, style }: ChildProps) {
  return (
    <motion.div
      className={className}
      variants={childVariants.blurReveal}
      style={style}
      custom={delay}
    >
      {children}
    </motion.div>
  );
}
