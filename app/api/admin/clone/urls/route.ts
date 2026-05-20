/**
 * POST /api/admin/clone/urls
 * Bulk-scrape multiple product URLs in parallel (max 5 concurrent).
 * Returns previews — does NOT save automatically.
 *
 * Body: { urls: string[], competitorId? }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { scrapeProduct, isSafeUrl, applyCompetitorPricing } from "@/lib/scraper";

const MAX_CONCURRENT = 5;
const MAX_URLS = 50;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { urls, competitorId } = await req.json();

  if (!Array.isArray(urls) || !urls.length) {
    return NextResponse.json({ error: "urls array is required" }, { status: 400 });
  }

  const safeUrls = urls
    .slice(0, MAX_URLS)
    .map((u: string) => u.trim())
    .filter((u: string) => isSafeUrl(u));

  if (!safeUrls.length) {
    return NextResponse.json({ error: "No valid URLs provided" }, { status: 400 });
  }

  // Load competitor for pricing
  let competitor = null;
  if (competitorId) {
    competitor = await prisma.competitor.findUnique({ where: { id: competitorId } });
  }

  // Process in batches of MAX_CONCURRENT
  const results: Array<{ url: string; ok: boolean; data?: unknown; error?: string }> = [];

  for (let i = 0; i < safeUrls.length; i += MAX_CONCURRENT) {
    const batch = safeUrls.slice(i, i + MAX_CONCURRENT);
    const settled = await Promise.allSettled(batch.map((u: string) => scrapeProduct(u)));

    for (let j = 0; j < batch.length; j++) {
      const r = settled[j];
      if (r.status === "fulfilled") {
        const scraped = r.value;
        const displayPrice = scraped.price
          ? competitor
            ? applyCompetitorPricing(scraped.price, competitor)
            : scraped.price
          : null;
        results.push({ url: batch[j], ok: true, data: { scraped, displayPrice } });
      } else {
        results.push({
          url: batch[j],
          ok: false,
          error: r.reason?.message || "Scrape failed",
        });
      }
    }
  }

  const succeeded = results.filter((r) => r.ok).length;
  return NextResponse.json({ results, succeeded, total: safeUrls.length });
}
