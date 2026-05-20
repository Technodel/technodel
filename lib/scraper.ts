/**
 * lib/scraper.ts — Multi-platform product scraper
 * Supports: WooCommerce, Shopify, Magento, BigCommerce, Generic / JSON-LD
 * Uses axios + cheerio (no headless browser needed for most sites)
 */

import axios from "axios";
import * as cheerio from "cheerio";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ScrapedProduct {
  url: string;
  title: string;
  shortDescription: string;
  description: string;
  price: number | null;
  comparePrice: number | null;
  images: string[];
  brand: string | null;
  sku: string | null;
  categories: string[];
  attributes: Record<string, string>;
  platform: string;
  raw?: Record<string, unknown>;
}

export interface ScanResult {
  urls: string[];
  categories: CategoryNode[];
  totalFound: number;
  platform: string;
  nextPageUrl: string | null;
}

export interface CategoryNode {
  name: string;
  url: string;
  productCount?: number;
}

// ─── SECURITY ─────────────────────────────────────────────────────────────────

const PRIVATE_IP_RE =
  /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1|fc00:|fe80:|localhost)/i;
const BLOCKED_HOSTS = [
  "169.254.169.254",
  "metadata.google.internal",
  "instance-data",
];

export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    if (PRIVATE_IP_RE.test(host)) return false;
    if (BLOCKED_HOSTS.some((b) => host.includes(b))) return false;
    return true;
  } catch {
    return false;
  }
}

// ─── HTTP FETCH ───────────────────────────────────────────────────────────────

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export async function fetchHtml(url: string, timeoutMs = 15000): Promise<string> {
  if (!isSafeUrl(url)) throw new Error(`Blocked URL: ${url}`);
  const res = await axios.get(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
    },
    timeout: timeoutMs,
    maxRedirects: 5,
    validateStatus: (s) => s < 400,
  });
  return typeof res.data === "string" ? res.data : JSON.stringify(res.data);
}

// ─── PLATFORM DETECTION ───────────────────────────────────────────────────────

export function detectPlatform(html: string): string {
  if (/cdn\.shopify\.com|shopify\.com\/s\/files|Shopify\.shop|window\.Shopify\b/i.test(html))
    return "shopify";
  if (/woocommerce|wc-block|\/wp-json\/wc\//i.test(html)) return "woocommerce";
  if (/Magento_Catalog|mage\/bootstrap|Mage\.Cookies/i.test(html)) return "magento";
  if (/cdn\.bigcommerce\.com|window\.BCData/i.test(html)) return "bigcommerce";
  if (/PrestaShop|prestashop/i.test(html)) return "prestashop";
  if (/OpenCart|catalog\/view\/theme/i.test(html)) return "opencart";
  return "generic";
}

// ─── PRICE PARSING ────────────────────────────────────────────────────────────

export function parsePrice(text: string): number | null {
  if (!text) return null;
  // Remove commas used as thousands separators, Arabic decimal separators
  const cleaned = text.replace(/[,،\s]/g, "").replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) || num <= 0 ? null : Math.round(num * 100) / 100;
}

// ─── IMAGE URL NORMALIZATION ──────────────────────────────────────────────────

const THUMB_SUFFIX_RE = /-\d+x\d+(\.(jpe?g|png|webp|gif))$/i;
const SIZE_PARAM_RE = /[?&](width|height|w|h|size|resize|fit)=\d+/gi;

export function normalizeImageUrl(url: string): string {
  // Remove WooCommerce thumbnail suffixes like -300x300.jpg → .jpg
  let clean = url.replace(THUMB_SUFFIX_RE, "$1");
  // Remove CDN size query params
  clean = clean.replace(SIZE_PARAM_RE, "").replace(/[?&]$/, "");
  return clean;
}

// ─── JSON-LD EXTRACTION ───────────────────────────────────────────────────────

