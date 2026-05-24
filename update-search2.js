
const fs = require("fs");
let content = fs.readFileSync("lib/ai-search.ts", "utf8");

const preString = `
  const baseTerms = q
    .toLowerCase()
    .split(/\\s+/)
    .filter((t) => t.length > 1 && !NOISE_WORDS.has(t));

  const likeConditions = baseTerms.map(t => "p.title LIKE '%" + t.replace(/'/g, "''") + "%'");
  const whereSql = likeConditions.length > 0 ? "AND (" + likeConditions.join(" OR ") + ")" : "";

  const productsPromise = prisma.$queryRawUnsafe<RawProductRow[]>(
    \`SELECT p.id, p.slug, p.title, p.brand, p.displayPrice, p.images, p.orderCount,
         c.name AS categoryName, c.slug AS categorySlug,
         p.sourceUrl AS sourceUrl, cp.name AS competitorName, cp.url AS competitorUrl
     FROM Product p
     LEFT JOIN Category c ON c.id = p.categoryId
       LEFT JOIN Competitor cp ON cp.id = p.competitorId
     WHERE p.isVisible = 1 AND p.displayPrice > 0 \${whereSql}
     ORDER BY p.orderCount DESC
     LIMIT ?\`,
    2500,
  );
`;

content = content.replace(
  /const productsPromise = prisma\.\$queryRawUnsafe<RawProductRow\[\]>\([\s\S]*?2500,\n\s+\);/,
  preString.trim()
);

content = content.replace(
  /const baseTerms = q\n\s+\.toLowerCase\(\)\n\s+\.split\(\/\\s\+\/\)\n\s+\.filter\(\(t\) => t\.length > 1 && !NOISE_WORDS\.has\(t\)\);/,
  ""
);

content = content.replace(
  /AND \(p\.title LIKE \? OR p\.brand LIKE \? OR p\.seoKeywords LIKE \? OR p\.shortDescription LIKE \?\)/,
  `AND p.displayPrice > 0 AND (p.title LIKE ? OR p.brand LIKE ? OR p.seoKeywords LIKE ? OR p.shortDescription LIKE ?)`
);

fs.writeFileSync("lib/ai-search.ts", content);

