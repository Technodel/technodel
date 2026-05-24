import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateSlug } from "@/lib/utils";
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, variants: true, competitor: { select: { name: true } } },
    });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const data: any = { ...body };
    const canonicalTitle = body.title || body.shortDescription || body.description
      ? buildCanonicalTitle({
          title: body.title,
          brand: body.brand,
          sourceUrl: body.sourceUrl,
        })
      : "";
    if (canonicalTitle) {
      data.title = normalizeMojibake(canonicalTitle);
    }
    if (body.shortDescription !== undefined || canonicalTitle) {
      data.shortDescription = body.shortDescription
        ? normalizeMojibake(body.shortDescription)
        : buildCanonicalShortDescription({
            title: canonicalTitle,
            brand: body.brand,
            sourceUrl: body.sourceUrl,
          });
    }
    if (body.description !== undefined || canonicalTitle) {
      data.description = buildCanonicalDescription({
        title: canonicalTitle,
        brand: body.brand,
        sourceUrl: body.sourceUrl,
        description: body.description,
      });
    }
    if (body.images) data.images = JSON.stringify(body.images);
    if (body.specs) data.specs = JSON.stringify(body.specs);
    if (body.highlights) data.highlights = JSON.stringify(body.highlights);
    if (canonicalTitle && !body.slug) data.slug = generateSlug(canonicalTitle);

    if (body.categoryId) {
      const guardIds = await getImportGuardCategoryIds();
      let effectiveTitle = String(body.title || "");
      if (!effectiveTitle) {
        const existing = await prisma.product.findUnique({ where: { id }, select: { title: true } });
        effectiveTitle = existing?.title || "";
      }
      data.categoryId = applyImportCategoryGuard(body.categoryId, effectiveTitle, guardIds);
    }

    delete data.id; delete data.category; delete data.variants; delete data.competitor;

    const product = await prisma.product.update({ where: { id }, data });
    return NextResponse.json({ product });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 500 });
  }
}
