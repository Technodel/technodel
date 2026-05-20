import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function generateOrderNumber() {
  return "TN" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

// GET — Fetch authenticated user's orders
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") || "1"));
    const limit = Math.min(20, parseInt(sp.get("limit") || "10"));

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: session.userId },
        include: {
          items: {
            select: { id: true, title: true, qty: true, price: true, total: true, imageUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.order.count({ where: { userId: session.userId } }),
    ]);

    return NextResponse.json({ orders, total, pages: Math.ceil(total / limit), page });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();
    const { guestName, guestPhone, guestEmail, shippingAddress, note, paymentMethod, items, subtotal, deliveryFee, total, rewardUsed } = body;

    if (!guestName || !guestPhone || !items?.length) {
      return NextResponse.json({ error: "Name, phone, and items are required." }, { status: 400 });
    }

    // Verify products exist and get source info
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, displayPrice: true, sourceUrl: true, sourcePrice: true, costPrice: true, title: true, competitor: { select: { name: true } } },
    });
    const prodMap = Object.fromEntries(products.map((p) => [p.id, p]));

    // If user is authenticated, link order and handle reward deduction
    let rewardPointsDeducted = 0;
    if (session && rewardUsed > 0) {
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (user && user.rewardPoints >= rewardUsed) {
        rewardPointsDeducted = rewardUsed;
      }
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session?.userId || null,
        guestName,
        guestPhone,
        guestEmail: guestEmail || null,
        shippingAddress,
        note: note || null,
        paymentMethod,
        subtotal,
        deliveryFee: deliveryFee || 0,
        rewardUsed: rewardPointsDeducted,
        total,
        status: "pending",
        paymentStatus: "unpaid",
        items: {
          create: items.map((item: any) => {
            const prod = prodMap[item.productId];
            return {
              productId: item.productId,
              variantId: item.variantId || null,
              title: item.title || prod?.title || "",
              qty: item.qty,
              price: item.price,
              total: item.price * item.qty,
              sourceUrl: prod?.sourceUrl || null,
              sourcePrice: prod?.sourcePrice || null,
              costPrice: prod?.costPrice || null,
              competitorName: prod?.competitor?.name || null,
            };
          }),
        },
      },
    });

    // Deduct reward points if used
    if (rewardPointsDeducted > 0 && session) {
      await prisma.user.update({
        where: { id: session.userId },
        data: { rewardPoints: { decrement: rewardPointsDeducted } },
      });
      await prisma.rewardLog.create({
        data: {
          userId: session.userId,
          type: "redeemed",
          points: -rewardPointsDeducted,
          reason: `Redeemed on order #${order.orderNumber}`,
          orderId: order.id,
        },
      });
    }

    // Update product order counts
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { orderCount: { increment: 1 } },
      }).catch(() => {});
    }

    return NextResponse.json({ orderNumber: order.orderNumber, orderId: order.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create order." }, { status: 500 });
  }
}
