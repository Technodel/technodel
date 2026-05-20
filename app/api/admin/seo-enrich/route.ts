/**
 * POST /api/admin/seo-enrich
 * Enhances text using Gemini AI for SEO.
 *
 * Body: { text, type, context? }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { enrichText, EnrichType } from "@/lib/seo-enricher";

const VALID_TYPES: EnrichType[] = [
  "title",
  "shortDescription",
  "description",
  "seoTitle",
  "seoDescription",
  "seoKeywords",
];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { text, type, context } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const result = await enrichText(type as EnrichType, text, context);
  return NextResponse.json(result);
}
