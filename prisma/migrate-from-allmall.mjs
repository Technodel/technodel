/**
 * Migrate products from ALL-MALL dev.db into Technodel database.
 * Maps ALL-MALL category names (text) to Technodel category slugs.
 * Filters out non-tech categories (grocery, food, beverages, etc.)
 * 
 * Run: DATABASE_URL="file:./dev.db" node prisma/migrate-from-allmall.mjs
 */
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { execSync } from "child_process";

const SRC_DB = "/var/www/all-mall/dev.db";

// ─── ALLOWED SUPPLIERS ────────────────────────────────────────────────────────
// Only import products from these 5 Lebanese tech suppliers.
// Matched against ALL-MALL's Site.url and Site.name (case-insensitive substring).
const ALLOWED_SITE_PATTERNS = ["ezone", "ayoub", "pacmax", "dslr", "jak"];

// DSLR restriction: never import laptops from DSLR.
const DSLR_SITE_PATTERN = "dslr";
const DSLR_EXCLUDED_CATEGORY_SLUG = "laptops";

// ─── STATIONERY / NON-TECH TITLE BLACKLIST ────────────────────────────────────
// Products whose titles contain any of these strings are NEVER imported,
// regardless of which category they appear in. This blocks Antoine Library
// copybooks, Molang notebooks, etc. from being treated as laptops.
const NON_TECH_TITLE_BLACKLIST = [
  "spiral notebook", "spiral-notebook", "copybook", "copy book",
  "ring binder", "exercise book", "sketchbook", "drawing book",
  "ruled notebook", "lined notebook", "composition book",
  "paper notebook", "stationery", "pencil case", "ballpoint pen",
  "highlighter pen", "marker pen", "sticky note", "post-it",
  "molang", "antoine library", "birthday card", "greeting card",
  "gift wrap",
];

function isNonTechProduct(title, displayPrice, mappedCategorySlug) {
  const t = (title || "").toLowerCase();
  if (NON_TECH_TITLE_BLACKLIST.some((kw) => t.includes(kw))) return true;
  // Paper notebooks priced as "laptops" ($30 or less)
  if (mappedCategorySlug === "laptops" && displayPrice <= 30) return true;
  return false;
}

