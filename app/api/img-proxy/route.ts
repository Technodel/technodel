import { NextRequest, NextResponse } from "next/server";

// Proxy external product images to bypass hotlink blocking.
// Usage: /new/api/img-proxy?url=https%3A%2F%2F...
// The server fetches the image with a neutral User-Agent and the origin site's
// own domain as Referer, so hotlink protection passes.

export const runtime = "nodejs";

const ALLOWED_ORIGINS_RE = /^https?:\/\//i;

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url") ?? "";

  if (!rawUrl || !ALLOWED_ORIGINS_RE.test(rawUrl)) {
    return new NextResponse("Missing or invalid url param", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return new NextResponse("Malformed URL", { status: 400 });
  }

  // Reject non-image paths for safety
  const ext = parsed.pathname.split(".").pop()?.toLowerCase() ?? "";
  const ALLOWED_EXTENSIONS = new Set(["jpg","jpeg","png","gif","webp","avif","svg","bmp","ico"]);
  // Also allow paths with no extension (some CDNs serve without extension)

  try {
    const upstream = await fetch(rawUrl, {
      headers: {
        // Spoof Referer as the product's own site so hotlink checks pass
        "Referer": `${parsed.protocol}//${parsed.host}/`,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      // Don't follow redirects endlessly
      redirect: "follow",
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream error: ${upstream.status}`, {
        status: upstream.status,
      });
    }

    const contentType =
      upstream.headers.get("content-type") ?? "image/jpeg";

    // Only proxy image content types
    if (!contentType.startsWith("image/")) {
      return new NextResponse("Not an image", { status: 400 });
    }

    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache for 7 days at CDN/browser level
        "Cache-Control": "public, max-age=604800, immutable",
        "X-Proxy": "1",
      },
    });
  } catch (err) {
    console.error("[img-proxy] fetch failed:", rawUrl, err);
    return new NextResponse("Proxy fetch failed", { status: 502 });
  }
}
