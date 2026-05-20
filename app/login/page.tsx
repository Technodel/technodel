"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = await login(email, password);
    if (result.ok) {
      router.push("/account");
      router.refresh();
    } else {
      setError(result.error || "Login failed");
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      style={{ maxWidth: 420, margin: "60px auto", padding: "0 24px" }}
    >
      <motion.div variants={fadeInUp} style={{ textAlign: "center", marginBottom: 32 }}>
        <motion.div
          style={{ fontSize: 48, marginBottom: 12 }}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          👋
        </motion.div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Welcome Back</h1>
        <p style={{ color: "var(--c-muted)", fontSize: 14 }}>Sign in to your Technodel account</p>
      </motion.div>

      <motion.form
        variants={fadeInUp}
        onSubmit={handleSubmit}
        style={{
          background: "var(--c-surface)",
          border: "1px solid var(--c-border)",
          borderRadius: "var(--r-lg)",
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div>
          <label style={{ fontSize: 12, color: "var(--c-muted)", fontWeight: 700, display: "block", marginBottom: 6 }}>
            EMAIL ADDRESS
          </label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--c-muted)", fontWeight: 700, display: "block", marginBottom: 6 }}>
            PASSWORD
          </label>
          <div style={{ position: "relative" }}>
            <input
              className="input"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{
                position: "absolute", right: 12, top: "50%",
                transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--c-muted)", fontSize: 16,
              }}
            >
              {showPw ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "rgba(255,68,68,0.1)",
              border: "1px solid rgba(255,68,68,0.3)",
              borderRadius: "var(--r-sm)",
              padding: "10px 14px", fontSize: 13, color: "#ff6b6b",
            }}
          >
            {error}
          </motion.div>
        )}

        <motion.button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={loading}
          style={{ width: "100%" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? "Signing in..." : "Sign In →"}
        </motion.button>

        <div style={{ textAlign: "center", fontSize: 13, color: "var(--c-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "var(--c-accent)", fontWeight: 600, textDecoration: "none" }}>
            Create one
          </Link>
        </div>
      </motion.form>

      <motion.div variants={fadeInUp} style={{ textAlign: "center", marginTop: 20 }}>
        <Link href="/shop" style={{ fontSize: 13, color: "var(--c-muted)", textDecoration: "none" }}>
          ← Continue as guest
        </Link>
      </motion.div>
    </motion.div>
  );
}
