import { prisma } from "@/lib/prisma";
import { aiChat, parseAiJson } from "@/lib/ai-client";

export interface AiQueryAnalysis {
  intent: string;
  canonicalTerms: string[];
  expandedTerms: string[];
  category: string | null;
  maxPrice: number | null;
  minPrice: number | null;
  brand: string | null;
  questionType?: string | null;
  useCase?: string | null;
}

export interface AiSearchProduct {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  displayPrice: number;
  comparePrice: number | null;
  imageUrl: string;
  isNew: boolean;
  isFeatured: boolean;
  stock: number;
  lowStockThresh: number;
  category: { name: string; slug: string };
  score?: number;
}

export interface AiSearchResponse {
  results: AiSearchProduct[];
  total: number;
  analysis: {
    intent: string;
    category: string | null;
    expandedTerms: string[];
    brand: string | null;
    questionType: string | null;
    useCase: string | null;
  } | null;
  terms: string[];
  usedFallback: boolean;
}

type SearchOptions = {
  q: string;
  limit?: number;
  page?: number;
  sort?: string;
};

type RawProductRow = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  displayPrice: number;
  comparePrice: number | null;
  images: string;
  isNew: number | boolean;
  isFeatured: number | boolean;
  stock: number;
  lowStockThresh: number;
  orderCount: number;
  createdAt: string | Date;
  categoryName: string | null;
  categorySlug: string | null;
};

const aiCache = new Map<string, { result: AiQueryAnalysis; ts: number }>();
const AI_CACHE_TTL = 10 * 60 * 1000;

const NOISE_WORDS = new Set([
  "the", "a", "an", "for", "with", "best", "good", "cheap", "new", "top",
  "buy", "get", "find", "show", "me", "my", "upgrade", "want", "need",
  "looking", "some", "this", "that", "and", "or", "in", "on", "at", "to",
  "is", "it", "of",
]);

function normalizeCategoryNames(rows: Array<{ name: string }>): string[] {
  return rows
    .map((r) => r.name.trim())
    .filter(Boolean)
    .slice(0, 40);
}

function firstImage(images: string): string {
  try {
    const parsed = JSON.parse(images) as unknown;
    if (Array.isArray(parsed) && typeof parsed[0] === "string") return parsed[0] || "";
    return "";
  } catch {
    return "";
  }
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

async function analyzeWithAi(q: string, availableCategories: string[]): Promise<AiQueryAnalysis | null> {
  const cacheKey = q.toLowerCase().trim();
  const cached = aiCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < AI_CACHE_TTL) return cached.result;

  try {
    const categoriesList = availableCategories.join(", ");
    const text = await aiChat(
      [
        {
          role: "system",
          content: `You are a multilingual product search analyzer for an e-commerce store.

Input can be Arabic or English. Product catalog data is in ENGLISH.
If input is Arabic, translate user intent into English terms.

Return ONLY valid JSON with this shape:
{
  "intent": "buy"|"compare"|"browse"|"find_cheap"|"gift"|"question",
  "canonicalTerms": [1-4 key terms in ENGLISH, lowercase],
  "expandedTerms": [2-6 ENGLISH synonyms/related terms],
  "category": best category from this list or null: ${categoriesList},
  "maxPrice": number or null,
  "minPrice": number or null,
  "brand": string or null,
  "questionType": "gift"|"best_for"|"comparison"|"recommendation"|null,
  "useCase": string in ENGLISH or null
}

Rules:
- Gift queries set intent="gift" and questionType="gift".
- "Best X for Y" sets questionType="best_for" and fills useCase.
- Comparisons set intent="compare" and questionType="comparison".
- Budget constraints map to maxPrice/minPrice and may use intent="find_cheap".
- For Arabic input, output canonicalTerms/expandedTerms/useCase in ENGLISH.

Return JSON only, no markdown.`,
        },
        { role: "user", content: q },
      ],
      { maxTokens: 280, timeoutMs: 8000, json: true }
    );

    if (!text) return null;
    const parsed = parseAiJson<AiQueryAnalysis>(text);
    if (!parsed?.canonicalTerms?.length) return null;

    const normalized: AiQueryAnalysis = {
      intent: typeof parsed.intent === "string" ? parsed.intent : "browse",
      canonicalTerms: Array.isArray(parsed.canonicalTerms)
        ? parsed.canonicalTerms.filter((t): t is string => typeof t === "string").map((t) => t.trim().toLowerCase()).filter(Boolean)
        : [],
      expandedTerms: Array.isArray(parsed.expandedTerms)
        ? parsed.expandedTerms.filter((t): t is string => typeof t === "string").map((t) => t.trim().toLowerCase()).filter(Boolean)
        : [],
      category: typeof parsed.category === "string" ? parsed.category : null,
      maxPrice: parseNumeric(parsed.maxPrice),
      minPrice: parseNumeric(parsed.minPrice),
      brand: typeof parsed.brand === "string" ? parsed.brand : null,
      questionType: typeof parsed.questionType === "string" ? parsed.questionType : null,
      useCase: typeof parsed.useCase === "string" ? parsed.useCase : null,
    };

    if (!normalized.canonicalTerms.length) return null;

    aiCache.set(cacheKey, { result: normalized, ts: Date.now() });
    return normalized;
  } catch {
    return null;
  }
}

