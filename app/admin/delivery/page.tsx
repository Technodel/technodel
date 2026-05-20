import { prisma } from "@/lib/prisma";
import DeliveryZonesClient from "@/components/admin/DeliveryZonesClient";

export default async function AdminDeliveryPage() {
  const zones = await prisma.deliveryZone.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  }).catch(() => []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Delivery Zones</h1>
        <p style={{ color: "var(--c-muted)" }}>Set cash-on-delivery coverage, fees, and thresholds by zone.</p>
      </div>
      <DeliveryZonesClient initialZones={zones as any} />
    </div>
  );
}
