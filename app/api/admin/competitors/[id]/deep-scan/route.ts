/**
 * POST /api/admin/competitors/[id]/deep-scan
 * Crawls a competitor's site to discover products.
 * Populates the CompetitorProduct table.
 *
 * Body (optional): { startUrl, maxPages? }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { scanCategoryPage, parseSitemap, isSafeUrl, detectPlatform, fetchHtml } from "@/lib/scraper";

type PlatformConf = { name: string; confidence: "high" | "medium" | "low"; signals: string[] };

function analyzePlatformConfidence(html: string): PlatformConf {
  const signals: string[] = [];
  let name = "generic";
  let confidence: "high" | "medium" | "low" = "low";

  if (/cdn\.shopify\.com|window\.Shopify\b|shopify\.com\/s\/files/i.test(html)) {
    name = "shopify"; signals.push("Shopify CDN detected", "window.Shopify global"); confidence = "high";
  } else if (/woocommerce|wc-block|\/wp-json\/wc\//i.test(html)) {
    name = "woocommerce"; signals.push("WooCommerce classes detected");
    if (/wp-content/i.test(html)) { signals.push("WordPress wp-content"); confidence = "high"; }
    else confidence = "medium";
  } else if (/Magento_Catalog|mage\/bootstrap/i.test(html)) {
    name = "magento"; signals.push("Magento bootstrap detected"); confidence = "high";
  } else if (/cdn\.bigcommerce\.com|window\.BCData/i.test(html)) {
    name = "bigcommerce"; signals.push("BigCommerce CDN detected"); confidence = "high";
  } else if (/PrestaShop|prestashop/i.test(html)) {
    name = "prestashop"; signals.push("PrestaShop markers found"); confidence = "medium";
  } else if (/OpenCart|catalog\/view\/theme/i.test(html)) {
    name = "opencart"; signals.push("OpenCart template paths found"); confidence = "medium";
  } else {
    signals.push("No recognized e-commerce platform markers"); confidence = "low";
  }

  return { name, confidence, signals };
}

function detectProductUrlPattern(urls: string[]): string {
  if (!urls.length) return "unknown";
  const patterns: Record<string, number> = {};
  for (const u of urls.slice(0, 50)) {
    const m = u.match(/https?:\/\/[^/]+(\/(product|products|item|p|catalogue|fiches)\/)/i);
    if (m) patterns[m[1]] = (patterns[m[1]] || 0) + 1;
  }
  const top = Object.entries(patterns).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : "/product/";
}

function detectPaginationPattern(html: string): string {
  if (/[?&]paged=|\?page=|page\/\d+/i.test(html)) return "Numeric paging (?page=N or /page/N)";
  if (/[?&]offset=|[?&]start=/i.test(html)) return "Offset paging (?offset=N)";
  if (/load.more|loadmore|ajax.*page|infinite.scroll/i.test(html)) return "Load-more / infinite scroll (JS-driven)";
  if (/cursor|after=|before=/i.test(html)) return "Cursor-based pagination";
  return "Standard next/prev links";
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const competitor = await prisma.competitor.findUnique({ where: { id } });
  if (!competitor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const startUrl: string = body.startUrl || competitor.url;
  const maxPages: number = Math.min(body.maxPages || 5, 20);

  if (!isSafeUrl(startUrl)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const allProductUrls = new Set<string>();
  const categories: Array<{ name: string; url: string }> = [];
  let platform = competitor.platform || "generic";
  let platformConf: PlatformConf = { name: platform, confidence: "low", signals: [] };
  let paginationPattern = "unknown";
  let productUrlPattern = "unknown";
  let sitemapFound = false;
  const errors: string[] = [];

  try {
    // 1. Try sitemap first
    const sitemapUrls = await parseSitemap(competitor.url);
    if (sitemapUrls.length) {
      sitemapUrls.forEach((u) => allProductUrls.add(u));
      sitemapFound = true;
    }

    // 2. Fetch home HTML → platform + pagination detection
    const homeHtml = await fetchHtml(competitor.url, 12000);
    platform = detectPlatform(homeHtml);
    platformConf = analyzePlatformConfidence(homeHtml);
    paginationPattern = detectPaginationPattern(homeHtml);

    // 3. Scan start URL for product URLs and categories
    const homeResult = await scanCategoryPage(startUrl);
    homeResult.urls.forEach((u) => allProductUrls.add(u));
    homeResult.categories.forEach((c) => categories.push(c));

    // 4. Scan category pages
    const categoryQueue = homeResult.categories.slice(0, maxPages);
    for (const cat of categoryQueue) {
      if (!isSafeUrl(cat.url)) continue;
      try {
        const catResult = await scanCategoryPage(cat.url);
        catResult.urls.forEach((u) => allProductUrls.add(u));
      } catch (e: unknown) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }

    // 5. Detect product URL pattern from what we collected
    productUrlPattern = detectProductUrlPattern([...allProductUrls]);

    // 6. Upsert CompetitorProduct rows
    const productUrlArray = [...allProductUrls].slice(0, 500);
    let newCount = 0;
    for (const url of productUrlArray) {
      const existing = await prisma.competitorProduct.findUnique({
        where: { competitorId_url: { competitorId: id, url } },
      });
      if (!existing) {
        await prisma.competitorProduct.create({
          data: { competitorId: id, url, status: "pending" },
        });
        newCount++;
      }
    }

    // 7. Build and cache the structure + analysis report
    const analyzeReport = {
      platform: platformConf.name,
      platformConfidence: platformConf.confidence,
      platformSignals: platformConf.signals,
      paginationPattern,
      productUrlPattern,
      sitemapFound,
      categoryDepth: categories.length,
      topCategories: categories.slice(0, 20).map((c) => c.name),
      totalProductsFound: allProductUrls.size,
      newProductsAdded: newCount,
      scanErrors: errors.slice(0, 5),
    };

    const cachedStructure = JSON.stringify({
      scannedAt: new Date().toISOString(),
      platform: platformConf.name,
      categories: categories.slice(0, 100),
      totalProducts: allProductUrls.size,
      analyzeReport,
    });

    await prisma.competitor.update({
      where: { id },
      data: { platform: platformConf.name, cachedStructure, lastScannedAt: new Date() },
    });

    return NextResponse.json({
      platform: platformConf.name,
      totalFound: allProductUrls.size,
      newProducts: newCount,
      categories: categories.length,
      analyzeReport,
      message: `Scan complete. Found ${allProductUrls.size} products (${newCount} new) on ${platformConf.name} (${platformConf.confidence} confidence).`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
