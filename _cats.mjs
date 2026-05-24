import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const cats = await p.category.findMany({ select: { id: true, name: true, slug: true } });
for (const c of cats) console.log(c.slug, '=>', c.id);
await p.$disconnect();
