"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoadingScreen() {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShow(false), 300);
          return 100;
        }
        // Easing: fast start, slow end for premium feel
        const increment = prev < 60 ? 8 : prev < 85 ? 4 : 2;
        return Math.min(prev + increment, 100);
      });
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "var(--c-bg)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
            overflow: "hidden",
          }}
        >
          {/* Ambient gradient orbs */}
          <motion.div
            style={{
              position: "absolute",
              width: 600, height: 600,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(0,200,255,0.06) 0%, transparent 70%)",
              top: -200, left: -200,
              pointerEvents: "none",
            }}
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            style={{
              position: "absolute",
              width: 400, height: 400,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124,58,255,0.05) 0%, transparent 70%)",
              bottom: -100, right: -100,
              pointerEvents: "none",
            }}
            animate={{
              x: [0, -40, 0],
              y: [0, 30, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Logo area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: "relative", zIndex: 1, textAlign: "center" }}
          >
            <motion.div
              style={{
                fontSize: 48, fontWeight: 900, letterSpacing: "-1.5px",
                marginBottom: 8,
              }}
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="grad-text">TECHNO</span>
              <span style={{ color: "var(--c-text)" }}>DEL</span>
            </motion.div>
            <motion.p
              style={{ fontSize: 13, color: "var(--c-muted)", fontWeight: 500 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              Lebanon&apos;s Premium Tech Destination
            </motion.p>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{
              width: 200,
              height: 3,
              borderRadius: 99,
              background: "var(--c-surface2)",
              overflow: "hidden",
              position: "relative",
              zIndex: 1,
            }}
          >
            <motion.div
              style={{
                height: "100%",
                borderRadius: 99,
                background: "var(--grad-accent)",
                backgroundSize: "200%",
              }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </motion.div>

          {/* Loading messages */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ position: "relative", zIndex: 1 }}
          >
            <LoadingMessage progress={progress} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const LOADING_MESSAGES = [
  "Loading latest tech...",
  "Setting up deals...",
  "Warming up servers...",
  "Preparing your experience...",
  "Almost there...",
];

function LoadingMessage({ progress }: { progress: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const idx = Math.min(
      Math.floor((progress / 100) * LOADING_MESSAGES.length),
      LOADING_MESSAGES.length - 1
    );
    setIndex(idx);
  }, [progress]);

  return (
    <motion.p
      key={index}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      style={{
        fontSize: 13,
        color: "var(--c-muted)",
        fontWeight: 500,
        textAlign: "center",
      }}
    >
      {LOADING_MESSAGES[index]}
    </motion.p>
  );
}
