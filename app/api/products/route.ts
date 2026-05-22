import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { technodelSupplierWhere } from "@/lib/catalog-filter";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const parsedPage = Number.parseInt(sp.get("page") || "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parsedLimit = Number.parseInt(sp.get("limit") || "24", 10);
  const limit = Number.isFinite(parsedLimit) ? Math.min(48, Math.max(1, parsedLimit)) : 24;
  const category = sp.get("category");
  const brand = sp.get("brand");
  const minPrice = parseFloat(sp.get("minPrice") || "0");
  const maxPrice = parseFloat(sp.get("maxPrice") || "999999");
  const sort = sp.get("sort") || "featured";
  const featured = sp.get("featured") === "1";
  const isNew = sp.get("new") === "1";
  const q = sp.get("q");

  const extraWhere: any = {};
  if (category) extraWhere.category = { slug: category };
  if (brand) extraWhere.brand = { contains: brand };
  if (featured) extraWhere.isFeatured = true;
  if (isNew) extraWhere.isNew = true;
  if (q) extraWhere.OR = [{ title: { contains: q } }, { brand: { contains: q } }];
  extraWhere.displayPrice = { gte: minPrice, lte: maxPrice };

  const where: any = technodelSupplierWhere(extraWhere);

  const orderBy: any =
    sort === "price_asc" ? { displayPrice: "asc" } :
    sort === "price_desc" ? { displayPrice: "desc" } :
    sort === "newest" ? { createdAt: "desc" } :
    sort === "popular" ? { orderCount: "desc" } :
    { featuredOrder: "asc" };

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          brand: true,
          displayPrice: true,
          comparePrice: true,
          images: true,
          isNew: true,
          isFeatured: true,
          stock: true,
          lowStockThresh: true,
          sourcePrice: true,
          category: { select: { name: true, slug: true } },
          competitor: { select: { name: true, url: true } },
        },
        orderBy,
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products: products.map((p) => {
        let imageUrl = "";
        try { imageUrl = JSON.parse(p.images)[0] || ""; } catch {}
        const { competitor, ...rest } = p;
        return {
          ...rest,
          imageUrl,
          competitor: competitor ? { name: competitor.name, url: competitor.url } : null,
        };
      }),
      total,
      pages: Math.ceil(total / limit),
      page,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
