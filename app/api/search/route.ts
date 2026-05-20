import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "6"), 20);

  if (!q) return NextResponse.json({ results: [] });

  try {
    const products = await prisma.product.findMany({
      where: {
        isVisible: true,
        OR: [
          { title: { contains: q } },
          { brand: { contains: q } },
          { seoKeywords: { contains: q } },
        ],
      },
      include: { category: { select: { name: true } } },
      take: limit,
      orderBy: { orderCount: "desc" },
    });

    const results = products.map((p) => {
      let imageUrl = "";
      try { imageUrl = JSON.parse(p.images)[0] || ""; } catch {}
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        imageUrl,
        displayPrice: p.displayPrice,
        category: p.category.name,
      };
    });

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
