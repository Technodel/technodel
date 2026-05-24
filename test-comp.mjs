import { PrismaClient } from "@prisma/client"; const p = new PrismaClient(); p.competitor.findMany().then(c => console.log(JSON.stringify(c, null, 2))).finally(() => p.$disconnect());
