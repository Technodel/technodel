import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({ datasources: { db: { url: "file:/var/www/technodel.net/new/prisma/dev.db" } } });
const count = await prisma.product.count();
console.log("Total products:", count);
const sample = await prisma.product.findFirst({ select: { id: true, title: true, images: true } });
console.log("Sample product:", JSON.stringify(sample, null, 2));
await prisma.$disconnect();
