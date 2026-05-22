/**
 * POST /api/admin/clone/url
 * Scrapes a single product URL and either previews or saves to DB.
 *
 * Body: { url, categoryId?, competitorId?, action: "preview" | "save" }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { scrapeProduct, isSafeUrl, applyCompetitorPricing } from "@/lib/scraper";
import { sanitizeProductBrand } from "@/lib/brand";
import { generateSlug, generateSku } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { url, categoryId, competitorId, action = "preview" } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }
  if (!isSafeUrl(url)) {
    return NextResponse.json({ error: "Invalid or blocked URL" }, { status: 400 });
  }

  try {
    const scraped = await scrapeProduct(url);

    // Resolve competitor for pricing
    let competitor = null;
    if (competitorId) {
      competitor = await prisma.competitor.findUnique({ where: { id: competitorId } });
    }

    const displayPrice = scraped.price
      ? competitor
        ? applyCompetitorPricing(scraped.price, competitor)
        : scraped.price
      : 0;
    const safeBrand = sanitizeProductBrand(scraped.brand, competitor?.name);

    if (action === "preview") {
      return NextResponse.json({ scraped, displayPrice });
    }

    // action === "save" — create product in DB
    if (!categoryId) {
      return NextResponse.json({ error: "categoryId is required to save" }, { status: 400 });
    }

    const slug = generateSlug(scraped.title || "product");
    const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
    const sku = scraped.sku || generateSku(scraped.title || "product", uniqueSlug);

    const product = await prisma.product.create({
      data: {
        slug: uniqueSlug,
        sku,
        title: scraped.title || "Untitled Product",
        shortDescription: scraped.shortDescription || "",
        description: scraped.description || "",
        displayPrice,
        comparePrice: scraped.comparePrice ?? (scraped.price && displayPrice > scraped.price ? scraped.price : null),
        costPrice: scraped.price ?? 0,
        sourceUrl: scraped.url,
        sourcePrice: scraped.price,
        competitorId: competitorId || null,
        images: JSON.stringify(scraped.images),
        brand: safeBrand,
        attributes: JSON.stringify(scraped.attributes),
        categoryId,
      },
    });

    return NextResponse.json({ product, scraped }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Scrape failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
