"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "🏠", exact: true },
  { href: "/admin/products", label: "Products", icon: "📦" },
  { href: "/admin/categories", label: "Categories", icon: "🗂️" },
  { href: "/admin/orders", label: "Orders", icon: "🛒" },
  { href: "/admin/competitors", label: "Competitors", icon: "🔍" },
  { href: "/admin/tools", label: "Import Tools", icon: "🛠️" },
  { href: "/admin/sync-report", label: "Sync Report", icon: "🔄" },
  { href: "/admin/banners", label: "Banners", icon: "🖼️" },
  { href: "/admin/delivery", label: "Delivery Zones", icon: "🚚" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div style={{
      width: 240,
      minHeight: "100vh",
      background: "var(--c-surface)",
      borderRight: "1px solid var(--c-border)",
      padding: "0 0 24px",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 40,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--c-border)" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <Image src="/logo.png" alt="Technodel" width={190} height={48} style={{ width: "auto", height: 42, objectFit: "contain", maxWidth: "100%" }} priority unoptimized />
        </Link>
        <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 2 }}>Admin Galaxy</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0" }}>
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`admin-nav-item ${active ? "active" : ""}`}>
              <span style={{ display: "inline-flex" }}><Icon emoji={item.icon} size={18} /></span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--c-border)" }}>
        <Link href="/" style={{ fontSize: 12, color: "var(--c-muted)", textDecoration: "none", display: "block", marginBottom: 8 }}>← View Store</Link>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" style={{ fontSize: 12, color: "var(--c-danger)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Logout</button>
        </form>
      </div>
    </div>
  );
}
