import { sanitizeProductBrand } from "@/lib/brand";

type CopyInput = {
  title?: string | null;
  brand?: string | null;
  sourceUrl?: string | null;
  shortDescription?: string | null;
  description?: string | null;
};

const MOJIBAKE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/â€”/g, "-"],
  [/â€“/g, "-"],
  [/[\u2012\u2013\u2014\u2015]/g, "-"],
  [/â€˜|â€™/g, "'"],
  [/â€œ|â€�/g, '"'],
  [/Â/g, ""],
  [/&#8211;|&#x2013;/gi, "-"],
  [/&#8212;|&#x2014;/gi, "-"],
  [/&amp;/gi, "&"],
  [/&quot;/gi, '"'],
];

function toTitleCase(value: string): string {
  const keepUpper = new Set(["USB", "USB-C", "HDMI", "SSD", "HDD", "RGB", "IPS", "FHD", "QHD", "4K", "5K", "1080P", "1440P"]);
  return value
    .split(" ")
    .map((word) => {
      const trimmed = word.trim();
      if (!trimmed) return trimmed;
      const upper = trimmed.toUpperCase();
      if (keepUpper.has(upper)) return upper;
      if (/^[A-Z0-9-]+$/.test(trimmed) && trimmed.length <= 4) return upper;
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeMojibake(value: string | null | undefined): string {
  let out = String(value || "");
  for (const [pattern, replacement] of MOJIBAKE_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s+/g, " ").trim();
}

export function inferTitleFromSourceUrl(sourceUrl: string | null | undefined): string {
  const raw = String(sourceUrl || "").trim();
  if (!raw) return "";

  try {
    const u = new URL(raw);
    const segments = u.pathname.split("/").filter(Boolean);
    const last = decodeURIComponent(segments[segments.length - 1] || "");
    const cleaned = normalizeMojibake(last)
      .replace(/\.(html?|php)$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b(8211|8212|x2013|x2014)\b/gi, "-")
      .replace(/\s+-\s+/g, " - ")
      .replace(/\s+/g, " ")
      .trim();
    return toTitleCase(cleaned);
  } catch {
    return "";
  }
}

export function buildCanonicalTitle(input: CopyInput): string {
  const brand = sanitizeProductBrand(input.brand);
  const normalizedTitle = normalizeMojibake(input.title);
  const fromSource = inferTitleFromSourceUrl(input.sourceUrl);

  const looksGeneric =
    !normalizedTitle
    || normalizedTitle.length < 4
    || (brand && normalizedTitle.toLowerCase() === brand.toLowerCase())
    || /^(product|item|untitled)$/i.test(normalizedTitle);

  const base = looksGeneric ? (fromSource || normalizedTitle || "Product") : normalizedTitle;
  return toTitleCase(base);
}

export function buildCanonicalShortDescription(input: CopyInput): string {
  const title = buildCanonicalTitle(input);
  return `${title} - Available at Technodel Lebanon with warranty.`;
}

export function buildCanonicalDescription(input: CopyInput): string {
  const existing = normalizeMojibake(input.description);
  if (existing && existing.length >= 80) return existing;

  const title = buildCanonicalTitle(input);
  return `<p>${title}.</p><p>Available at Technodel Lebanon with warranty and fast delivery across Lebanon.</p>`;
}