// ─── CATEGORY MAPPING ──────────────────────────────────────────────────────────
// Maps ALL-MALL category name (case-insensitive) → Technodel category slug
const CATEGORY_MAP = {
  // Phones
  "phones": "smartphones",
  "mobile": "smartphones",
  "mobiles & accessories": "smartphones",
  "mobile accessories": "accessories",
  "phone accessories": "accessories",
  "smartphones & tablets": "smartphones",
  "cellular & wifi antennas": "smartphones",
  "chargers & cables": "accessories",

  // Laptops
  "laptops": "laptops",
  "laptop accessories": "laptops",
  "laptops & computers": "laptops",
  "laptops & tabs": "laptops",
  "macbooks": "laptops",
  "gaming laptop": "laptops",
  "gaming laptops": "laptops",
  "business laptop": "laptops",
  "business laptops": "laptops",
  "2-in-1 laptop": "laptops",

  // Tablets
  "tablets": "tablets",
  "tablet computers": "tablets",
  "android ios tabs": "tablets",
  "ipads & tablets": "tablets",

  // Tablets
  "tablets": "tablets",
  "tablet computers": "tablets",
  "android ios tabs": "tablets",
  "ipads & tablets": "tablets",

  // Gaming
  "gaming": "gaming",
  "gaming & consoles": "gaming",
  "gaming consoles": "gaming",
  "gaming peripherals": "gaming",
  "gaming furniture": "gaming",
  "gaming motherboards": "gaming",
  "gaming pads": "gaming",
  "video game consoles": "gaming",
  "interactive family games": "gaming",
  "interactive gaming figures": "gaming",

  // Audio
  "audio": "audio",
  "headphones": "audio",
  "speakers": "audio",
  "speakers & sound": "audio",
  "earbuds": "audio",
  "headsets": "audio",
  "microphones": "audio",
  "pro audio accessories": "audio",
  "wireless microphone systems": "audio",
  "tv & sound systems": "audio",

  // Cameras
  "cameras": "cameras",
  "cameras & photography": "cameras",
  "cameras & lenses": "cameras",
  "digital cameras": "cameras",
  "instant cameras": "cameras",
  "action cameras": "cameras",
  "camcorder": "cameras",
  "camera accessories": "cameras",
  "camera gimbals": "cameras",
  "lens accessories": "cameras",
  "photography": "cameras",
  "photography accessories": "cameras",
  "tripods & support": "cameras",
  "photo printers": "printers",
  "photo accessories": "cameras",
  "lighting & studio": "cameras",
  "lighting & studio": "cameras",
  "drones": "cameras",
  "drones accessories": "cameras",

  // Printers
  "printers": "printers",
  "printers & scanners": "printers",
  "printers and scanners": "printers",
  "printers & supplies": "printers",
  "laser printers": "printers",
  "inkjet office printers": "printers",
  "inkjet cartridges": "printers",
  "label printers": "printers",
  "id card printer": "printers",
  "barcode reader": "printers",
  "pos & peripherals": "printers",
  "pos & calculators": "printers",
  "pos solutions": "printers",
  "pos terminals": "printers",
  "money counters": "printers",

  // Networking
  "networking": "networking",
  "networking & pbx": "networking",
  "wireless routers": "networking",
  "wireless access points": "networking",
  "network cards & adapters": "networking",
  "access control": "networking",
  "alarm & intrusion": "networking",
  "surveillance video": "networking",
  "video doorbell": "networking",
  "door ringer": "networking",
  "walkie talkie": "networking",
  "cellular & wifi antennas": "networking",

  // Smart Home
  "smart home": "smart-home",
  "smart home & iot": "smart-home",
  "smart home devices": "smart-home",
  "smart security": "smart-home",
  "alexa & google": "smart-home",
  "automation & control": "smart-home",
  "cameras & surveillance": "smart-home",
  "lighting": "smart-home",

  // Storage
  "storage": "storage",
  "storage & accessories": "storage",
  "external hard drives": "storage",
  "external storage": "storage",
  "internal storage": "storage",
  "hard drives": "storage",
  "hdd": "storage",
  "hdds": "storage",
  "ssd /nvme": "storage",
  "storage hdd ssd m2 nvme": "storage",
  "memory cards & accessories": "storage",
  "memory cards & accessories": "storage",

  // Accessories (computer/tech)
  "accessories": "accessories",
  "computer accessories": "accessories",
  "computer accessory sets": "accessories",
  "cables": "accessories",
  "adapters": "accessories",
  "keyboards": "accessories",
  "mice": "accessories",
  "mice & trackballs": "accessories",
  "monitors": "accessories",
  "monitor screens": "accessories",
  "computer monitors": "accessories",
  "portable monitors": "accessories",
  "desktops": "accessories",
  "desktops & pcs": "accessories",
  "desktop computers": "accessories",
  "desktop pc": "accessories",
  "brand new desktop pc": "accessories",
  "business desktop": "accessories",
  "desktops & servers": "accessories",
  "all-in-one computers": "accessories",
  "computer components": "accessories",
  "computer parts": "accessories",
  "processors": "accessories",
  "cpu": "accessories",
  "cpu coolers": "accessories",
  "graphics card": "accessories",
  "graphics cards": "accessories",
  "motherboards": "accessories",
  "memory": "accessories",
  "memory (ram)": "accessories",
  "ram": "accessories",
  "pc cases": "accessories",
  "pc components & cooling": "accessories",
  "pc cooling": "accessories",
  "power supplies": "accessories",
  "computer risers & stands": "accessories",
  "webcams": "accessories",
  "usb & hubs": "accessories",
  "computer cleaners": "accessories",
  "electronics cleaners": "accessories",
  "batteries & power accessories": "accessories",
  "batteries & power accessories": "accessories",
  "ups & power": "accessories",
  "ups accessories": "accessories",
  "wireless chargers": "accessories",
  "wireless mouse receivers": "accessories",
  "wireless presenters": "accessories",
  "stylus": "accessories",
  "stylus pens": "accessories",
  "drawing pads": "accessories",
  "graphics tablets": "accessories",
  "sketch tablets": "accessories",
  "selfie sticks": "accessories",
  "mobile accessories": "accessories",
  "phone accessories": "accessories",
  "apple accessories": "accessories",

  // Wearables
  "wearables": "wearables",
  "watches & jewelry": "wearables",
  "watches": "wearables",
  "body weight scales": "accessories",

  // Projectors & Displays
  "projectors": "accessories",
  "multimedia & projectors": "accessories",
  "tv & displays": "accessories",
  "tvs": "accessories",
  "tvs & smart panels": "accessories",
  "tv stands & mounts": "accessories",

  // Other tech
  "electronics": "accessories",
  "electronics & appliances": "accessories",
  "computer": "accessories",
  "computers & gear": "accessories",
  "software": "accessories",
  "kaspersky security": "accessories",
  "video conferencing": "accessories",
  "telephone & handy": "accessories",
  "handheld industrial": "accessories",
  "portable dvd players": "accessories",
  "safes": "accessories",
  "tools & hardware": "accessories",
  "screwdrivers": "accessories",
  "gadgets and tools": "accessories",
  "cinema accessories": "accessories",
  "film": "accessories",
  "office": "accessories",
  "office supplies": "accessories",
};

