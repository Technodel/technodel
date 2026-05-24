
const fs = require("fs");
let content = fs.readFileSync("lib/ai-search.ts", "utf8");

content = content.replace(
  /WHERE p\.isVisible = 1 AND p\.displayPrice > 0\s+ORDER BY p\.orderCount DESC\s+LIMIT \?/,
  `WHERE p.isVisible = 1 AND p.displayPrice > 0
       \${baseTerms.length > 0 ? "AND (" + baseTerms.map(t => "p.title LIKE '%" + t.replace(/'/g, "''") + "%'").join(" OR ") + ")" : ""}
       ORDER BY p.orderCount DESC
       LIMIT ?`
);

content = content.replace(
  /AND \(p\.title LIKE \? OR p\.brand LIKE \? OR p\.seoKeywords LIKE \? OR p\.shortDescription LIKE \?\)/,
  `AND p.displayPrice > 0 AND (p.title LIKE ? OR p.brand LIKE ? OR p.seoKeywords LIKE ? OR p.shortDescription LIKE ?)`
);

fs.writeFileSync("lib/ai-search.ts", content);

