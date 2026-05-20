import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrderDetailClient from "./OrderDetailClient";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { title: true, slug: true } } } },
      user: { select: { name: true, email: true, phone: true } },
      address: true,
    },
  }).catch(() => null);

  if (!order) notFound();
  return <OrderDetailClient order={JSON.parse(JSON.stringify(order))} />;
}