function scoreProduct(args: {
  title: string;
  brand: string;
  category: string;
  query: string;
  price: number;
  allTerms: string[];
  maxPrice: number | null;
  minPrice: number | null;
  intent?: string;
}): number {
  const { title, brand, category, query, price, allTerms, maxPrice, minPrice, intent } = args;

  if (maxPrice !== null && price > maxPrice) return -1;
  if (minPrice !== null && price < minPrice) return -1;

  const titleLower = title.toLowerCase();
  const brandLower = brand.toLowerCase();
  const categoryLower = category.toLowerCase();
  const queryLower = query.toLowerCase();

  let score = 0;
  let titleHits = 0;

  if (queryLower.length >= 2 && titleLower.includes(queryLower)) {
    score += 90;
    titleHits += 1;
  }

  const words = titleLower.split(/\s+/);

  for (const term of allTerms) {
    if (term.length < 2) continue;
    const t = term.toLowerCase();

    const wordMatch =
      t.length <= 3
        ? words.some((w) => w === t)
        : words.some((w) => w === t || w.startsWith(t));

    if (wordMatch) {
      const exact = words.some((w) => w === t);
      score += exact ? 60 : 45;
      titleHits += 1;
      continue;
    }

    if (brandLower.includes(t)) {
      score += 20;
      continue;
    }

    if (categoryLower.includes(t)) {
      score += 8;
    }
  }

  if (intent === "gift" || intent === "browse") {
    if (titleHits === 0 && categoryLower.length > 0) {
      const catMatch = allTerms.some((t) => categoryLower.includes(t) || t.includes(categoryLower));
      if (catMatch) score = Math.max(score, 15);
    }
  }

  const meaningfulTerms = allTerms.filter((t) => t.length >= 2).length;
  if (meaningfulTerms >= 2 && titleHits === 0 && intent !== "gift" && intent !== "browse") {
    return -1;
  }

  return score;
}

function normalizeSort(sort: string): "popular" | "price_asc" | "price_desc" | "newest" {
  if (sort === "price_asc" || sort === "price_desc" || sort === "newest") return sort;
  return "popular";
}

function mapAnalysis(analysis: AiQueryAnalysis | null): AiSearchResponse["analysis"] {
  if (!analysis) return null;
  return {
    intent: analysis.intent,
    category: analysis.category,
    expandedTerms: analysis.expandedTerms.slice(0, 6),
    brand: analysis.brand,
    questionType: analysis.questionType || null,
    useCase: analysis.useCase || null,
  };
}

function mapRawRow(row: RawProductRow): AiSearchProduct & { _orderCount: number; _createdAt: Date } {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    brand: row.brand,
    displayPrice: Number(row.displayPrice) || 0,
    comparePrice: row.comparePrice === null ? null : Number(row.comparePrice),
    imageUrl: firstImage(row.images),
    isNew: Boolean(row.isNew),
    isFeatured: Boolean(row.isFeatured),
    stock: Number(row.stock) || 0,
    lowStockThresh: Number(row.lowStockThresh) || 0,
    category: {
      name: row.categoryName || "",
      slug: row.categorySlug || "",
    },
    _orderCount: Number(row.orderCount) || 0,
    _createdAt: new Date(row.createdAt),
  };
}

async function fallbackContainsSearch(opts: {
  q: string;
  page: number;
  limit: number;
  sort: "popular" | "price_asc" | "price_desc" | "newest";
}): Promise<{ results: AiSearchProduct[]; total: number }> {
  const { q, page, limit, sort } = opts;

  const likeQ = `%${q}%`;
  const offset = (page - 1) * limit;
  const orderSql =
    sort === "price_asc"
      ? "p.displayPrice ASC"
      : sort === "price_desc"
        ? "p.displayPrice DESC"
        : sort === "newest"
          ? "p.createdAt DESC"
          : "p.orderCount DESC";

  const [rows, countRows] = await Promise.all([
    prisma.$queryRawUnsafe<RawProductRow[]>(
      `SELECT p.id, p.slug, p.title, p.brand, p.displayPrice, p.comparePrice, p.images,
              p.isNew, p.isFeatured, p.stock, p.lowStockThresh, p.orderCount, p.createdAt,
              c.name AS categoryName, c.slug AS categorySlug
       FROM Product p
       LEFT JOIN Category c ON c.id = p.categoryId
       WHERE p.isVisible = 1
         AND (p.title LIKE ? OR p.brand LIKE ? OR p.seoKeywords LIKE ? OR p.shortDescription LIKE ?)
       ORDER BY ${orderSql}
       LIMIT ? OFFSET ?`,
      likeQ, likeQ, likeQ, likeQ, limit, offset,
    ),
    prisma.$queryRawUnsafe<Array<{ total: number }>>(
      `SELECT COUNT(*) AS total
       FROM Product p
       WHERE p.isVisible = 1
         AND (p.title LIKE ? OR p.brand LIKE ? OR p.seoKeywords LIKE ? OR p.shortDescription LIKE ?)`,
      likeQ, likeQ, likeQ, likeQ,
    ),
  ]);

  const total = Number(countRows[0]?.total || 0);

  return {
    results: rows.map((row) => {
      const mapped = mapRawRow(row);
      const { _orderCount, _createdAt, ...item } = mapped;
      return item;
    }),
    total,
  };
}

