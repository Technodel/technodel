import { prisma } from "@/lib/prisma";
import BannersClient from "@/components/admin/BannersClient";

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  }).catch(() => []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Banners</h1>
        <p style={{ color: "var(--c-muted)" }}>Manage hero and campaign banners in real time.</p>
      </div>
      <BannersClient initialBanners={banners as any} />
    </div>
  );
}
