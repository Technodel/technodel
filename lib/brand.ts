const SUPPLIER_BRAND_BLOCKLIST = ["electroslab", "electroslob"] as const;

function normalizeBrandToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isBlockedSupplierBrand(value: string): boolean {
  const token = normalizeBrandToken(value);
  if (!token) return false;
  return SUPPLIER_BRAND_BLOCKLIST.some(
    (blocked) => token === blocked || token === `${blocked}com`
  );
}

export function sanitizeProductBrand(
  brand?: string | null,
  competitorName?: string | null,
): string | null {
  const cleanedBrand = (brand || "").trim();
  if (!cleanedBrand) return null;
  if (isBlockedSupplierBrand(cleanedBrand)) return null;

  const cleanedCompetitor = (competitorName || "").trim();
  if (cleanedCompetitor && isBlockedSupplierBrand(cleanedCompetitor)) {
    if (normalizeBrandToken(cleanedBrand) === normalizeBrandToken(cleanedCompetitor)) {
      return null;
    }
  }

  return cleanedBrand;
}
