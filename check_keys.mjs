import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({ datasources: { db: { url: "file:/var/www/technodel.net/new/prisma/dev.db" } } });
const result = await prisma.setting.findUnique({ where: { key: "admin_api_keys_v1" } });
console.log(JSON.stringify(result, null, 2));
await prisma.$disconnect();
