/**
 * POST /api/admin/clone/category
 * Scans a category/listing page and returns all product URLs found.
 * Optionally paginates to collect more pages.
 *
 * Body: { categoryUrl, maxPages?: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { scanCategoryPage, isSafeUrl } from "@/lib/scraper";

const MAX_PAGES = 10;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { categoryUrl, maxPages = 1 } = await req.json();

  if (!categoryUrl || !isSafeUrl(categoryUrl)) {
    return NextResponse.json({ error: "Valid category URL required" }, { status: 400 });
  }

  const pagesToFetch = Math.min(Math.max(1, maxPages), MAX_PAGES);
  const allUrls = new Set<string>();
  let currentUrl: string | null = categoryUrl;
  let pagesScanned = 0;
  let platform = "generic";

  while (currentUrl && pagesScanned < pagesToFetch) {
    try {
      const result = await scanCategoryPage(currentUrl);
      platform = result.platform;
      result.urls.forEach((u) => allUrls.add(u));
      pagesScanned++;
      currentUrl = result.nextPageUrl;
    } catch {
      break;
    }
  }

  return NextResponse.json({
    urls: [...allUrls],
    total: allUrls.size,
    pagesScanned,
    hasMore: currentUrl !== null,
    platform,
  });
}
