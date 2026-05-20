import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
      <div>
        <div style={{ fontSize: 96, marginBottom: 16 }}>🔌</div>
        <h1 className="grad-text" style={{ fontSize: 120, fontWeight: 900, lineHeight: 1 }}>404</h1>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Page not found</h2>
        <p style={{ color: "var(--c-muted)", marginBottom: 32, fontSize: 16 }}>
          Looks like this product was unplugged. Let&apos;s get you back on track.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/" className="btn btn-ghost">← Home</Link>
          <Link href="/shop" className="btn btn-primary">Browse Shop</Link>
        </div>
      </div>
    </div>
  );
}
