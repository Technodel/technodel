export const metadata = { title: "Admin Login – Technodel" };
import Image from "next/image";

export default function AdminLoginPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--c-bg)",
      padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Image src="/logo.png" alt="Technodel" width={320} height={80} style={{ width: "auto", height: 64, objectFit: "contain", maxWidth: "100%" }} priority />
          <div style={{ fontSize: 14, color: "var(--c-muted)", marginTop: 4 }}>Admin Galaxy 🌌</div>
        </div>

        {/* Card */}
        <div className="glass grad-border" style={{ padding: 40, borderRadius: "var(--r-xl)" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 28, textAlign: "center" }}>Sign In</h1>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

// ─ client form
import LoginForm from "./LoginForm";
