/**
 * Prefix any /api/... path with the Next.js basePath so client-side
 * fetch() calls resolve correctly under /new in both dev and production.
 *
 * Usage:  fetch(apiPath("/api/auth/login"), { method: "POST", ... })
 */
export const apiPath = (path: string): string =>
  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
