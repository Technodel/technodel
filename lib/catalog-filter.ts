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

const AYOUB_TECH_HINT_TERMS = [
  "laptop",
  "notebook",
  "macbook",
  "chromebook",
  "phone",
  "smartphone",
  "iphone",
  "android",
  "mobile",
  "tablet",
  "ipad",
  "monitor",
  "display",
  "tv",
  "qled",
  "oled",
  "printer",
  "scanner",
  "ink",
  "toner",
  "keyboard",
  "mouse",
  "headset",
  "headphone",
  "earbud",
  "speaker",
  "microphone",
  "webcam",
  "router",
  "modem",
  "wifi",
  "network",
  "mesh",
  "switch",
  "ethernet",
  "ssd",
  "hdd",
  "nvme",
  "ram",
  "memory",
  "usb",
  "hdmi",
  "adapter",
  "charger",
  "power bank",
  "cable",
  "gaming",
  "playstation",
  "xbox",
  "nintendo",
  "controller",
  "camera",
  "cctv",
  "surveillance",
  "drone",
  "smart watch",
  "smartwatch",
  "wearable",
  "projector",
  "arduino",
  "sensor",
  "relay",
  "module",
  "raspberry",
  "electronics",
] as const;

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
  "swim ring",
  "inflatable",
  "crayola",
  "coloring",
  "colouring",
  "colour",
  "spatula",
  "pasta",
  "bird",
  "birds",
  "canary",
  "nesting",
  "seeds",
  "cuttle",
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

function ayoubTechHintClauses(): Prisma.ProductWhereInput[] {
  return AYOUB_TECH_HINT_TERMS.flatMap((term) => [
    { title: { contains: term } },
    { shortDescription: { contains: term } },
    { seoKeywords: { contains: term } },
    { sourceUrl: { contains: term } },
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
  if (AYOUB_NON_TECH_TITLE_TERMS.some((term) => normalizedTitle.includes(term))) {
    return false;
  }

  const normalizedSource = (product.sourceUrl || "").toLowerCase();
  const haystack = `${normalizedTitle} ${normalizedSource}`;
  return AYOUB_TECH_HINT_TERMS.some((term) => haystack.includes(term));
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
              { OR: ayoubTechHintClauses() },
            ],
          },
        ],
      },
      extra,
    ],
  };
}

