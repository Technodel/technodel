"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--c-bg)" }}>
      <AdminSidebar />
      <div style={{ marginLeft: 240, flex: 1, padding: 32, maxWidth: "calc(100vw - 240px)" }}>
        {children}
      </div>
    </div>
  );
}
