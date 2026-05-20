import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import axios from "axios";
import * as cheerio from "cheerio";
import { generateSlug, generateSku } from "@/lib/utils";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const competitor = await prisma.competitor.findUnique({ where: { id } });
  if (!competitor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    // Basic cheerio scan of homepage/sitemap to detect product links
    const { data: html } = await axios.get(competitor.url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      timeout: 15000,
    });

    const $ = cheerio.load(html);
    const productLinks: string[] = [];

    // Detect platform
    let platform = "custom";
    if ($('meta[name="generator"]').attr("content")?.toLowerCase().includes("woocommerce")) platform = "woocommerce";
    else if ($('script[src*="shopify"]').length) platform = "shopify";

    // Collect product links — common patterns
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (href.includes("/product/") || href.includes("/products/") || href.includes("/item/") || href.includes("/p/")) {
        const full = href.startsWith("http") ? href : new URL(href, competitor.url).toString();
        if (!productLinks.includes(full)) productLinks.push(full);
      }
    });

    // Update competitor with detected platform and scan time
    await prisma.competitor.update({
      where: { id },
      data: {
        platform,
        lastScannedAt: new Date(),
        cachedStructure: JSON.stringify({ productLinks: productLinks.slice(0, 100), platform }),
      },
    });

    return NextResponse.json({ count: productLinks.length, platform, message: `Scan complete. Found ${productLinks.length} product URLs.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Scan failed", count: 0 }, { status: 500 });
  }
}
