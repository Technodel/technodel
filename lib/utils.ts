/** Evaluate a simple price formula string.
 *  Variables: cost, source
 *  Example: "cost * 1.25 + 2"
 */
export function evalPriceFormula(formula: string, cost: number, source?: number): number {
  try {
    const fn = new Function("cost", "source", `"use strict"; return (${formula});`);
    const result = fn(cost, source ?? cost);
    if (typeof result !== "number" || isNaN(result) || result < 0) return cost;
    return Math.round(result * 100) / 100;
  } catch {
    return cost;
  }
}

export function formatPrice(price: number, currency = "USD"): string {
  if (currency === "USD") return `$${Math.round(price).toLocaleString()}`;
  if (currency === "LBP") return `${Math.round(price).toLocaleString()} LBP`;
  return `${Math.round(price).toLocaleString()} ${currency}`;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function generateSku(_title?: string, _id?: string): string {
  // Generate a non-supplier-revealing SKU: SK + 8 random alphanumeric chars
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase() +
               Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SK${rand.substring(0, 8)}`;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.substring(0, max - 3) + "...";
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function normalizeUrlWithProtocol(raw: string): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
export function getDisplayStock(stock: number, price: number, category: string): number { if (stock <= 0) return 0; if (category.toLowerCase().includes('laptop')) return Math.min(Math.floor(stock % 10) + 1, 10); if (price < 50) return 100 + (stock % 50); return 10 + (stock % 90); }