export async function searchProductsWithAi(options: SearchOptions): Promise<AiSearchResponse> {
  const q = options.q.trim();
  const limit = Math.max(1, Math.min(options.limit ?? 24, 96));
  const page = Math.max(1, options.page ?? 1);
  const sort = normalizeSort(options.sort || "popular");

  if (q.length < 2) {
    return { results: [], total: 0, analysis: null, terms: [], usedFallback: false };
  }

  const categoriesPromise = prisma.category.findMany({
    where: { isVisible: true },
    select: { name: true },
    take: 60,
  });

  const productsPromise = prisma.$queryRawUnsafe<RawProductRow[]>(
    `SELECT p.id, p.slug, p.title, p.brand, p.displayPrice, p.comparePrice, p.images,
            p.isNew, p.isFeatured, p.stock, p.lowStockThresh, p.orderCount, p.createdAt,
            c.name AS categoryName, c.slug AS categorySlug
     FROM Product p
     LEFT JOIN Category c ON c.id = p.categoryId
     WHERE p.isVisible = 1 AND p.displayPrice > 0
     ORDER BY p.orderCount DESC
     LIMIT ?`,
    2500,
  );

  const categoryRows = await categoriesPromise;
  const analysisPromise = analyzeWithAi(q, normalizeCategoryNames(categoryRows));
  const products = await productsPromise;
  const analysis = await analysisPromise;

  const baseTerms = q
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1 && !NOISE_WORDS.has(t));

  const aiTerms = analysis
    ? [...analysis.canonicalTerms, ...analysis.expandedTerms]
        .map((t) => t.toLowerCase())
        .filter((t) => t.length > 1)
    : [];

  const allTerms = Array.from(new Set([...baseTerms, ...aiTerms]));

  const maxPrice = analysis?.maxPrice ?? null;
  const minPrice = analysis?.minPrice ?? null;
  const intent = analysis?.intent;

  const scored = products
    .map((row) => {
      const p = mapRawRow(row);
      const score = scoreProduct({
        title: p.title,
        brand: p.brand || "",
        category: p.category.name || "",
        query: q,
        price: p.displayPrice,
        allTerms,
        maxPrice,
        minPrice,
        intent,
      });

      if (score <= 0) return null;

      const item: AiSearchProduct & { _score: number; _orderCount: number; _createdAt: Date } = {
        id: p.id,
        slug: p.slug,
        title: p.title,
        brand: p.brand,
        displayPrice: p.displayPrice,
        comparePrice: p.comparePrice,
        imageUrl: p.imageUrl,
        isNew: p.isNew,
        isFeatured: p.isFeatured,
        stock: p.stock,
        lowStockThresh: p.lowStockThresh,
        category: p.category,
        score,
        _score: score,
        _orderCount: p._orderCount,
        _createdAt: p._createdAt,
      };

      return item;
    })
    .filter((p): p is AiSearchProduct & { _score: number; _orderCount: number; _createdAt: Date } => Boolean(p));

  if (!scored.length) {
    const fallback = await fallbackContainsSearch({ q, page, limit, sort });
    return {
      results: fallback.results,
      total: fallback.total,
      analysis: mapAnalysis(analysis),
      terms: allTerms.slice(0, 12),
      usedFallback: true,
    };
  }

  if (sort === "price_asc") {
    scored.sort((a, b) => a.displayPrice - b.displayPrice || b._score - a._score);
  } else if (sort === "price_desc") {
    scored.sort((a, b) => b.displayPrice - a.displayPrice || b._score - a._score);
  } else if (sort === "newest") {
    scored.sort((a, b) => b._createdAt.getTime() - a._createdAt.getTime() || b._score - a._score);
  } else {
    scored.sort((a, b) => b._score - a._score || b._orderCount - a._orderCount);
  }

  const start = (page - 1) * limit;
  const paged = scored.slice(start, start + limit).map(({ _score, _orderCount, _createdAt, ...item }) => item);

  return {
    results: paged,
    total: scored.length,
    analysis: mapAnalysis(analysis),
    terms: allTerms.slice(0, 12),
    usedFallback: false,
  };
}
