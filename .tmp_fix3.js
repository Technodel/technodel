const Database = require("better-sqlite3");
const src = new Database("D:/Projects/ALL-MALL/all-mall-mvp/dev.db", { readonly: true });
const target = new Database("prisma/prisma/dev.db");

const arr = [
  'https://pacmax.me/product/amazon-kindle-11th-gen-6-inch16gb-usb-c-black',
  'https://pacmax.me/product/amazon-kindle-scribe-w-premium-pen-tungsten-16gb',
  'https://pacmax.me/product/apple-studio-display-27-inch-5k-retina-standard-glass-tilt-height-adjustable-stand/'
];

for(const a of arr) {
    const s = src.prepare("SELECT imageUrls FROM Product WHERE sourceUrl=?").get(a);
    if(s) {
        console.log("Found for", a, ":", s.imageUrls);
        target.prepare("UPDATE Product SET images = ? WHERE sourceUrl = ?").run(s.imageUrls, a);
    }
}
