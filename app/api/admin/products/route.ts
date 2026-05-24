import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateSlug, generateSku } from "@/lib/utils";
import { applyImportCategoryGuard, getImportGuardCategoryIds } from "@/lib/category-guard";
import {
  buildCanonicalDescription,
  buildCanonicalShortDescription,
  buildCanonicalTitle,
  normalizeMojibake,
} from "@/lib/product-copy";

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
    const canonicalTitle = buildCanonicalTitle({
      title: body.title,
      brand: body.brand,
      sourceUrl: body.sourceUrl,
    });
    const canonicalShortDescription = body.shortDescription
      ? normalizeMojibake(body.shortDescription)
      : buildCanonicalShortDescription({
          title: canonicalTitle,
          brand: body.brand,
          sourceUrl: body.sourceUrl,
        });
    const canonicalDescription = buildCanonicalDescription({
      title: canonicalTitle,
      brand: body.brand,
      sourceUrl: body.sourceUrl,
      description: body.description,
    });
    const guardIds = await getImportGuardCategoryIds();
    const finalCategoryId = applyImportCategoryGuard(body.categoryId, canonicalTitle || "", guardIds);

    const slug = body.slug || generateSlug(canonicalTitle || body.title);
    const sku = body.sku || generateSku(canonicalTitle || body.title);

    const product = await prisma.product.create({
      data: {
        title: normalizeMojibake(canonicalTitle),
        slug,
        sku,
        brand: body.brand || "",
        description: canonicalDescription,
        shortDescription: canonicalShortDescription,
        images: JSON.stringify(body.images || []),
        specs: JSON.stringify(body.specs || []),
        highlights: JSON.stringify(body.highlights || []),
        schemaJson: body.schemaJson || "",
        categoryId: finalCategoryId,
        costPrice: body.costPrice || 0,
        sourcePrice: body.sourcePrice,
        displayPrice: body.displayPrice,
        comparePrice: body.comparePrice,
        priceFormula: body.priceFormula || "",
        sourceUrl: body.sourceUrl || "",
        seoTitle: body.seoTitle || `Buy ${normalizeMojibake(canonicalTitle)} in Lebanon | Technodel`,
        seoDescription: body.seoDescription || canonicalShortDescription || "",
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