export function extractFromJsonLd(html: string): Partial<ScrapedProduct> {
  const result: Partial<ScrapedProduct> = {};
  const matches = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const match of matches) {
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(match[1].trim());
    } catch {
      // Try to repair common JSON issues
      try {
        data = JSON.parse(match[1].trim().replace(/[\u0000-\u001F]/g, " "));
      } catch {
        continue;
      }
    }

    const items: Record<string, unknown>[] = Array.isArray(data)
      ? (data as Record<string, unknown>[])
      : [data, ...((data["@graph"] as Record<string, unknown>[]) || [])];

    for (const item of items) {
      if (!item || item["@type"] !== "Product") continue;

      result.title = result.title || (item.name as string);
      result.brand =
        result.brand ||
        (typeof item.brand === "object"
          ? (item.brand as Record<string, string>)?.name
          : (item.brand as string));
      result.sku = result.sku || (item.sku as string) || (item.productID as string);
      result.description = result.description || (item.description as string);

      // Offers → price
      const offer = Array.isArray(item.offers)
        ? (item.offers as Record<string, unknown>[])[0]
        : (item.offers as Record<string, unknown>);
      if (offer?.price && !result.price) {
        result.price = parseFloat(String(offer.price)) || null;
      }

      // Images
      if (!result.images?.length && item.image) {
        const imgs = Array.isArray(item.image) ? item.image : [item.image];
        result.images = (imgs as unknown[])
          .map((img) =>
            typeof img === "string" ? img : (img as Record<string, string>)?.url || ""
          )
          .filter(Boolean)
          .map(normalizeImageUrl);
      }

      break;
    }
    if (result.title) break;
  }

  return result;
}

// ─── MAIN PRODUCT SCRAPER ─────────────────────────────────────────────────────

export async function scrapeProduct(rawUrl: string): Promise<ScrapedProduct> {
  const url = rawUrl.split("#")[0]; // strip fragment
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const platform = detectPlatform(html);
  const base = new URL(url).origin;

  // Remove noise
  $("script[src], style, noscript, header, footer, nav, .site-header, .site-footer").remove();

  // ── JSON-LD first (most reliable) ──────────────────────
  const ld = extractFromJsonLd(html);

  // ── Title ──────────────────────────────────────────────
  const title =
    ld.title ||
    $(
      "h1.product_title, h1.product-title, .product__title h1, [itemprop='name'], h1"
    )
      .first()
      .text()
      .trim() ||
    $("meta[property='og:title']").attr("content") ||
    "";

  // ── Price ──────────────────────────────────────────────
  let price = ld.price ?? null;
  let comparePrice: number | null = null;

  if (!price) {
    const priceSelectors = [
      { sel: ".woocommerce-Price-amount bdi", type: "current" },
      { sel: "ins .woocommerce-Price-amount bdi", type: "sale" },
      { sel: "del .woocommerce-Price-amount bdi", type: "compare" },
      { sel: "[itemprop='price']", type: "current" },
      { sel: "[data-product-price]", type: "current" },
      { sel: ".price__current, .product__price", type: "current" },
      { sel: ".price .amount", type: "current" },
    ];

    for (const { sel, type } of priceSelectors) {
      const el = $(sel).first();
      if (!el.length) continue;
      const val = parsePrice(el.attr("content") || el.text());
      if (!val) continue;
      if (type === "compare") comparePrice = val;
      else if (!price) price = val;
    }
  }

  // ── Images ─────────────────────────────────────────────
  let images: string[] = ld.images || [];
  if (!images.length) {
    const seen = new Set<string>();
    const imgSelectors = [
      ".woocommerce-product-gallery img",
      ".product__media img",
      ".product-images img",
      ".product-gallery img",
      ".product-single__photo img",
      "[data-product-featured-image]",
      "figure.product__media img",
    ];

    for (const sel of imgSelectors) {
      $(sel).each((_, el) => {
        const src =
          $(el).attr("data-zoom-image") ||
          $(el).attr("data-large-image") ||
          $(el).attr("data-src") ||
          $(el).attr("src") ||
          "";
        if (!src || src.includes("placeholder") || src.includes("data:")) return;
        const full = src.startsWith("http") ? src : `${base}${src.startsWith("/") ? "" : "/"}${src}`;
        const norm = normalizeImageUrl(full);
        if (!seen.has(norm)) {
          seen.add(norm);
          images.push(norm);
        }
      });
      if (images.length >= 2) break;
    }

    // OG fallback
    if (!images.length) {
      const ogImg = $("meta[property='og:image']").attr("content");
      if (ogImg) images.push(normalizeImageUrl(ogImg.startsWith("http") ? ogImg : `${base}${ogImg}`));
    }
  }

  // ── Descriptions ───────────────────────────────────────
  const shortDescription =
    $(
      ".woocommerce-product-details__short-description, .product__description-short, .product-description--short"
    )
      .first()
      .text()
      .trim() ||
    $("meta[name='description'], meta[property='og:description']").attr("content") ||
    "";

  const descHtml =
    $(
      "#tab-description, .woocommerce-Tabs-panel--description, .product__description, .product-description, [itemprop='description']"
    )
      .first()
      .html() ||
    ld.description ||
    "";

  // ── Brand ──────────────────────────────────────────────
  const brand =
    ld.brand ||
    $("[itemprop='brand'] span, [itemprop='brand']").first().text().trim() ||
    $(".product-brand a, .brand a, .brand-name").first().text().trim() ||
    null;

  // ── SKU ────────────────────────────────────────────────
  const sku =
    ld.sku ||
    $(".sku, [itemprop='sku'], .product-sku").first().text().trim().replace(/[^A-Z0-9\-_.]/gi, "") ||
    null;

  // ── Categories (breadcrumb) ────────────────────────────
  const categories: string[] = [];
  $(".posted_in a, .product_meta .posted_in a, .breadcrumb a, nav.breadcrumb a, ol.breadcrumb a").each(
    (_, el) => {
      const text = $(el).text().trim();
      if (text && !["Home", "Shop", "Products", "Accueil"].includes(text)) {
        categories.push(text);
      }
    }
  );

  // ── Attributes ────────────────────────────────────────
  const attributes: Record<string, string> = {};
  $(
    "table.woocommerce-product-attributes tr, table.product-attributes tr, .product-details__information tr"
  ).each((_, row) => {
    const label = $(row).find("th, td.label, td:first-child").first().text().trim().replace(/:$/, "");
    const value = $(row).find("td.product-attribute-value, td:not(.label), td:last-child").text().trim();
    if (label && value && label !== value) attributes[label] = value;
  });

  return {
    url,
    title,
    shortDescription,
    description: typeof descHtml === "string" ? descHtml : "",
    price,
    comparePrice,
    images,
    brand: brand || null,
    sku: sku || null,
    categories,
    attributes,
    platform,
  };
}

