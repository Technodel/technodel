import { prisma } from "@/lib/prisma";
import UsersClient from "@/components/admin/UsersClient";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      rewardPoints: true,
      isActive: true,
      createdAt: true,
      _count: { select: { orders: true, wishlist: true, cart: true } },
    },
    take: 200,
  }).catch(() => []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Users</h1>
        <p style={{ color: "var(--c-muted)" }}>Manage customer status, roles, and reward points.</p>
      </div>
      <UsersClient initialUsers={users as any} />
    </div>
  );
}