function normalizeCat(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9&]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(text) {
  if (!text) return "product-" + Date.now();
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 100) || "product";
}

// Global counter for sequential SK-format SKUs.
// Seeded from existing max SK number before migration starts.
let _skuCounter = 0;

function generateSku() {
  _skuCounter++;
  return `SK${String(_skuCounter).padStart(6, "0")}`;
}

// Run sqlite3 query and return rows as array of objects
function query(dbPath, sql) {
  const out = execSync(`sqlite3 -json "${dbPath}" "${sql}"`, {
    encoding: "utf-8",
    maxBuffer: 500 * 1024 * 1024,
  });
  return JSON.parse(out || "[]");
}

async function main() {
  console.log("=== ALL-MALL → Technodel Product Migration ===\n");

  // 1. Count source data
  const countResult = query(SRC_DB, "SELECT COUNT(*) as c FROM Product");
  const totalSrc = countResult[0]?.c || 0;
  console.log(`Source (ALL-MALL): ${totalSrc} products`);

  // 2. Get unique categories from source products (faster than scanning all products)
  const srcCats = query(
    SRC_DB,
    `SELECT DISTINCT category FROM Product WHERE category IS NOT NULL AND category != '' ORDER BY category`
  );
  console.log(`Source categories: ${srcCats.length}`);

  // 3. Connect to Technodel DB
  const dst = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL || "file:./dev.db" } },
  });

  // 4. Get existing Technodel categories by slug
  const existingCats = await dst.category.findMany();
  const catBySlug = {};
  for (const c of existingCats) catBySlug[c.slug] = c.id;
  console.log(`Technodel categories: ${existingCats.length}\n`);

  // 4.5. Resolve allowed supplier site IDs from ALL-MALL's Site table
  const allSites = query(SRC_DB, "SELECT id, name, url FROM Site");
  const allowedSiteIds = [];
  const dslrSiteIds = new Set();
  for (const site of allSites) {
    const urlLower = (site.url || "").toLowerCase();
    const nameLower = (site.name || "").toLowerCase();
    const isAllowed = ALLOWED_SITE_PATTERNS.some(
      (p) => urlLower.includes(p) || nameLower.includes(p)
    );
    if (isAllowed) {
      allowedSiteIds.push(`'${String(site.id).replace(/'/g, "''")}'`);
      if (urlLower.includes(DSLR_SITE_PATTERN) || nameLower.includes(DSLR_SITE_PATTERN)) {
        dslrSiteIds.add(site.id);
      }
    }
  }
  if (allowedSiteIds.length === 0) {
    console.error("ERROR: No matching supplier sites found in ALL-MALL's Site table. Check ALLOWED_SITE_PATTERNS.");
    process.exit(1);
  }
  const siteConditions = allowedSiteIds.join(",");
  console.log(`Allowed supplier sites: ${allowedSiteIds.length} (DSLR sites: ${dslrSiteIds.size})`);
  console.log(`  IDs: ${siteConditions}\n`);

  // 5. Build category ID mapping from name → Technodel category ID
  let mappedCount = 0;
  let unmappedCount = 0;
  const unmappedCategories = [];

  const catNameToId = {};
  for (const row of srcCats) {
    const normalized = normalizeCat(row.category);
    const targetSlug = CATEGORY_MAP[normalized];
    if (targetSlug && catBySlug[targetSlug]) {
      catNameToId[row.category] = catBySlug[targetSlug];
      mappedCount++;
    } else if (targetSlug) {
      // Category slug exists in map but not in DB (unlikely)
      unmappedCategories.push(row.category);
      unmappedCount++;
    } else {
      unmappedCategories.push(row.category);
      unmappedCount++;
    }
  }

  console.log(`Mapped: ${mappedCount} categories`);
  console.log(`Unmapped (will skip): ${unmappedCount} categories`);
  if (unmappedCount > 0) {
    console.log(`  First 10 unmapped: ${unmappedCategories.slice(0, 10).join(", ")}`);
  }
  console.log();

  // 6. Check existing products to avoid duplicates; also seed SKU counter
  const existingProducts = await dst.product.findMany({ select: { slug: true, sku: true } });
  const existingSlugs = new Set(existingProducts.map((p) => p.slug));
  console.log(`Existing products in Technodel: ${existingSlugs.size}\n`);

  // Seed _skuCounter from highest existing SK-format SKU to avoid collisions
  for (const p of existingProducts) {
    const m = /^SK(\d+)$/i.exec(p.sku || "");
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > _skuCounter) _skuCounter = n;
    }
  }
  console.log(`SKU counter seeded at ${_skuCounter} (next will be SK${String(_skuCounter + 1).padStart(6, "0")})\n`);

  // 7. Get total mapped products (fast count) — only from allowed suppliers
  const catConditions = Object.keys(catNameToId)
    .map((name) => `'${name.replace(/'/g, "''")}'`)
    .join(",");
  const countMapped = query(
    SRC_DB,
    `SELECT COUNT(*) as c FROM Product WHERE category IN (${catConditions}) AND siteId IN (${siteConditions})`
  );
  const totalMapped = countMapped[0]?.c || 0;
  console.log(`Products in mapped categories (allowed suppliers only): ~${totalMapped}\n`);

  // Show breakdown per allowed supplier site
  const siteBreakdown = query(
    SRC_DB,
    `SELECT s.name, s.url, COUNT(p.id) as c FROM Site s JOIN Product p ON p.siteId = s.id WHERE p.category IN (${catConditions}) AND p.siteId IN (${siteConditions}) GROUP BY s.id ORDER BY c DESC`
  );
  console.log("Tech products by allowed supplier:");
  for (const s of siteBreakdown) {
    console.log(`  ${s.name} (${s.url}): ${s.c} products`);
  }
  console.log();

  // 8. Stream from ALL-MALL in batches using LIMIT/OFFSET
  const BATCH_SIZE = 200;
  let offset = 0;
  let created = 0;
  let skipped = 0;
  let batchNum = 0;
  const totalBatches = Math.ceil(totalMapped / BATCH_SIZE);

  // We track SKUs to avoid duplicates
  const usedSkus = new Set();

  while (offset < totalMapped) {
    const rows = query(
      SRC_DB,
      `SELECT * FROM Product WHERE category IN (${catConditions}) AND siteId IN (${siteConditions}) ORDER BY id LIMIT ${BATCH_SIZE} OFFSET ${offset}`
    );

    batchNum++;
    process.stdout.write(
      `\r  Batch ${batchNum}/${totalBatches} (offset ${offset}, created ${created}, skipped ${skipped})...`
    );

    for (const row of rows) {
      // Generate unique slug
      let slug = slugify(row.title);
      if (row.sourceId) slug = slug + "-" + row.sourceId.substring(0, 10);
      if (existingSlugs.has(slug)) {
        slug = slug + "-" + Date.now() + Math.random().toString(36).substring(2, 6);
      }

      // Get category ID
      const categoryId = catNameToId[row.category];
      if (!categoryId) {
        skipped++;
        continue;
      }

      // DSLR restriction: skip laptops from DSLR supplier
      const mappedSlug = CATEGORY_MAP[normalizeCat(row.category)];
      if (dslrSiteIds.has(row.siteId) && mappedSlug === DSLR_EXCLUDED_CATEGORY_SLUG) {
        skipped++;
        continue;
      }

      // Stationery / non-tech products: block regardless of supplier
      if (isNonTechProduct(row.title, row.displayPrice || row.sourcePrice || 0, mappedSlug)) {
        skipped++;
        continue;
      }

      // Generate unique SKU
      let sku = generateSku();
      let skuAttempts = 0;
      while (usedSkus.has(sku) && skuAttempts < 10) {
        sku = generateSku();
        skuAttempts++;
      }
      usedSkus.add(sku);

      // Parse images
      let images = "[]";
      if (row.imageUrls) {
        try {
          const urls = row.imageUrls
            .split(/[,;|\n]/)
            .map((u) => u.trim())
            .filter((u) => u.startsWith("http"));
          // Limit to 5 images max
          images = JSON.stringify(urls.slice(0, 5));
        } catch {
          images = JSON.stringify(row.imageUrls.startsWith("http") ? [row.imageUrls] : []);
        }
      }

      const basePrice = row.displayPrice || row.sourcePrice || 0;
      const comparePrice = row.sourcePrice > basePrice ? row.sourcePrice : null;

      try {
        await dst.product.create({
          data: {
            slug,
            sku,
            title: row.title || "Untitled Product",
            shortDescription: `${row.brand ? row.brand + " " : ""}${row.title || ""} — Available at Technodel Lebanon with warranty.`,
            description: row.description || `<p>${row.title}</p><p>Available at Technodel Lebanon.</p>`,
            highlights: JSON.stringify(["Official Warranty", "Fast Delivery", "Best Price in Lebanon"]),
            displayPrice: basePrice,
            comparePrice: comparePrice,
            currency: row.currency || "USD",
            images: images,
            categoryId: categoryId,
            brand: row.brand || null,
            sourceId: row.sourceId || null,
            sourceUrl: row.sourceUrl || null,
            sourcePrice: row.sourcePrice || null,
            isVisible: true,
            isFeatured: false,
            isNew: true,
            stock: 999,
            rating: 0,
            reviewCount: 0,
          },
        });
        created++;
        existingSlugs.add(slug);
      } catch (err) {
        if (err.code === "P2002") {
          skipped++;
        } else {
          console.error(`\n  Error: ${err.message} for "${(row.title || "").substring(0, 40)}"`);
        }
      }
    }

    offset += BATCH_SIZE;
  }

  console.log(`\n\n=== Migration Complete ===`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
  const finalCount = await dst.product.count();
  console.log(`  Total in Technodel DB: ${finalCount}`);

  // Show per-category breakdown
  const perCat = await dst.product.groupBy({
    by: ["categoryId"],
    _count: true,
  });
  console.log(`\nPer-category breakdown:`);
  const catMap = {};
  for (const c of existingCats) catMap[c.id] = c.name;
  for (const pc of perCat.sort((a, b) => b._count - a._count)) {
    const name = catMap[pc.categoryId] || "Unknown";
    console.log(`  ${name}: ${pc._count}`);
  }

  await dst.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
