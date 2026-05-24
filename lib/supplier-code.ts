type SupplierSignalInput = {
  sourceUrl?: string | null;
  competitorName?: string | null;
  competitorUrl?: string | null;
  sku?: string | null;
};

const SUPPLIER_CODE_RULES: Array<{ terms: string[]; code: string }> = [
  { terms: ["ezone", "expert-zone", "expertzone"], code: "AK" },
  { terms: ["ayoub"], code: "HA" },
  { terms: ["soukmafimetlo", "hamie"], code: "YH" },
  { terms: ["jakcomputer", "jak", "jimmy"], code: "JM" },
  { terms: ["electroslab", "electroslob"], code: "AS" },
  { terms: ["pacmax"], code: "RK" },
  { terms: ["dslr", "dsrl"], code: "DS" },
];

function includesAnyTerm(value: string, terms: string[]): boolean {
  const hay = value.toLowerCase();
  return terms.some((term) => hay.includes(term));
}

export function getSupplierCode(signal: SupplierSignalInput): string {
  const fields = [
    signal.sourceUrl || "",
    signal.competitorName || "",
    signal.competitorUrl || "",
    signal.sku || "",
  ];

  for (const field of fields) {
    if (!field) continue;
    for (const rule of SUPPLIER_CODE_RULES) {
      if (includesAnyTerm(field, rule.terms)) return rule.code;
    }
  }

  return "";
}
