const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const cats = await p.category.findMany({ select: { id: true, name: true, slug: true } });
  console.log(JSON.stringify(cats, null, 2));
  const count = await p.product.count({ where: { isVisible: true } });
  console.log("Product count:", count);
  await p.$disconnect();
}
main().catch(e => { console.error(e.message); p.$disconnect(); });