// ─── CATEGORY PAGE SCANNER ────────────────────────────────────────────────────

/**
 * Scrapes a category/listing page and returns all product URLs found.
 * Handles WooCommerce, Shopify, generic listing patterns.
 */
export async function scanCategoryPage(categoryUrl: string): Promise<ScanResult> {
  const html = await fetchHtml(categoryUrl);
  const $ = cheerio.load(html);
  const platform = detectPlatform(html);
  const base = new URL(categoryUrl).origin;
  const seen = new Set<string>();
  const productUrls: string[] = [];

  function addUrl(href: string) {
    if (!href) return;
    const full = href.startsWith("http") ? href : `${base}${href.startsWith("/") ? "" : "/"}${href}`;
    const clean = full.split("?")[0].split("#")[0];
    if (!seen.has(clean) && clean.startsWith("http")) {
      seen.add(clean);
      productUrls.push(clean);
    }
  }

  // WooCommerce & generic
  $("li.product a.woocommerce-loop-product__link").each((_, el) => addUrl($(el).attr("href") || ""));
  $(".products .product > a:first-child, ul.products a[class*='link']").each((_, el) =>
    addUrl($(el).attr("href") || "")
  );

  // Shopify
  $(".product-item a.product-link, .product-grid-item a, .grid-product__link").each((_, el) =>
    addUrl($(el).attr("href") || "")
  );

  // Generic product link patterns — but only if we haven't found anything
  if (!productUrls.length) {
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (
        /\/(product|products|item|p|catalogue|fiches)\//i.test(href) &&
        !/\/(category|categories|brand|tag)\//i.test(href)
      ) {
        addUrl(href);
      }
    });
  }

  // Subcategory links (for site crawl context)
  const categories: CategoryNode[] = [];
  $(
    ".product-categories a, .widget_product_categories a, .woocommerce-widget-layered-nav a, .site-nav a"
  ).each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr("href") || "";
    if (text && href) {
      const full = href.startsWith("http") ? href : `${base}${href.startsWith("/") ? "" : "/"}${href}`;
      categories.push({ name: text, url: full });
    }
  });

  // Detect next page
  let nextPageUrl: string | null = null;
  const nextSel = $("a.next, a[rel='next'], .pagination .next a, a.woocommerce-pagination-next");
  if (nextSel.length) {
    const nextHref = nextSel.first().attr("href") || "";
    if (nextHref) {
      nextPageUrl = nextHref.startsWith("http") ? nextHref : `${base}${nextHref}`;
    }
  }

  return {
    urls: productUrls,
    categories,
    totalFound: productUrls.length,
    platform,
    nextPageUrl,
  };
}

