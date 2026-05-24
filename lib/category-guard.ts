import { prisma } from "@/lib/prisma";

const CAMERA_DEVICE_PATTERN = /\b(webcam|conference\s*camera|video\s*conferencing|video\s*conference|conferencecam|ptz|rally\s*bar|rally\s*camera|meetup|streamcam|brio|logitech\s*c\d{3}|ip\s*camera|security\s*camera)\b/i;
const LAPTOP_DEVICE_PATTERN = /\b(laptop|notebook|macbook|ultrabook|chromebook|thinkpad|ideapad|vivobook|zenbook)\b/i;

export interface ImportGuardCategoryIds {
  laptopsId: string | null;
  camerasId: string | null;
}

export function isLikelyCameraConferencingProduct(title?: string | null): boolean {
  const text = String(title || "").trim().toLowerCase();
  if (!text) return false;
  return CAMERA_DEVICE_PATTERN.test(text) && !LAPTOP_DEVICE_PATTERN.test(text);
}

export async function getImportGuardCategoryIds(): Promise<ImportGuardCategoryIds> {
  const [laptops, cameras] = await Promise.all([
    prisma.category.findFirst({ where: { slug: "laptops" }, select: { id: true } }),
    prisma.category.findFirst({ where: { slug: "cameras" }, select: { id: true } }),
  ]);

  return {
    laptopsId: laptops?.id || null,
    camerasId: cameras?.id || null,
  };
}

export function applyImportCategoryGuard(
  categoryId: string,
  title: string | null | undefined,
  ids: ImportGuardCategoryIds,
): string {
  if (!categoryId || !ids.laptopsId || !ids.camerasId) return categoryId;
  if (categoryId !== ids.laptopsId) return categoryId;
  if (!isLikelyCameraConferencingProduct(title)) return categoryId;
  return ids.camerasId;
}
