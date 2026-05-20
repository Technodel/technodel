/**
 * Seed script — run with: node prisma/seed.mjs
 * Sets up: admin password hash + demo categories
 */
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_PASSWORD = "301088";

const CATEGORIES = [
  { name: "Smartphones",  slug: "smartphones",  icon: "📱", sortOrder: 1 },
  { name: "Laptops",      slug: "laptops",      icon: "💻", sortOrder: 2 },
  { name: "Tablets",      slug: "tablets",      icon: "📲", sortOrder: 3 },
  { name: "Gaming",       slug: "gaming",       icon: "🎮", sortOrder: 4 },
  { name: "Audio",        slug: "audio",        icon: "🎧", sortOrder: 5 },
  { name: "Accessories",  slug: "accessories",  icon: "🔌", sortOrder: 6 },
  { name: "Networking",   slug: "networking",   icon: "📡", sortOrder: 7 },
  { name: "Cameras",      slug: "cameras",      icon: "📷", sortOrder: 8 },
  { name: "Printers",     slug: "printers",     icon: "🖨️", sortOrder: 9 },
  { name: "Smart Home",   slug: "smart-home",   icon: "🏠", sortOrder: 10 },
  { name: "Wearables",    slug: "wearables",    icon: "⌚", sortOrder: 11 },
  { name: "Storage",      slug: "storage",      icon: "💾", sortOrder: 12 },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Admin password
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await prisma.setting.upsert({
    where: { key: "admin_password_hash" },
    update: { value: hash },
    create: { key: "admin_password_hash", value: hash },
  });
  console.log("✅ Admin password hash stored (galaxy / 301088)");

  // Categories
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { icon: cat.icon, sortOrder: cat.sortOrder, name: cat.name },
      create: { ...cat, isVisible: true, seoTitle: cat.name, seoDescription: `Browse ${cat.name} at Technodel Lebanon` },
    });
  }
  console.log(`✅ ${CATEGORIES.length} categories seeded`);

  // Store settings
  const defaults = [
    { key: "site_name", value: "Technodel" },
    { key: "whatsapp_number", value: "+961XXXXXXXX" },
    { key: "delivery_fee_default", value: "2.5" },
    { key: "currency", value: "USD" },
  ];
  for (const s of defaults) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
  }
  console.log("✅ Default settings created");

  console.log("\n🎉 Seed complete! You can now login at /admin/login with galaxy / 301088");
}

main().catch(console.error).finally(() => prisma.$disconnect());
