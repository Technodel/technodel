import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Unauthorized");
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const zone = await prisma.deliveryZone.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.fee !== undefined && { fee: Number(body.fee || 0) }),
        ...(body.minOrder !== undefined && { minOrder: Number(body.minOrder || 0) }),
        ...(body.freeAbove !== undefined && { freeAbove: body.freeAbove ? Number(body.freeAbove) : null }),
        ...(body.estimateDays !== undefined && { estimateDays: body.estimateDays || "1-3" }),
        ...(body.isActive !== undefined && { isActive: !!body.isActive }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder || 0) }),
      },
    });

    return NextResponse.json({ zone });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.deliveryZone.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 500 });
  }
}
