import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// SQLite LIKE is case-insensitive for ASCII by default — use raw query

// ─── Simple in-memory search cache ──────────────────────────────────────────────
const cache = new Map<string, { results: any[]; ts: number }>();
const CACHE_TTL = 30_000; // 30 seconds
const CACHE_MAX = 200;

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.results;
  cache.delete(key);
  return null;
}

function setCache(key: string, results: any[]) {
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

  if (!q) return NextResponse.json({ results: [] });

  // Check cache
  const cacheKey = `${q}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ results: cached, cached: true });

  try {
    // Use raw SQL — SQLite LIKE is case-insensitive for ASCII
    const likeQ = `%${q}%`;
    const products = await prisma.$queryRawUnsafe<
      Array<{
        id: number;
        slug: string;
        title: string;
        images: string;
        displayPrice: number;
        categoryName: string | null;
        brand: string | null;
      }>
    >(
      `SELECT p.id, p.slug, p.title, p.images, p.displayPrice, 
              c.name AS categoryName, p.brand
       FROM Product p
       LEFT JOIN Category c ON c.id = p.categoryId
       WHERE p.isVisible = 1
         AND (p.title LIKE ? OR p.brand LIKE ? OR p.seoKeywords LIKE ?)
       ORDER BY p.orderCount DESC
       LIMIT ?`,
      likeQ, likeQ, likeQ, limit,
    );

    const results = products.map((p) => {
      let imageUrl = "";
      try { imageUrl = JSON.parse(p.images)[0] || ""; } catch {}
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        imageUrl,
        displayPrice: p.displayPrice,
        category: p.categoryName || "",
        brand: p.brand || "",
      };
    });

    setCache(cacheKey, results);
    return NextResponse.json({ results, cached: false });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({ results: [], error: "Search failed" });
  }
}
