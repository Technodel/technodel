import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { normalizeUrlWithProtocol } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const competitors = await prisma.competitor.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(competitors);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, url, markupPct, priceFormula, notes } = await req.json();
  if (!name || !url) return NextResponse.json({ error: "Name and URL required" }, { status: 400 });
  const normalizedUrl = normalizeUrlWithProtocol(url);
  const competitor = await prisma.competitor.create({
    data: {
      name,
      url: normalizedUrl,
      scrapeMethod: "cheerio",
      markupPct: Number(markupPct ?? 10),
      markupFlat: 0,
      markupMode: "percent",
      priceFormula: priceFormula || null,
      notes: notes || null,
    },
  });
  return NextResponse.json(competitor, { status: 201 });
}
