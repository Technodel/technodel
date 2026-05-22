import { Prisma } from "@prisma/client";

export const TECH_CATEGORY_SLUGS = [
  "smartphones",
  "laptops",
  "tablets",
  "gaming",
  "audio",
  "accessories",
  "networking",
  "cameras",
  "printers",
  "smart-home",
  "wearables",
  "storage",
] as const;

export const TECHNODEL_SUPPLIER_TERMS = [
  "ayoub",
  "ezone",
  "pacmax",
  "comparts",
  "jak",
  "jimmy",
  "electroslab",
  "electroslob",
] as const;

const AYOUB_SUPPLIER_TERMS = ["ayoub"] as const;

export const AYOUB_NON_TECH_TITLE_TERMS = [
  "locknlock",
  "lock n lock",
  "lock&lock",
  "food container",
  "plastic food",
  "pool",
  "pools",
  "swimming",
  "kitchen",
  "kitchenware",
  "cookware",
  "cat food",
  "dog food",
  "reptile",
  "coffee",
  "tea",
  "espresso",
  "hazelnut syrup",
  "pods",
  "decaf",
  "capsule machine",
  "filter paper",
  "liquid liner",
  "stationery",
  "pencil case",
  "pencil bag",
  "backpack",
  "toy",
  "duck",
] as const;

type SupplierSignalInput = {
  title?: string | null;
  sourceUrl?: string | null;
  competitorName?: string | null;
  competitorUrl?: string | null;
  categorySlug?: string | null;
};

function includesTerm(value: string | null | undefined, term: string): boolean {
  return (value || "").toLowerCase().includes(term);
}

function matchesSupplierTerm(product: SupplierSignalInput, term: string): boolean {
  return includesTerm(product.sourceUrl, term)
    || includesTerm(product.competitorName, term)
    || includesTerm(product.competitorUrl, term);
}

function supplierSignalClauses(terms: readonly string[]): Prisma.ProductWhereInput[] {
  return terms.flatMap((term) => [
    { sourceUrl: { contains: term } },
    { competitor: { name: { contains: term } } },
    { competitor: { url: { contains: term } } },
  ]);
}

export function isTechnodelStorefrontProduct(product: SupplierSignalInput): boolean {
  const fromAllowedSupplier = TECHNODEL_SUPPLIER_TERMS.some((term) => matchesSupplierTerm(product, term));
  if (!fromAllowedSupplier) return false;

  const isAyoubSupplier = AYOUB_SUPPLIER_TERMS.some((term) => matchesSupplierTerm(product, term));
  if (!isAyoubSupplier) return true;

  const normalizedCategory = (product.categorySlug || "").toLowerCase();
  if (!TECH_CATEGORY_SLUGS.includes(normalizedCategory as (typeof TECH_CATEGORY_SLUGS)[number])) {
    return false;
  }

  const normalizedTitle = (product.title || "").toLowerCase();
  return !AYOUB_NON_TECH_TITLE_TERMS.some((term) => normalizedTitle.includes(term));
}

export function technodelSupplierWhere(extra: Prisma.ProductWhereInput = {}): Prisma.ProductWhereInput {
  const allowedSupplierSignals: Prisma.ProductWhereInput = { OR: supplierSignalClauses(TECHNODEL_SUPPLIER_TERMS) };
  const ayoubSupplierSignals: Prisma.ProductWhereInput = { OR: supplierSignalClauses(AYOUB_SUPPLIER_TERMS) };

  return {
    isVisible: true,
    AND: [
      {
        OR: [
          {
            AND: [
              allowedSupplierSignals,
              { NOT: ayoubSupplierSignals },
            ],
          },
          {
            AND: [
              ayoubSupplierSignals,
              { category: { slug: { in: [...TECH_CATEGORY_SLUGS] } } },
              ...AYOUB_NON_TECH_TITLE_TERMS.map((term) => ({ title: { not: { contains: term } } })),
            ],
          },
        ],
      },
      extra,
    ],
  };
}

