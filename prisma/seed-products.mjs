/**
 * Seed script — Sample products with featured items, new arrivals, deals
 * Run: DATABASE_URL="file:./dev.db" node prisma/seed-products.mjs
 */
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

// Realistic Lebanese-market products with USD prices
const PRODUCTS = [
  // ─── SMARTPHONES ──────────────────────────────────────────────────────────────
  { cat: "smartphones", featured: true,  new: true,  deal: false, title: "iPhone 16 Pro Max 256GB — Natural Titanium",        price: 1299, compare: 1399, img: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-max-naturaltitanium-select",   brand: "Apple" },
  { cat: "smartphones", featured: true,  new: false, deal: true,  title: "Samsung Galaxy S25 Ultra 512GB",                    price: 1099, compare: 1299, img: "https://images.samsung.com/is/image/samsung/p6pim/au/2501/gallery/au-galaxy-s25-s938-509434-sm-s938bztgxsa-542235247", brand: "Samsung" },
  { cat: "smartphones", featured: false, new: true,  deal: false, title: "Xiaomi 14T Pro 512GB",                              price: 699,  compare: 799,  img: "https://i01.appmifile.com/webfile/globalimg/zh-c/20240924-14TPro-banner",                    brand: "Xiaomi" },
  { cat: "smartphones", featured: false, new: false, deal: false, title: "Google Pixel 9 Pro 128GB",                          price: 899,  compare: 0,    img: "https://storage.googleapis.com/pixel-devices/pixel9-pro-obsidian",                             brand: "Google" },
  { cat: "smartphones", featured: false, new: false, deal: true,  title: "Nothing Phone (3) 256GB",                           price: 549,  compare: 649,  img: "https://nothing.tech/cdn/shop/files/phone3-black",                                   brand: "Nothing" },
  { cat: "smartphones", featured: false, new: false, deal: false, title: "OnePlus 13 512GB",                                  price: 849,  compare: 0,    img: "https://image01.oneplus.net/oneplus-one/202501/13",                                      brand: "OnePlus" },
  { cat: "smartphones", featured: false, new: false, deal: false, title: "Huawei Mate 60 Pro 256GB",                          price: 799,  compare: 0,    img: "https://consumer-img.huawei.com/mate60-pro-black",                                        brand: "Huawei" },

  // ─── LAPTOPS ──────────────────────────────────────────────────────────────────
  { cat: "laptops", featured: true,  new: true,  deal: false, title: 'MacBook Pro 16" M4 Max 48GB / 1TB',                    price: 3499, compare: 3999, img: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp16-m4-max-silver",        brand: "Apple" },
  { cat: "laptops", featured: true,  new: false, deal: true,  title: 'ASUS ROG Zephyrus G16 2025 — RTX 5080',                price: 2499, compare: 2899, img: "https://dlcdnwebimgs.asus.com/galleries/g16-2025-hero",                                 brand: "ASUS" },
  { cat: "laptops", featured: false, new: true,  deal: false, title: "Lenovo ThinkPad X1 Carbon Gen 13",                     price: 1899, compare: 2199, img: "https://p1-ofp.static.pub/lenovo/thinkpad-x1-carbon-gen13",                              brand: "Lenovo" },
  { cat: "laptops", featured: false, new: false, deal: false, title: "Dell XPS 16 2025 — Intel Ultra 9",                     price: 2199, compare: 0,    img: "https://i.dell.com/dell-xps-16-2025-hero",                                              brand: "Dell" },
  { cat: "laptops", featured: false, new: false, deal: true,  title: "HP Spectre x360 16 — 2-in-1 OLED",                     price: 1599, compare: 1849, img: "https://www.hp.com/cdn/shop/spectre-x360-16-hero",                                      brand: "HP" },
  { cat: "laptops", featured: false, new: false, deal: false, title: "Microsoft Surface Laptop 7 — Snapdragon X Elite",       price: 1299, compare: 0,    img: "https://img-prod-cf-ms.microsoft.com/surface-laptop-7-sapphire",                             brand: "Microsoft" },

  // ─── GAMING ───────────────────────────────────────────────────────────────────
  { cat: "gaming", featured: true,  new: true,  deal: false, title: "PlayStation 5 Pro — 2TB Digital Edition",              price: 799,  compare: 0,    img: "https://gmedia.playstation.com/ps5-pro-hero",                                            brand: "Sony" },
  { cat: "gaming", featured: false, new: false, deal: true,  title: "Nintendo Switch 2 — Launch Edition",                   price: 449,  compare: 499,  img: "https://nintendo.com/cdn/switch2-hero",                                                brand: "Nintendo" },
  { cat: "gaming", featured: false, new: false, deal: false, title: "Xbox Series X 2TB Galaxy Black",                       price: 599,  compare: 0,    img: "https://img.xbox.com/series-x-galaxy-black",                                               brand: "Microsoft" },
  { cat: "gaming", featured: false, new: false, deal: false, title: "Steam Deck OLED 1TB",                                  price: 649,  compare: 0,    img: "https://steamdeck.com/cdn/oled-1tb",                                                       brand: "Valve" },
  { cat: "gaming", featured: false, new: true,  deal: false, title: "ASUS ROG Ally X — Z1 Extreme 80Wh",                    price: 799,  compare: 0,    img: "https://dlcdnwebimgs.asus.com/rog-ally-x-hero",                                            brand: "ASUS" },

  // ─── AUDIO ─────────────────────────────────────────────────────────────────────
  { cat: "audio", featured: true,  new: false, deal: true,  title: "AirPods Max 2 — USB-C + 5 Colors",                     price: 549,  compare: 629,  img: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airpods-max-2",            brand: "Apple" },
  { cat: "audio", featured: false, new: true,  deal: false, title: "Sony WH-1000XM6 — Noise Cancelling",                    price: 399,  compare: 0,    img: "https://www.sony.com/image/wh-1000xm6-hero",                                                brand: "Sony" },
  { cat: "audio", featured: false, new: false, deal: false, title: "Bose QuietComfort Ultra Earbuds",                       price: 299,  compare: 0,    img: "https://assets.bose.com/bose-qc-ultra-earbuds",                                             brand: "Bose" },
  { cat: "audio", featured: false, new: false, deal: true,  title: "Samsung Galaxy Buds3 Pro",                              price: 199,  compare: 249,  img: "https://images.samsung.com/galaxy-buds3-pro-silver",                                        brand: "Samsung" },
  { cat: "audio", featured: false, new: false, deal: false, title: "JBL PartyBox 310 — Portable Party Speaker",             price: 449,  compare: 0,    img: "https://www.jbl.com/cdn/partybox310-hero",                                                  brand: "JBL" },

  // ─── TABLETS ──────────────────────────────────────────────────────────────────
  { cat: "tablets", featured: true,  new: true,  deal: false, title: 'iPad Pro 13" M4 — 1TB Wi-Fi + Cellular',              price: 1899, compare: 2099, img: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-13-m4",           brand: "Apple" },
  { cat: "tablets", featured: false, new: false, deal: true,  title: "Samsung Galaxy Tab S10 Ultra 512GB",                   price: 1099, compare: 1299, img: "https://images.samsung.com/galaxy-tab-s10-ultra",                                           brand: "Samsung" },
  { cat: "tablets", featured: false, new: false, deal: false, title: "iPad Air 11\" M3 — 256GB",                             price: 749,  compare: 0,    img: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-air-11-m3",          brand: "Apple" },
  { cat: "tablets", featured: false, new: false, deal: false, title: "Amazon Fire Max 11 — 128GB + Keyboard Case",           price: 279,  compare: 0,    img: "https://m.media-amazon.com/images/fire-max-11",                                              brand: "Amazon" },

  // ─── ACCESSORIES ──────────────────────────────────────────────────────────────
  { cat: "accessories", featured: false, new: true,  deal: false, title: "Apple Magic Keyboard — USB-C (2025)",              price: 349,  compare: 0,    img: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/magic-keyboard-usbc",    brand: "Apple" },
  { cat: "accessories", featured: false, new: false, deal: true,  title: "Logitech MX Master 3S — Wireless Mouse",           price: 89,   compare: 109,  img: "https://www.logitech.com/cdn/mx-master-3s",                                               brand: "Logitech" },
  { cat: "accessories", featured: false, new: false, deal: false, title: "Anker Prime 240W GaN Charger",                      price: 79,   compare: 0,    img: "https://www.anker.com/cdn/prime-240w-gan",                                                   brand: "Anker" },
  { cat: "accessories", featured: false, new: false, deal: false, title: "Apple AirTag 4-Pack",                               price: 89,   compare: 0,    img: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airtag-4pack",           brand: "Apple" },

  // ─── WEARABLES ────────────────────────────────────────────────────────────────
  { cat: "wearables", featured: false, new: true,  deal: false, title: "Apple Watch Ultra 3 — 49mm Titanium",                price: 899,  compare: 0,    img: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-ultra-3",          brand: "Apple" },
  { cat: "wearables", featured: false, new: false, deal: false, title: "Samsung Galaxy Watch 7 Ultra",                       price: 649,  compare: 0,    img: "https://images.samsung.com/galaxy-watch-7-ultra",                                             brand: "Samsung" },
  { cat: "wearables", featured: false, new: true,  deal: false, title: "Whoop 5.0 — Fitness Band (12mo subscription)",       price: 399,  compare: 0,    img: "https://www.whoop.com/cdn/whoop-5-hero",                                                      brand: "Whoop" },

  // ─── STORAGE ──────────────────────────────────────────────────────────────────
  { cat: "storage", featured: false, new: false, deal: true,  title: "Samsung 990 EVO Plus 2TB NVMe SSD",                   price: 149,  compare: 189,  img: "https://images.samsung.com/990-evo-plus-2tb",                                               brand: "Samsung" },
  { cat: "storage", featured: false, new: true,  deal: false, title: "WD Black SN860 4TB NVMe SSD",                          price: 299,  compare: 0,    img: "https://www.westerndigital.com/cdn/sn860-4tb",                                                brand: "WD" },
  { cat: "storage", featured: false, new: false, deal: false, title: "SanDisk Extreme Pro 2TB Portable SSD",                  price: 179,  compare: 0,    img: "https://www.sandisk.com/cdn/extreme-pro-2tb",                                                 brand: "SanDisk" },

  // ─── NETWORKING ───────────────────────────────────────────────────────────────
  { cat: "networking", featured: false, new: true,  deal: false, title: "TP-Link Deco BE95 — WiFi 7 Mesh (3-pack)",          price: 599,  compare: 0,    img: "https://www.tp-link.com/cdn/deco-be95",                                                       brand: "TP-Link" },
  { cat: "networking", featured: false, new: false, deal: false, title: "Ubiquiti UniFi 7 Pro — WiFi 7 AP",                  price: 279,  compare: 0,    img: "https://dl.ubnt.com/unifi-7-pro",                                                              brand: "Ubiquiti" },
  { cat: "networking", featured: false, new: false, deal: true,  title: "ASUS RT-BE96U — WiFi 7 Gaming Router",              price: 449,  compare: 529,  img: "https://dlcdnwebimgs.asus.com/rt-be96u-hero",                                                brand: "ASUS" },

  // ─── CAMERAS ──────────────────────────────────────────────────────────────────
  { cat: "cameras", featured: false, new: false, deal: false, title: "Sony α1 II — 50MP Full-Frame Mirrorless",             price: 5499, compare: 0,    img: "https://www.sony.com/image/alpha1-ii-hero",                                                   brand: "Sony" },
  { cat: "cameras", featured: false, new: true,  deal: true,  title: "Canon EOS R5 Mark II — 45MP 8K",                      price: 4299, compare: 4799, img: "https://www.canon.com/cdn/eos-r5-mk2",                                                       brand: "Canon" },
  { cat: "cameras", featured: false, new: false, deal: false, title: "DJI Osmo Pocket 3 — 4K120 Vlogging Camera",            price: 519,  compare: 0,    img: "https://www.dji.com/cdn/osmo-pocket-3",                                                        brand: "DJI" },

  // ─── PRINTERS ─────────────────────────────────────────────────────────────────
  { cat: "printers", featured: false, new: false, deal: false, title: "HP LaserJet M209dwe — Auto Duplex",                  price: 229,  compare: 0,    img: "https://www.hp.com/cdn/laserjet-m209dwe",                                                      brand: "HP" },
  { cat: "printers", featured: false, new: false, deal: false, title: "Epson EcoTank ET-5850 — All-in-One",                  price: 699,  compare: 0,    img: "https://www.epson.com/cdn/et-5850-hero",                                                       brand: "Epson" },

  // ─── SMART HOME ───────────────────────────────────────────────────────────────
  { cat: "smart-home", featured: false, new: true,  deal: false, title: "Amazon Echo Show 21 — Smart Display",               price: 399,  compare: 0,    img: "https://m.media-amazon.com/images/echo-show-21",                                               brand: "Amazon" },
  { cat: "smart-home", featured: false, new: false, deal: true,  title: "Google Nest Hub Max 2 — 10\" Smart Display",         price: 179,  compare: 229,  img: "https://storage.googleapis.com/nest-hub-max-2",                                                brand: "Google" },
  { cat: "smart-home", featured: false, new: true,  deal: false, title: "Philips Hue Play Gradient Lightstrip 2m",            price: 149,  compare: 0,    img: "https://www.philips-hue.com/cdn/gradient-lightstrip",                                          brand: "Philips" },
];

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 100);
}

async function main() {
  console.log("🌱 Seeding sample products...\n");

  const categories = await prisma.category.findMany();
  const catMap = {};
  for (const c of categories) catMap[c.slug] = c.id;

  let created = 0;
  let skipped = 0;
  let featuredCount = 0;
  let dealCount = 0;

  for (const p of PRODUCTS) {
    const catId = catMap[p.cat];
    if (!catId) {
      console.log(`  ⚠️  Category "${p.cat}" not found — skipping "${p.title}"`);
      skipped++;
      continue;
    }

    const slug = slugify(p.title);

    // Check if already exists
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      console.log(`  ➖ Already exists: ${p.title}`);
      skipped++;
      continue;
    }

    await prisma.product.create({
      data: {
        slug,
        sku: `TN-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
        title: p.title,
        shortDescription: `${p.brand} ${p.title} — Available at Technodel Lebanon. Best price guaranteed.`,
        description: `<h2>${p.title}</h2><p>Experience the ultimate in technology with the ${p.title}. Available now at Technodel — Lebanon's trusted tech destination. Fast shipping across all Lebanon. Official warranty included.</p><ul><li>Official Lebanese warranty</li><li>Free delivery in Beirut</li><li>Cash on delivery available</li><li>Price match guarantee</li></ul>`,
        highlights: JSON.stringify(["Official warranty", "Free delivery Beirut", "Price match", "Cash on delivery"]),
        displayPrice: p.price,
        comparePrice: p.compare > 0 ? p.compare : null,
        currency: "USD",
        images: JSON.stringify([p.img]),
        categoryId: catId,
        brand: p.brand,
        isVisible: true,
        isFeatured: p.featured,
        featuredOrder: p.featured ? (featuredCount + 1) * 10 : 0,
        isNew: p.new,
        stock: Math.floor(Math.random() * 50) + 5,
        rating: +(3.5 + Math.random() * 1.5).toFixed(1),
        reviewCount: Math.floor(Math.random() * 120) + 3,
      },
    });

    if (p.featured) featuredCount++;
    if (p.deal) dealCount++;
    created++;
    process.stdout.write("  ✅ " + p.title + "\n");
  }

  // Create Banners for deals
  const bannerData = PRODUCTS.filter(p => p.deal).slice(0, 5).map((p, i) => ({
    title: `🔥 Deal: ${p.title}`,
    subtitle: `${p.brand} — Save $${(p.compare - p.price)}!`,
    imageUrl: p.img,
    linkUrl: `/product/${slugify(p.title)}`,
    isActive: true,
    sortOrder: (i + 1) * 10,
  }));

  for (const b of bannerData) {
    await prisma.banner.upsert({
      where: { id: `banner-deal-${slugify(b.title).substring(0, 40)}` },
      update: {},
      create: { id: `banner-deal-${slugify(b.title).substring(0, 40)}`, ...b },
    });
  }

  console.log(`\n📊 Summary:`);
  console.log(`  ✅ ${created} products created`);
  console.log(`  ➖ ${skipped} skipped (already exist)`);
  console.log(`  ⭐ ${featuredCount} featured products`);
  console.log(`  🔥 ${dealCount} deals`);
  console.log(`  🆕 ${PRODUCTS.filter(p => p.new).length} new arrivals`);
  console.log(`  📢 ${bannerData.length} deal banners created`);
  console.log(`\n🎉 Done! Visit /shop to see products.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
