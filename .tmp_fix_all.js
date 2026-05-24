const Database = require("better-sqlite3");
const target = new Database("prisma/prisma/dev.db");

target.prepare(`UPDATE Product SET images='["https://pacmax.me/wp-content/uploads/2026/05/rs23cv-1.webp"]' WHERE title LIKE '%11th Gen 6-inch%'`).run();
target.prepare(`UPDATE Product SET images='["https://pacmax.me/wp-content/uploads/2026/05/g6g3uv095314011e-1.webp"]' WHERE title LIKE '%Scribe w/ Premium Pen, Tungsten 16GB%'`).run();
target.prepare(`UPDATE Product SET images='["https://pacmax.me/wp-content/uploads/2026/05/myjg3-2.webp"]' WHERE slug LIKE 'apple-studio-display-27%'`).run();
console.log("updated");
