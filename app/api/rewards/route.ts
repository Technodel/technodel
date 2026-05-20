import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET — Fetch authenticated user's reward logs and total points
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, rewardPoints: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const logs = await prisma.rewardLog.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ points: user.rewardPoints, logs });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch rewards." }, { status: 500 });
  }
}

// POST — Award points (earn/redeem)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { type, points, reason, orderId } = await req.json();

    if (!type || !points || !reason) {
      return NextResponse.json({ error: "type, points, and reason are required." }, { status: 400 });
    }

    if (!["earned", "redeemed", "bonus", "refund"].includes(type)) {
      return NextResponse.json({ error: "Invalid reward type." }, { status: 400 });
    }

    const pointDelta = type === "redeemed" ? -Math.abs(points) : Math.abs(points);

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { rewardPoints: { increment: pointDelta } },
    });

    const log = await prisma.rewardLog.create({
      data: {
        userId: session.userId,
        type,
        points: pointDelta,
        reason,
        orderId: orderId || null,
      },
    });

    return NextResponse.json({ points: user.rewardPoints, log }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to process reward." }, { status: 500 });
  }
}
