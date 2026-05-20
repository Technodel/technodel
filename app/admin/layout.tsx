import AdminLayoutShell from "@/components/admin/AdminLayoutShell";

export const metadata = { title: "Admin Dashboard – Technodel" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayoutShell>{children}</AdminLayoutShell>
  );
}
