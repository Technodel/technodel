import { NextRequest, NextResponse } from "next/server";
import { searchProductsWithAi } from "@/lib/ai-search";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const limitRaw = Number.parseInt(req.nextUrl.searchParams.get("limit") || "24", 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 96) : 24;
  const pageRaw = Number.parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const sort = req.nextUrl.searchParams.get("sort") || "popular";

  if (q.length < 2) {
    return NextResponse.json({ results: [], analysis: null, terms: [], total: 0, usedFallback: false });
  }

  try {
    const out = await searchProductsWithAi({ q, limit, page, sort });
    return NextResponse.json(out);
  } catch (err) {
    console.error("AI search API error:", err);
    return NextResponse.json(
      { results: [], analysis: null, terms: [], total: 0, error: "AI search failed" },
      { status: 500 }
    );
  }
}
