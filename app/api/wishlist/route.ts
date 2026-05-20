import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET — Fetch authenticated user's wishlist items
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const items = await prisma.wishlistItem.findMany({
      where: { userId: session.userId },
      include: {
        product: {
          select: {
            id: true, slug: true, title: true, displayPrice: true,
            comparePrice: true, images: true, brand: true, stock: true,
            category: { select: { slug: true } },
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch wishlist." }, { status: 500 });
  }
}

// POST — Add item to wishlist
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    // Check product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId: session.userId, productId } },
    });

    if (existing) {
      return NextResponse.json({ message: "Already in wishlist", item: existing });
    }

    const item = await prisma.wishlistItem.create({
      data: { userId: session.userId, productId },
      include: {
        product: {
          select: { id: true, slug: true, title: true, displayPrice: true, images: true },
        },
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to add to wishlist." }, { status: 500 });
  }
}

// DELETE — Remove item from wishlist
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    await prisma.wishlistItem.deleteMany({
      where: { userId: session.userId, productId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to remove from wishlist." }, { status: 500 });
  }
}
