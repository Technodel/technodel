"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPath } from "@/lib/api-path";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(apiPath("/api/auth/admin-login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid credentials"); return; }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <label style={{ fontSize: 12, color: "var(--c-muted)", fontWeight: 600, display: "block", marginBottom: 6 }}>USERNAME</label>
        <input
          className="input"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="galaxy"
          autoComplete="username"
          required
        />
      </div>

      <div>
        <label style={{ fontSize: 12, color: "var(--c-muted)", fontWeight: 600, display: "block", marginBottom: 6 }}>PASSWORD</label>
        <div style={{ position: "relative" }}>
          <input
            className="input"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            style={{ paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--c-muted)", fontSize: 16 }}
          >
            {showPw ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.3)", borderRadius: "var(--r-sm)", padding: "10px 14px", fontSize: 13, color: "#ff6b6b" }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
        style={{ width: "100%", padding: "12px 0", fontSize: 15, marginTop: 4 }}
      >
        {loading ? "Signing in..." : "Sign In →"}
      </button>
    </form>
  );
}
