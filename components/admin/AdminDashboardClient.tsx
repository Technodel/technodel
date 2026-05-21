"use client";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

interface StatItem { label: string; value: string; icon: string; color: string; href: string; }
interface OrderItem { id: string; orderNumber: string; guestName?: string | null; total: number; status: string; }
interface ProductItem { id: string; title: string; displayPrice: number; orderCount: number; images: string; }
interface CatItem { id: string; name: string; _count: { products: number }; children?: { id: string; name: string; _count: { products: number } }[]; }
interface CompItem { id: string; name: string; _count: { products: number; competitorProducts: number }; }

export function StatsCards({ stats }: { stats: StatItem[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 40 }}>
      {stats.map((s) => (
        <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
          <div
            style={{
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              borderRadius: "var(--r-md)",
              padding: "24px 20px",
              transition: "border-color 0.2s ease",
            }}
          >
            <div style={{ marginBottom: 12, display: "inline-flex" }}>
              <Icon emoji={s.icon} size={28} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "var(--c-muted)", marginTop: 4 }}>{s.label}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function QuickActions({ items }: { items: { href: string; label: string; primary: boolean }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((a) => {
        // Extract the emoji prefix from the label
        const emojiMatch = a.label.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}])\s*/u);
        const emoji = emojiMatch ? emojiMatch[1] : "";
        const cleanLabel = a.label.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]\s*/u, "");
        return (
          <Link
            key={a.href}
            href={a.href}
            className={`btn ${a.primary ? "btn-primary" : "btn-secondary"}`}
            style={{ width: "100%", justifyContent: "flex-start", display: "flex", alignItems: "center", gap: 8 }}
          >
            {emoji && <Icon emoji={emoji} size={16} />}
            {cleanLabel}
          </Link>
        );
      })}
    </div>
  );
}

export function SectionTitle({ emoji, text }: { emoji: string; text: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <Icon emoji={emoji} size={18} />
      {text}
    </span>
  );
}

export function InlineIcon({ emoji, size = 14 }: { emoji: string; size?: number }) {
  return <Icon emoji={emoji} size={size} />;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    pending:    { color: "#ffc107", label: "Pending" },
    confirmed:  { color: "#00c8ff", label: "Confirmed" },
    processing: { color: "#7c3aff", label: "Processing" },
    shipped:    { color: "#00e676", label: "Shipped" },
    delivered:  { color: "#00e676", label: "Delivered" },
    cancelled:  { color: "#ff4444", label: "Cancelled" },
    refunded:   { color: "#ff6b6b", label: "Refunded" },
  };
  const s = map[status] || { color: "var(--c-muted)", label: status };
  return <span style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: "capitalize" }}>{s.label}</span>;
}
