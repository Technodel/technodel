# Technodel SEO & Backlinks Strategy for #1 Google Ranking 🇱🇧

---

## 1. SITEMAP SUBMISSION (Google Search Console)

### Step 1: Set up Google Search Console
1. Go to https://search.google.com/search-console
2. Add property: `https://technodel.net`
3. Verify ownership using DNS TXT record (recommended) or HTML file upload
4. Copy the verification code and set it in your `.env`:
   ```
   NEXT_PUBLIC_GOOGLE_VERIFICATION_ID="your_verification_string_here"
   ```

### Step 2: Submit Sitemap
1. In Search Console → Sitemaps → Add a new sitemap
2. Enter: `https://technodel.net/sitemap.xml`
3. Click Submit
4. Check back in 24-48 hours for indexed URLs

### Step 3: Monitor Performance
- Track impressions, clicks, CTR, and average position
- Identify which pages rank and which need improvement
- Check Core Web Vitals regularly

---

## 2. BACKLINKS STRATEGY

Backlinks are the #1 ranking factor. Here's a Lebanese-market focused strategy:

### TIER 1 — Lebanese Business Directories (FREE)
| Directory | URL | Action |
|-----------|-----|--------|
| Lebanon Business Guide | lebusinessguide.com | Submit your business |
| Daleel Lebanon | daleel.me | Add listing |
| Lebanon Yellow Pages | yellowpages.com.lb | Claim/create listing |
| Lebanese Business Network | lbn.com.lb | Register |
| Business Directory Lebanon | businessdirectory.com.lb | Submit |
| 961 Directory | 961.com.lb | List |
| Lebanese Companies | lebanesecompanies.com | Add company |
| Beirut.com Business | beirut.com/business | Submit |
| Lebweb | lebweb.com | Register |
| Wamda Lebanon | wamda.com | Submit startup profile |

### TIER 2 — Lebanese Tech Forums & Communities
| Platform | URL | Strategy |
|----------|-----|----------|
| Reddit r/lebanon | reddit.com/r/lebanon | Answer tech questions, link to relevant blog posts |
| Reddit r/LebaneseTech | reddit.com/r/lebanese | Share buying guides & deals (sparingly) |
| Lebanese PHP/Dev Groups | Facebook Groups | Join discussions about tech in Lebanon |
| Technicity Lebanon | instagram.com/technicitylb | Collaborate on tech content |
| Lebanese Tech Bloggers | various | Offer guest post exchanges |
| Lebanon in a Picture (LIAP) | facebook.com/LebanonInAPicture | Sponsored feature (small fee) |
| Beirut Tech Meetup | meetup.com | Offer to sponsor/speak |

### TIER 3 — Social Media Platforms
| Platform | Content Strategy |
|----------|-----------------|
| **Instagram** @technodel | Daily posts: product showcases, unboxing reels, customer testimonials |
| **Facebook** facebook.com/technodel | Weekly: blog posts, deals, community Q&A in Arabic & English |
| **WhatsApp Business** | Customer support, deal alerts to opted-in customers |
| **LinkedIn** | B2B content: bulk orders, corporate solutions |
| **YouTube** | Weekly: product reviews, unboxing, comparison videos (embed on blog) |
| **TikTok** | Short-form: unboxing, speed tests, "Lebanon's cheapest..." |

### TIER 4 — Strategic Partnerships
- **Local tech reviewers/influencers** — Send products for review → they link back
- **University partnerships** — Student discounts page → .edu backlinks
- **Lebanese tech podcasts** — Sponsor episodes → backlinks from show notes
- **Blogger outreach** — Pitch guest posts about "Tech Buying in Lebanon" on Lebanese blogs

### TIER 5 — Content That Earns Links
Create these high-link-asset pages:
- `/price-comparison` — Compare Technodel vs ayoub/ezone/comparts prices (updated daily)
- `/lebanon-tech-buying-guide-2026` — Ultimate guide (citizens & expats)
- `/best-laptops-lebanon/` — Location-specific landing pages
- `/lebanon-import-duties-calculator` — Tool that people will link to
- `/lebanon-tech-salaries-2026` — Viral data post

---

## 3. TECHNICAL SEO (Developer Tasks)

### Already Done ✅
- [x] Dynamic sitemap.xml with all products, categories, blog posts
- [x] robots.ts with proper rules
- [x] JSON-LD structured data (Organization, WebSite, Article, Product, FAQ, ContactPoint, BreadcrumbList)
- [x] hreflang tags for en/ar versions
- [x] OpenGraph + Twitter cards
- [x] Google Analytics 4 integration
- [x] SEO metadata per product (seoTitle, seoDescription from DB)
- [x] Canonical URLs on all pages
- [x] Strong page speed (ISR, lazy loading, CDN images)

### Still To Do ⬜
- [ ] Set real `NEXT_PUBLIC_GOOGLE_VERIFICATION_ID` in .env
- [ ] Set real `NEXT_PUBLIC_CONTACT_PHONE` in .env
- [ ] Set real `NEXT_PUBLIC_GA_ID` in .env (create GA4 property first)
- [ ] Set real `NEXT_PUBLIC_SITE_URL="https://technodel.net"` for production
- [ ] Generate /og-image.png (1200x630px with Technodel branding)
- [ ] Generate blog post images in /public/blog/
- [ ] Submit sitemap to Google + Bing Webmaster Tools

---

## 4. LOCAL SEO (Lebanon Focus)

1. **Google Business Profile** — Set up "Technodel" in Beirut, LB
   - Add: hours, phone, photos, products, posts
   - Get 5+ genuine Google reviews
2. **Google Maps** — Ensure accurate location pin
3. **Lebanon-specific keywords** in content:
   - "توصيل لبنان" (delivery Lebanon)
   - "أسعار الإلكترونيات في لبنان" (electronics prices in Lebanon)
   - "أرخص لابتوب في لبنان" (cheapest laptop in Lebanon)
   - "محل كمبيوتر بيروت" (computer shop Beirut)
4. **Schema markup** — Already have Organization with addressCountry: "LB"

---

## 5. MONTHLY SEO CHECKLIST

| Week | Task |
|------|------|
| 1 | Publish 2 new blog posts (Lebanese keywords) |
| 2 | Submit to 2 new directories/forums |
| 3 | Post 3 social media updates (link back to product/blog) |
| 4 | Check Search Console: impressions, clicks, fix indexing issues |

---

## 6. TRACKING PROGRESS

| Metric | Target | Tool |
|--------|--------|------|
| Google Indexed Pages | 100% of sitemap URLs | Google Search Console |
| Core Web Vitals | All GREEN | PageSpeed Insights |
| Backlinks | 20+ in 3 months | Ahrefs / Moz / Google Search Console |
| Domain Authority | 30+ in 6 months | Moz |
| Organic Traffic | 500+ visits/month in 3 months | Google Analytics |
| #1 Keyword | "technodel" (brand) | Google Search Console |
| Top 10 Keywords | "laptops lebanon", "phones lebanon", etc. | Google Search Console |
| CTR | >5% average | Google Search Console |
| Page Speed | <2s LCP, <0.1s FID/INP, <3s CLS | PageSpeed Insights |
