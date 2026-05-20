import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateSlug, generateSku } from "@/lib/utils";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Unauthorized");
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") || "1"));
    const limit = Math.min(100, parseInt(sp.get("limit") || "50"));
    const q = sp.get("q");
    const category = sp.get("category");

    const where: any = {};
    if (q) where.OR = [{ title: { contains: q } }, { sku: { contains: q } }, { brand: { contains: q } }];
    if (category) where.categoryId = category;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { name: true } }, competitor: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total, pages: Math.ceil(total / limit), page });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();

    const slug = body.slug || generateSlug(body.title);
    const sku = body.sku || generateSku(body.title);

    const product = await prisma.product.create({
      data: {
        title: body.title,
        slug,
        sku,
        brand: body.brand || "",
        description: body.description || "",
        shortDescription: body.shortDescription || "",
        images: JSON.stringify(body.images || []),
        specs: JSON.stringify(body.specs || []),
        highlights: JSON.stringify(body.highlights || []),
        schemaJson: body.schemaJson || "",
        categoryId: body.categoryId,
        costPrice: body.costPrice || 0,
        sourcePrice: body.sourcePrice,
        displayPrice: body.displayPrice,
        comparePrice: body.comparePrice,
        priceFormula: body.priceFormula || "",
        sourceUrl: body.sourceUrl || "",
        seoTitle: body.seoTitle || body.title,
        seoDescription: body.seoDescription || body.shortDescription || "",
        seoKeywords: body.seoKeywords || "",
        isFeatured: body.isFeatured || false,
        isNew: body.isNew || false,
        isVisible: body.isVisible !== false,
        stock: body.stock || 0,
        competitorId: body.competitorId,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 500 });
  }
}
