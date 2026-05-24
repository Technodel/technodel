import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Count by competitor name
const rows = await p.product.findMany({
  where: { competitorId: { not: null } },
  select: { competitor: { select: { name: true } } },
  take: 20000,
});
const counts = {};
for (const r of rows) {
  const name = r.competitor?.name || 'unknown';
  counts[name] = (counts[name] || 0) + 1;
}
console.log('Competitor counts:');
console.log(JSON.stringify(counts, null, 2));

// Also count by SKU prefix
const skuRows = await p.product.findMany({
  select: { sku: true },
  take: 20000,
});
const skuCounts = {};
for (const r of skuRows) {
  const prefix = (r.sku || '').substring(0, 3);
  skuCounts[prefix] = (skuCounts[prefix] || 0) + 1;
}
console.log('\nSKU prefix counts:');
console.log(JSON.stringify(skuCounts, null, 2));

await p.$disconnect();
