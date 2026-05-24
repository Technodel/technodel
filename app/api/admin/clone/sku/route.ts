import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { applyCompetitorPricing, fetchHtml, isSafeUrl, scrapeProduct } from "@/lib/scraper";
import { sanitizeProductBrand } from "@/lib/brand";
import { generateSku, generateSlug, normalizeUrlWithProtocol } from "@/lib/utils";
import { applyImportCategoryGuard, getImportGuardCategoryIds } from "@/lib/category-guard";
import {
  buildCanonicalDescription,
  buildCanonicalShortDescription,
  buildCanonicalTitle,
  normalizeMojibake,
} from "@/lib/product-copy";

function asAbsolute(baseUrl: string, href: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return "";
  }
}

function scoreLink(url: string, sku: string): number {
  const lower = url.toLowerCase();
  const s = sku.toLowerCase();
  let score = 0;
  if (lower.includes(s)) score += 5;
  if (/\/(product|products|item|p)\//i.test(lower)) score += 2;
  return score;
}

async function findProductUrlBySku(baseUrl: string, sku: string): Promise<string | null> {
  const root = normalizeUrlWithProtocol(baseUrl).replace(/\/$/, "");
  const candidates = [
    `${root}/search?q=${encodeURIComponent(sku)}&type=product`,
    `${root}/search?q=${encodeURIComponent(sku)}`,
    `${root}/?s=${encodeURIComponent(sku)}&post_type=product`,
    `${root}/catalogsearch/result/?q=${encodeURIComponent(sku)}`,
    `${root}/search?query=${encodeURIComponent(sku)}`,
  ];

  const found: Array<{ url: string; score: number }> = [];

  for (const searchUrl of candidates) {
    if (!isSafeUrl(searchUrl)) continue;
    try {
      const html = await fetchHtml(searchUrl, 12000);
      const $ = cheerio.load(html);

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href") || "";
        const text = ($(el).text() || "").toLowerCase();
        if (!href) return;

        const abs = asAbsolute(root, href).split("#")[0];
        if (!isSafeUrl(abs)) return;

        if (!/(\/product|\/products|\/item|\/p\/|sku|model)/i.test(abs) && !text.includes(sku.toLowerCase())) {
          return;
        }

        const score = scoreLink(abs, sku) + (text.includes(sku.toLowerCase()) ? 2 : 0);
        found.push({ url: abs, score });
      });

      if (found.length) break;
    } catch {
      // continue to next pattern
    }
  }

  if (!found.length) return null;
  found.sort((a, b) => b.score - a.score);
  return found[0].url;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { sku, siteUrl, competitorId, categoryId, action = "preview" } = await req.json();

  if (!sku || typeof sku !== "string") {
    return NextResponse.json({ error: "sku is required" }, { status: 400 });
  }

  let baseUrl = siteUrl as string | undefined;
  if (!baseUrl && competitorId) {
    const comp = await prisma.competitor.findUnique({ where: { id: competitorId } });
    baseUrl = comp?.url;
  }
  if (!baseUrl) {
    return NextResponse.json({ error: "siteUrl or competitorId is required" }, { status: 400 });
  }

  baseUrl = normalizeUrlWithProtocol(baseUrl);
  if (!isSafeUrl(baseUrl)) {
    return NextResponse.json({ error: "Invalid site URL" }, { status: 400 });
  }

  const productUrl = await findProductUrlBySku(baseUrl, sku);
  if (!productUrl) {
    return NextResponse.json({ error: `Could not find product for SKU: ${sku}` }, { status: 404 });
  }

  try {
    const scraped = await scrapeProduct(productUrl);

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
    const canonicalTitle = buildCanonicalTitle({
      title: scraped.title,
      brand: safeBrand,
      sourceUrl: scraped.url,
    });
    const canonicalShortDescription = buildCanonicalShortDescription({
      title: canonicalTitle,
      brand: safeBrand,
      sourceUrl: scraped.url,
    });
    const canonicalDescription = buildCanonicalDescription({
      title: canonicalTitle,
      brand: safeBrand,
      sourceUrl: scraped.url,
      description: scraped.description,
    });

    if (action === "preview") {
      return NextResponse.json({ scraped, displayPrice, matchedUrl: productUrl });
    }

    if (!categoryId) {
      return NextResponse.json({ error: "categoryId is required to save" }, { status: 400 });
    }

    const guardIds = await getImportGuardCategoryIds();
    const finalCategoryId = applyImportCategoryGuard(categoryId, canonicalTitle || `Product ${sku}`, guardIds);

    const slug = generateSlug(canonicalTitle || sku || "product");
    const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
    const finalSku = scraped.sku || sku || generateSku(canonicalTitle || "product", uniqueSlug);

    const product = await prisma.product.create({
      data: {
        slug: uniqueSlug,
        sku: finalSku,
        title: normalizeMojibake(canonicalTitle || `Product ${sku}`),
        shortDescription: normalizeMojibake(canonicalShortDescription),
        description: canonicalDescription,
        displayPrice,
        comparePrice: scraped.comparePrice ?? (scraped.price && displayPrice > scraped.price ? scraped.price : null),
        costPrice: scraped.price ?? 0,
        sourceUrl: scraped.url,
        sourcePrice: scraped.price,
        competitorId: competitorId || null,
        images: JSON.stringify(scraped.images || []),
        brand: safeBrand,
        attributes: JSON.stringify({ ...(scraped.attributes || {}), sourceSku: sku }),
        categoryId: finalCategoryId,
      },
    });

    return NextResponse.json({ product, scraped, matchedUrl: productUrl }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "SKU clone failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
