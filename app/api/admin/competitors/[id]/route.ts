/**
 * GET    /api/admin/competitors/[id]
 * PATCH  /api/admin/competitors/[id] — update competitor settings
 * DELETE /api/admin/competitors/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { normalizeUrlWithProtocol } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const competitor = await prisma.competitor.findUnique({
    where: { id },
    include: { _count: { select: { products: true, competitorProducts: true } } },
  });
  if (!competitor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(competitor);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const allowed = [
    "name", "url", "logoUrl", "markupPct", "priceFormula", "currency", "notes", "status",
  ];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }
  if (typeof data.url === "string") {
    data.url = normalizeUrlWithProtocol(data.url);
  }
  if ("markupPct" in data) {
    data.markupPct = Number(data.markupPct || 0);
  }
  data.markupMode = "percent";
  data.markupFlat = 0;

  const updated = await prisma.competitor.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.competitor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
