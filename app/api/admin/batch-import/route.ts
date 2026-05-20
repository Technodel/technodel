/**
 * POST /api/admin/batch-import
 * Full pipeline: ensure competitor → deep-scan → scrape N products → clone to catalog
 *
 * Body: {
 *   siteUrl: string           — competitor site URL
 *   limit?:  number           — max products to import (default 20, max 50)
 *   markupPct?: number        — markup % (default 15)
 *   categoryId?: string       — target category (auto-resolves "Imported" category if omitted)
 *   dryRun?: boolean          — if true, returns what would be imported but saves nothing
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  fetchHtml,
  detectPlatform,
  parseSitemap,
  scanCategoryPage,
  scrapeProduct,
  applyCompetitorPricing,
  isSafeUrl,
} from "@/lib/scraper";
import { generateSlug, generateSku, normalizeUrlWithProtocol } from "@/lib/utils";

// ── helpers ──────────────────────────────────────────────────────────────────

function log(step: string, detail?: unknown) {
  console.log(`[batch-import] ${step}`, detail ?? "");
}

async function ensureImportedCategory(): Promise<string> {
  const existing = await prisma.category.findFirst({
    where: { slug: "imported-products" },
  });
  if (existing) return existing.id;
  const created = await prisma.category.create({
    data: {
      name: "Imported Products",
      slug: "imported-products",
      isVisible: false,
    },
  });
  return created.id;
}

// ── main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const rawUrl: string = body.siteUrl || "";
  const limit = Math.min(parseInt(body.limit ?? "20"), 50);
  const markupPct: number = parseFloat(body.markupPct ?? "15") || 15;
  const dryRun: boolean = body.dryRun === true;

  const siteUrl = normalizeUrlWithProtocol(rawUrl);
  if (!siteUrl || !isSafeUrl(siteUrl)) {
    return NextResponse.json({ error: "Invalid or unsafe siteUrl" }, { status: 400 });
  }

  const host = new URL(siteUrl).hostname.replace(/^www\./, "");
  const competitorName = host.split(".")[0].charAt(0).toUpperCase() + host.split(".")[0].slice(1);

  const steps: string[] = [];
  const warnings: string[] = [];

  // ── Step 1: Ensure competitor record ────────────────────────────────────────
  let competitor = await prisma.competitor.findFirst({ where: { url: siteUrl } });
  if (!competitor) {
    // try with www variant
    const altUrl = siteUrl.includes("://www.")
      ? siteUrl.replace("://www.", "://")
      : siteUrl.replace("://", "://www.");
    competitor = await prisma.competitor.findFirst({ where: { url: altUrl } });
  }
  if (!competitor) {
    if (!dryRun) {
      competitor = await prisma.competitor.create({
        data: {
          name: competitorName,
          url: siteUrl,
          markupPct,
          markupMode: "percent",
          markupFlat: 0,
          status: "active",
        },
      });
    }
    steps.push(`Created competitor: ${competitorName} (${siteUrl})`);
  } else {
    steps.push(`Found existing competitor: ${competitor.name} (${competitor.id})`);
  }

  if (dryRun && !competitor) {
    return NextResponse.json({ dryRun: true, steps, warnings, message: "Dry run — competitor would be created" });
  }

  const competitorId = competitor!.id;

  // ── Step 2: Discover product URLs ───────────────────────────────────────────
  const allUrls = new Set<string>();

  try {
    const sitemapUrls = await parseSitemap(siteUrl);
    sitemapUrls.forEach((u) => allUrls.add(u));
    steps.push(`Sitemap: ${sitemapUrls.length} URLs found`);
  } catch (e) {
    warnings.push(`Sitemap failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const homeHtml = await fetchHtml(siteUrl, 15000);
    const platform = detectPlatform(homeHtml);
    steps.push(`Platform detected: ${platform}`);

    const homeResult = await scanCategoryPage(siteUrl);
    homeResult.urls.forEach((u) => allUrls.add(u));
    steps.push(`Home scan: ${homeResult.urls.length} product URLs, ${homeResult.categories.length} categories`);

    // Scan up to 3 category pages to fill the pool
    for (const cat of homeResult.categories.slice(0, 3)) {
      if (!isSafeUrl(cat.url)) continue;
      try {
        const catResult = await scanCategoryPage(cat.url);
        catResult.urls.forEach((u) => allUrls.add(u));
      } catch { /* skip */ }
    }
  } catch (e) {
    warnings.push(`Home scan failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (allUrls.size === 0) {
    return NextResponse.json({ error: "No product URLs found on the site", steps, warnings }, { status: 422 });
  }

  steps.push(`Total pool: ${allUrls.size} unique product URLs`);

  // ── Step 3: Resolve target category ─────────────────────────────────────────
  let categoryId: string = body.categoryId || "";
  if (!categoryId) {
    categoryId = await ensureImportedCategory();
    steps.push(`Using auto category: Imported Products`);
  } else {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat) return NextResponse.json({ error: "categoryId not found" }, { status: 400 });
    steps.push(`Target category: ${cat.name}`);
  }

  // ── Step 4: Scrape & import ─────────────────────────────────────────────────
  const urlList = [...allUrls].slice(0, limit * 4); // take a wider pool in case some fail
  const imported: Array<{ title: string; price: number; url: string; productId?: string }> = [];
  const failed: Array<{ url: string; reason: string }> = [];

  for (const url of urlList) {
    if (imported.length >= limit) break;

    try {
      const scraped = await scrapeProduct(url);
      if (!scraped.title) { failed.push({ url, reason: "No title" }); continue; }

      const displayPrice = scraped.price
        ? applyCompetitorPricing(scraped.price, competitor!)
        : 0;

      if (dryRun) {
        imported.push({ title: scraped.title, price: displayPrice, url });
        continue;
      }

      // Upsert CompetitorProduct record
      await prisma.competitorProduct.upsert({
        where: { competitorId_url: { competitorId, url } },
        update: {
          title: scraped.title,
          price: scraped.price,
          comparePrice: scraped.comparePrice,
          images: JSON.stringify(scraped.images),
          brand: scraped.brand,
          sku: scraped.sku,
          categories: JSON.stringify(scraped.categories),
          attributes: JSON.stringify(scraped.attributes),
          platform: scraped.platform,
          shortDesc: scraped.shortDescription,
          description: scraped.description,
          status: "scraped",
          scannedAt: new Date(),
        },
        create: {
          competitorId,
          url,
          title: scraped.title,
          price: scraped.price,
          comparePrice: scraped.comparePrice,
          images: JSON.stringify(scraped.images),
          brand: scraped.brand,
          sku: scraped.sku,
          categories: JSON.stringify(scraped.categories),
          attributes: JSON.stringify(scraped.attributes),
          platform: scraped.platform,
          shortDesc: scraped.shortDescription,
          description: scraped.description,
          status: "scraped",
          scannedAt: new Date(),
        },
      });

      const slug = generateSlug(scraped.title);
      const uniqueSlug = `${slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const sku = scraped.sku || generateSku(scraped.title, uniqueSlug);

      const product = await prisma.product.create({
        data: {
          slug: uniqueSlug,
          sku,
          title: scraped.title,
          shortDescription: scraped.shortDescription || "",
          description: scraped.description || "",
          displayPrice,
          comparePrice:
            scraped.comparePrice ??
            (scraped.price && displayPrice > scraped.price ? scraped.price : null),
          costPrice: scraped.price ?? 0,
          sourceUrl: url,
          sourcePrice: scraped.price,
          competitorId,
          images: JSON.stringify(scraped.images),
          brand: scraped.brand || null,
          attributes: JSON.stringify(scraped.attributes),
          categoryId,
          isVisible: false, // staging — admin must activate
        },
      });

      // Mark the scanned row as cloned
      await prisma.competitorProduct.updateMany({
        where: { competitorId, url },
        data: { status: "cloned", clonedProductId: product.id },
      });

      imported.push({ title: scraped.title, price: displayPrice, url, productId: product.id });
    } catch (e) {
      failed.push({ url, reason: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 5: Update competitor timestamps ────────────────────────────────────
  if (!dryRun) {
    await prisma.competitor.update({
      where: { id: competitorId },
      data: { lastScannedAt: new Date() },
    });
  }

  return NextResponse.json({
    dryRun,
    competitorId,
    categoryId,
    imported: imported.length,
    failed: failed.length,
    steps,
    warnings,
    products: imported,
    errors: failed.slice(0, 10),
    message: dryRun
      ? `Dry run complete. Would import ${imported.length} products.`
      : `Batch import complete. ${imported.length} products staged (isActive=false). ${failed.length} failed.`,
  });
}
