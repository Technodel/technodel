/**
 * GET  /api/admin/competitors/[id]/products — list scanned products
 * POST /api/admin/competitors/[id]/products — clone selected to catalog
 *
 * GET  ?status=pending&q=search&limit=50&offset=0
 * POST { ids: string[], categoryId, competitorId }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { scrapeProduct, applyCompetitorPricing } from "@/lib/scraper";
import { sanitizeProductBrand } from "@/lib/brand";
import { generateSlug, generateSku } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const q = searchParams.get("q") || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: Record<string, unknown> = { competitorId: id };
  if (status) where.status = status;
  if (q) where.title = { contains: q };

  const [items, total] = await Promise.all([
    prisma.competitorProduct.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { scannedAt: "desc" },
    }),
    prisma.competitorProduct.count({ where }),
  ]);

  return NextResponse.json({ items, total, limit, offset });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: competitorId } = await params;
  const { ids, categoryId } = await req.json();

  if (!Array.isArray(ids) || !ids.length) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }
  if (!categoryId) {
    return NextResponse.json({ error: "categoryId required" }, { status: 400 });
  }

  const competitor = await prisma.competitor.findUnique({ where: { id: competitorId } });
  if (!competitor) return NextResponse.json({ error: "Competitor not found" }, { status: 404 });

  const competitorItems = await prisma.competitorProduct.findMany({
    where: { id: { in: ids }, competitorId },
  });

  const cloned: string[] = [];
  const errors: Array<{ id: string; error: string }> = [];

  for (const item of competitorItems) {
    try {
      // If we already have full product data, use it. Otherwise scrape.
      let scraped = item.title
        ? {
            url: item.url,
            title: item.title,
            shortDescription: item.shortDesc || "",
            description: item.description || "",
            price: item.price,
            comparePrice: item.comparePrice,
            images: JSON.parse(item.images || "[]"),
            brand: item.brand,
            sku: item.sku,
            categories: JSON.parse(item.categories || "[]"),
            attributes: JSON.parse(item.attributes || "{}"),
            platform: item.platform || "generic",
          }
        : await scrapeProduct(item.url);

      const displayPrice = scraped.price
        ? applyCompetitorPricing(scraped.price, competitor)
        : 0;
      const safeBrand = sanitizeProductBrand(scraped.brand, competitor.name);

      const slug = generateSlug(scraped.title || "product");
      const uniqueSlug = `${slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const sku = scraped.sku || generateSku(scraped.title || "product", uniqueSlug);

      const product = await prisma.product.create({
        data: {
          slug: uniqueSlug,
          sku,
          title: scraped.title || "Untitled",
          shortDescription: scraped.shortDescription || "",
          description: scraped.description || "",
          displayPrice,
          comparePrice:
            scraped.comparePrice ??
            (scraped.price && displayPrice > scraped.price ? scraped.price : null),
          costPrice: scraped.price ?? 0,
          sourceUrl: item.url,
          sourcePrice: scraped.price,
          competitorId,
          images: JSON.stringify(scraped.images),
          brand: safeBrand,
          attributes: JSON.stringify(scraped.attributes),
          categoryId,
        },
      });

      // Mark as cloned
      await prisma.competitorProduct.update({
        where: { id: item.id },
        data: { status: "cloned", clonedProductId: product.id },
      });

      cloned.push(product.id);
    } catch (err: unknown) {
      errors.push({ id: item.id, error: err instanceof Error ? err.message : "Failed" });
    }
  }

  return NextResponse.json({
    cloned: cloned.length,
    errors: errors.length,
    details: errors,
  });
}
