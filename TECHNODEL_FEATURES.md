# Technodel.net — Complete Feature Documentation

> **Technodel** is Lebanon's revolutionary e-commerce platform for tech products — built with Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, Prisma 6, and Framer Motion 12.

---

## 1. 🏗️ Architecture & Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.2.6 |
| **UI Library** | React | 19.2.4 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | v4 |
| **Database** | SQLite via Prisma | 6.19.3 |
| **State Management** | Zustand (persisted) | 5.0.13 |
| **Animations** | Framer Motion | 12.39.0 |
| **Scraping** | Cheerio + Puppeteer | latest |
| **Auth** | JWT (jose) + bcryptjs | latest |

---

## 2. 🎨 Design System & UX

### Dual Theme System
- **Dark Mode** — Premium midnight theme (#040b14 base) with cyan/blue accents
- **BestBuy Mode** — Light theme inspired by Best Buy's white/blue design
- Persisted via Zustand (`tn-theme` localStorage)

### Animation System (`lib/animations.ts`)
- **20+ reusable Framer Motion variants**: fadeIn, fadeInUp, fadeInDown, fadeInLeft, fadeInRight, scaleIn, slideUp, slideDown, slideInLeft, slideInRight
- **Stagger animations** for grid layouts (fast/slow)
- **Spring physics** (bouncy/smooth) for natural-feeling interactions
- **Optimized transitions** with custom cubic-bezier curves

### Typography
- Inter font via Next.js font optimization (`next/font/google`)
- CSS variable system: `--font-inter`
- Responsive text scale with Tailwind

### Images (`components/ui/OptimizedImage.tsx`)
- Custom `OptimizedImage` component (cannot use Next.js Image directly)
- Lazy loading with blur placeholder
- WebP/AVIF format support
- CDN-aware image handling

---

## 3. 🧭 Page Structure & Routes

| Route | Page | Features |
|-------|------|----------|
| `/` | Home | Featured products, hero banners, category grid, new arrivals |
| `/shop` | Shop All | Product listing with filters, category sidebar, pagination |
| `/shop/[category]` | Category | Filtered by category slug |
| `/product/[slug]` | Product Detail | Gallery, specs, competitor pricing, wishlist, cart, variants |
| `/search` | Search | Full-text search with filters |
| `/deals` | Deals | Discounted/featured products |
| `/cart` | Cart | Quantity management, currency toggle, checkout |
| `/checkout` | Checkout | Guest checkout, address, payment method selection |
| `/account` | Account | Profile, order history, wishlist management |
| `/account/orders` | Orders | Order history with status tracking |
| `/account/wishlist` | Wishlist | Saved products |

### Admin Routes
| Route | Page | Features |
|-------|------|----------|
| `/admin` | Dashboard | Analytics, order stats, product counts |
| `/admin/products` | Products | CRUD, visibility toggle, featured toggle |
| `/admin/categories` | Categories | Manage hierarchy, visibility, SEO fields |
| `/admin/orders` | Orders | View/manage all orders |
| `/admin/users` | Users | Customer management |
| `/admin/banners` | Banners | Hero banner management |
| `/admin/competitors` | Competitors | Track competitor stores & pricing |
| `/admin/delivery` | Delivery Zones | Zone-based delivery fees |
| `/admin/settings` | Settings | Site configuration |
| `/admin/tools` | Tools | Scraping, import, maintenance |
| `/admin/login` | Admin Auth | Secure admin access |

### API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/*` | POST | Login, register, session management |
| `/api/products` | GET/POST | Product listing & creation |
| `/api/products/[id]` | PUT/DELETE | Product management |
| `/api/orders` | GET/POST | Order listing & creation |
| `/api/search` | GET | Full-text search |
| `/api/wishlist` | GET/POST/DELETE | Wishlist management |
| `/api/rewards` | GET | Reward points |
| `/api/delivery` | GET | Delivery zone & fee calculation |

---

## 4. 🔐 Authentication & User System

### Features
- **JWT-based authentication** using `jose` library
- **Password hashing** with bcryptjs
- **Session management** via Zustand persisted store
- **Role-based access** — `customer` and `admin` roles
- **Guest checkout** — no account required to purchase

### User Store (`store/auth.ts`)
- Persisted login state
- Register/login/logout actions
- Fetch user profile
- Auto-restore session on page load

### Admin Auth
- Separate admin login page
- Admin middleware protection (can be added)
- Admin shell layout with sidebar navigation

---

## 5. 🛒 E-Commerce Core

### Product System (`prisma/schema.prisma`)
- **Product model** with 30+ fields:
  - Slug, SKU (both unique)
  - Title, short description, full description
  - SEO fields (title, description, keywords)
  - Pricing: costPrice, sourcePrice, displayPrice, comparePrice
  - Images (JSON array), video URL, OG image
  - Brand, attributes, specs (JSON)
  - Source tracking (sourceUrl, sourceId, competitorId)
  - Stock management (stock, lowStockThresh)
  - Featured, new-arrival flags
  - View/order count tracking

### Variants (`model Variant`)
- Multi-option product variants (size, color, etc.)
- Price adjustment per variant
- Stock tracking per variant
- Independent SKU per variant
- Image override per variant

### Cart System (`store/cart.ts`)
- Zustand persisted cart
- Add/remove/update/clear operations
- Quantity management
- Product + variant support
- LocalStorage persistence
- Cart total calculation

### Checkout (`/checkout`)
- **Guest checkout** — name, phone, email
- **Address capture** — area, street, building
- **Payment methods:**
  - Cash on Delivery
  - Wish Money
  - WhatsApp Order (auto-generates WhatsApp message)
- **Delivery fee** calculation based on zone
- **Reward points** usage option
- **Order confirmation** with order number

### Order System
- Unique order number generation
- Order status tracking (pending → confirmed → shipped → delivered)
- Payment status tracking
- WhatsApp notification integration
- Order history per user

### Wishlist (`store/wishlist.ts`)
- Add/remove products
- Check if item is wishlisted
- Wishlist count badge in header
- Persisted via Zustand + API sync

### Rewards / Loyalty Points
- Points accrual per order
- Points redemption at checkout
- Reward log tracking
- Tier system foundation (bronze/silver/gold/platinum)

---

## 6. 💱 Dual Currency System

### Currency Store (`store/currency.ts`)
- **USD / LBP** toggle
- LBP rate: **89,500 LBP = 1 USD** (configurable)
- `format(usdPrice)` — returns formatted string (`$19.99` or `1,789,005 LBP`)
- `convert(usdPrice)` — returns numeric value in selected currency
- Persisted to localStorage (`tn-currency`)

### Implementation
- All prices stored in USD (base currency)
- Conversion happens at render time via Zustand store
- Real-time price display update on toggle — no page reload
- LBP uses `toLocaleString('en-US')` for proper comma formatting

---

## 7. 🎯 SEO & Performance

### SEO Implementation
- **Metadata API** — per-page SEO titles, descriptions
- **JSON-LD structured data** — Organization + WebSite schema in root layout
- **Open Graph** — og:title, og:description, og:image, og:url
- **Twitter Cards** — summary_large_image format
- **Canonical URLs** — prevent duplicate content
- **Semantic HTML** — proper heading hierarchy (`<h1>`, `<h2>`)
- **Product schema** — individual product JSON-LD on detail pages
- **Breadcrumbs** — category hierarchy on product/shop pages
- **Sitemap generation** — for search engine crawling

### Performance Optimizations
- **Next.js 16 App Router** — automatic code splitting & server components
- **ISR (Incremental Static Regeneration)** — `revalidate: 300` on home page
- **Image optimization** — WebP/AVIF formats, lazy loading, remote patterns
- **CSS optimization** — `experimental.optimizeCss: true`
- **Scroll restoration** — preserves scroll position on back navigation
- **Console removal** in production (excludes error/warn)
- **Aggressive caching headers**:
  - Images: `max-age=31536000, immutable` (1 year)
  - Static assets: `max-age=31536000, immutable` (1 year)
- **Gzip/Brotli compression** ready (via VPS/infrastructure layer)

### Next.js Config Highlights (`next.config.ts`)
```ts
images: {
  remotePatterns: [{ protocol: "https", hostname: "**" }],
  formats: ["image/webp", "image/avif"],
  deviceSizes: [480, 640, 768, 1024, 1280, 1536, 1920],
  minimumCacheTTL: 86400, // 24 hours
}
```

---

## 8. 📦 Competitor Price Tracking

### Competitor Model
- Full competitor store configuration (name, URL, platform, currency)
- Markup formula: percent-based or flat-fee
- Scrape method: cheerio or puppeteer
- Auto price calculation: `displayPrice = sourcePrice × (1 + markupPct/100) × VAT`

### Scraper System (`lib/scraper.ts`)
- **Multi-platform support:** WooCommerce, Shopify, BigCommerce, Magento, generic
- **Platform auto-detection** from URL/HTML
- **Product scraping:** title, price, images, description, brand, category
- **Sitemap parsing** for batch URL discovery
- **Category page scanning** for bulk product discovery
- **Competitor pricing** — stores competitor price per product for comparison display

### Competitor Products
- Per-product competitor price snapshots
- Status tracking (pending, matched, unmatched, error)
- Scanned-at timestamp for freshness tracking
- Clone product relationship

---

## 9. 🧩 Components Library

### Layout Components (`components/layout/`)
| Component | Purpose |
|-----------|---------|
| `AppShell` | Main layout wrapper with header + footer |
| `Header` | Navigation, search bar, cart/wishlist badges, currency toggle |
| `Footer` | Links, social, contact info |
| `SearchBar` | Animated search with suggestions |
| `ThemeProvider` | Dark/BestBuy theme context provider |

### UI Components (`components/ui/`)
| Component | Purpose |
|-----------|---------|
| `ProductCard` | Product grid card with image, price, wishlist button |
| `OptimizedImage` | Lazy-loaded image with placeholder |
| `AnimatedSection` | Framer Motion staggered animation wrapper |
| `DeliveryPicker` | Zone selection for delivery fee calculation |

### Admin Components (`components/admin/`)
| Component | Purpose |
|-----------|---------|
| `AdminLayoutShell` | Admin dashboard layout |
| `AdminSidebar` | Navigation sidebar |
| `ProductForm` | Product CRUD form |
| `BannersClient` | Banner management UI |
| `DeliveryZonesClient` | Zone management UI |
| `SettingsTabsClient` | Settings configuration |
| `UsersClient` | User management |

---

## 10. 🧪 SEO Enricher (`lib/seo-enricher.ts`)

Automatically enriches products with:
- SEO-optimized titles
- Meta descriptions
- Focus keywords
- Brand detection
- Category relevance scoring

---

## 11. 🚀 Deployment & Infrastructure

### VPS Deployment
- Next.js standalone output
- PM2 process manager
- Reverse proxy (Nginx/Traefik) support
- SSL certificate configuration
- Environment-specific configs

### Database
- SQLite (Prisma 6)
- Easy backup/restore scripts
- Migration system

---

## 12. 🛡️ Security

- **Password hashing** — bcryptjs with salt rounds
- **JWT tokens** — jose library for secure session management
- **Input validation** — Prisma parameterized queries prevent SQL injection
- **XSS prevention** — React's automatic escaping
- **Console stripping** in production
- **Admin-only routes** with role checks

---

## 13. 📊 Dashboard & Analytics

- Product count by category
- Order statistics
- Featured product management
- Banner rotation (hero carousel)
- Delivery zone configuration
- Competitor management
- Settings panel

---

## 14. ⚡ Revolutionary Features (Lebanon-First)

| Feature | Why It's Revolutionary |
|---------|----------------------|
| **Dual Currency (USD/LBP)** | Real-time toggle, no page reload — first in Lebanese e-commerce |
| **Dark + BestBuy Theme** | Two complete design languages in one site |
| **Guest Checkout** | No account required — reduces cart abandonment |
| **WhatsApp Orders** | Auto-generated WhatsApp message for order placement |
| **Competitor Price Tracking** | Shows prices from ayoubcomputers.com, katranji.com, etc. |
| **Framer Motion Animations** | 20+ micro-interactions for premium feel |
| **Reward Points** | Customer loyalty program |
| **Delivery Zones** | Lebanon-specific area-based delivery with fees |
| **Admin Dashboard** | Full store management — banners, categories, competitors, orders |
| **SEO Enricher** | Auto-generated SEO metadata for each product |

---

## 15. 🔮 Roadmap / Planned Features

- [ ] Full-text search with FTS5/SQLite
- [ ] AI-powered product recommendations
- [ ] Multi-language support (English/Arabic)
- [ ] Payment gateway integration (credit cards, OMT, etc.)
- [ ] Order tracking (real-time delivery status)
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Advanced analytics dashboard
- [ ] B2B / wholesale pricing
- [ ] Inventory sync with physical store
- [ ] Review moderation system
- [ ] Auto-pricing engine (match/beat competitor prices)
- [ ] Bulk import from multiple Lebanese suppliers
- [ ] Automated SEO enrichment pipeline
- [ ] Sitemap auto-generation
- [ ] Google Shopping / Merchant Center feed

---

## 16. 🛠️ How to Run

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma generate
npx prisma db push

# Seeded categories
npm run seed

# Development
npm run dev        # → http://localhost:4040

# Production build
npm run build
npm start          # → http://localhost:4040
```

---

> **Last Updated:** May 2026
> **Version:** 0.1.0