// ─── SITEMAP PARSER ───────────────────────────────────────────────────────────

/**
 * Tries to fetch and parse sitemap.xml for product URLs.
 * Handles standard sitemap.xml, sitemap indexes, AND BigCommerce /xmlsitemap.php.
 */
export async function parseSitemap(siteUrl: string): Promise<string[]> {
  const base = new URL(siteUrl).origin;
  const seen = new Set<string>();
  const urls: string[] = [];

  async function tryFetch(url: string): Promise<string | null> {
    try {
      return await fetchHtml(url, 12000);
    } catch {
      return null;
    }
  }

  // Collect product URLs from a parsed sitemap XML string.
  // A "product URL" is any <loc> that is NOT itself a sub-sitemap reference
  // and does NOT look like a category/brand/tag/page URL.
  function harvestProductUrls(xml: string): void {
    for (const m of xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)) {
      const loc = m[1].trim();
      if (!loc || seen.has(loc)) continue;
      // Skip sub-sitemap URLs and obvious non-product paths
      if (
        loc.includes("sitemap") ||
        /\/(category|categories|brand[s]?|tag[s]?|page[s]?|blog)\//i.test(loc)
      ) continue;
      seen.add(loc);
      urls.push(loc);
    }
  }

  // Returns sub-sitemap URLs (sitemapindex <loc> entries)
  function extractSubSitemaps(xml: string): string[] {
    const subs: string[] = [];
    // Inside a <sitemapindex>, each <sitemap><loc> is a child sitemap URL
    if (!xml.includes("<sitemapindex")) return subs;
    for (const m of xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)) {
      const loc = m[1].trim();
      if (loc && (loc.includes("sitemap") || loc.includes("xmlsitemap"))) {
        subs.push(loc);
      }
    }
    return subs;
  }

  // Fetch and process a single sitemap URL (may be index or leaf)
  async function processSitemap(url: string, depth = 0): Promise<void> {
    if (depth > 2) return; // guard against infinite recursion
    const xml = await tryFetch(url);
    if (!xml) return;

    if (xml.includes("<sitemapindex")) {
      // Follow each sub-sitemap — but only product/page ones to stay fast
      const subs = extractSubSitemaps(xml).filter((u) =>
        /type=products|product-sitemap|sitemap_product/i.test(u)
      );
      // If none match the filter, try all sub-sitemaps
      const toProcess = subs.length ? subs : extractSubSitemaps(xml).slice(0, 10);
      for (const sub of toProcess) {
        await processSitemap(sub, depth + 1);
        if (urls.length >= 500) break; // cap
      }
    } else {
      harvestProductUrls(xml);
    }
  }

  // Candidate sitemap URLs to try (in order)
  const candidates = [
    `${base}/sitemap.xml`,
    `${base}/sitemap_index.xml`,
    `${base}/product-sitemap.xml`,
    `${base}/xmlsitemap.php?tp=products`,   // BigCommerce
    `${base}/xmlsitemap.php`,               // BigCommerce fallback
  ];

  for (const candidate of candidates) {
    const xml = await tryFetch(candidate);
    if (!xml) continue;

    if (xml.includes("<sitemapindex")) {
      await processSitemap(candidate);
    } else {
      harvestProductUrls(xml);
    }

    if (urls.length > 0) break; // stop as soon as we have results
  }

  return urls;
}

// ─── APPLY PRICE FORMULA ─────────────────────────────────────────────────────

export function applyCompetitorPricing(
  sourcePrice: number,
  competitor: {
    markupPct: number;
    markupFlat?: number;
    markupMode?: string;
    priceFormula?: string | null;
  }
): number {
  if (competitor.priceFormula) {
    try {
      // Use Function constructor with limited scope
      const fn = new Function(
        "source",
        "cost",
        `"use strict"; return (${competitor.priceFormula});`
      );
      const result = fn(sourcePrice, sourcePrice);
      if (typeof result === "number" && !isNaN(result) && result > 0)
        return Math.round(result * 100) / 100;
    } catch {
      // fall through
    }
  }

  // Default: percent (supports negative markup for reductions)
  const pct = competitor.markupPct || 0;
  return Math.round(sourcePrice * (1 + pct / 100) * 100) / 100;
}
