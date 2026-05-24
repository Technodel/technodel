import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.product.aggregate({
      _max: { updatedAt: true }
    });
    return NextResponse.json({ lastSync: result._max.updatedAt });
  } catch (error) {
    return NextResponse.json({ lastSync: null });
  }
}