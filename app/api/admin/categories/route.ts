import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateSlug } from "@/lib/utils";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Unauthorized");
}

export async function GET() {
  try {
    await requireAdmin();
    const categories = await prisma.category.findMany({
      include: { children: true, _count: { select: { products: true } } },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const slug = body.slug || generateSlug(body.name);
    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug,
        icon: body.icon || null,
        image: body.image || null,
        description: body.description || null,
        parentId: body.parentId || null,
        isVisible: body.isVisible !== false,
        sortOrder: body.sortOrder || 0,
        seoTitle: body.seoTitle || body.name,
        seoDescription: body.seoDescription || "",
      },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 500 });
  }
}
