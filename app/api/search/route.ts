import { NextRequest, NextResponse } from "next/server";
import { searchProductsWithAi } from "@/lib/ai-search";

// SQLite LIKE is case-insensitive for ASCII by default — use raw query

// ─── Simple in-memory search cache ──────────────────────────────────────────────
type PreviewResult = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  displayPrice: number;
  category: string;
  brand: string;
};

const cache = new Map<string, { results: PreviewResult[]; ts: number }>();
const CACHE_TTL = 30_000; // 30 seconds
const CACHE_MAX = 200;

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.results;
  cache.delete(key);
  return null;
}

function setCache(key: string, results: PreviewResult[]) {
  if (cache.size >= CACHE_MAX) {
    // Evict oldest
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) cache.delete(oldest[0]);
  }
  cache.set(key, { results, ts: Date.now() });
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "6"), 20);
  const sort = req.nextUrl.searchParams.get("sort") || "popular";

  if (!q) return NextResponse.json({ results: [] });

  // Check cache
  const cacheKey = `${q.toLowerCase()}_${limit}_${sort}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ results: cached, cached: true });

  try {
    const out = await searchProductsWithAi({ q, limit, page: 1, sort });

    const results: PreviewResult[] = out.results.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      imageUrl: p.imageUrl || "",
      displayPrice: p.displayPrice,
      category: p.category?.name || "",
      brand: p.brand || "",
    }));

    setCache(cacheKey, results);
    return NextResponse.json({
      results,
      total: out.total,
      terms: out.terms,
      usedFallback: out.usedFallback,
      cached: false,
    });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({ results: [], error: "Search failed" });
  }
}
