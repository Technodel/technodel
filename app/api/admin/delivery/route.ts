import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Unauthorized");
}

export async function GET() {
  try {
    await requireAdmin();
    const zones = await prisma.deliveryZone.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
    return NextResponse.json({ zones });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    if (!body?.name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const zone = await prisma.deliveryZone.create({
      data: {
        name: body.name,
        fee: Number(body.fee || 0),
        minOrder: Number(body.minOrder || 0),
        freeAbove: body.freeAbove ? Number(body.freeAbove) : null,
        estimateDays: body.estimateDays || "1-3",
        isActive: body.isActive !== false,
        sortOrder: Number(body.sortOrder || 0),
      },
    });

    return NextResponse.json({ zone }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 500 });
  }
}
