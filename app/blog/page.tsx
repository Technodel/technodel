import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Technodel Blog – Tech News, Reviews & Buying Guides Lebanon",
  description:
    "Stay updated with the latest tech news, product reviews, buying guides, and tips for laptops, smartphones, gaming, and accessories in Lebanon.",
  openGraph: {
    title: "Technodel Blog – Tech News & Reviews Lebanon",
    description: "Expert tech reviews, buying guides, and news for the Lebanese market.",
    url: "https://technodel.net/blog",
    siteName: "Technodel",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Technodel Blog – Tech News & Reviews Lebanon",
    description: "Expert tech reviews, buying guides, and news for the Lebanese market.",
  },
  alternates: { canonical: "https://technodel.net/blog" },
};

const posts = [
  {
    slug: "best-laptop-under-1000-lebanon",
    title: "Best Laptop Under $1000 in Lebanon 2026 – Top Budget Picks",
    excerpt: "Looking for the best laptop under $1000 in Lebanon? We compare the top budget laptops from Lenovo, HP, ASUS, Acer and Dell that deliver great performance without breaking the bank.",
    date: "2026-05-18",
    author: "Technodel Team",
    category: "Laptops",
    image: "/blog/budget-laptop.jpg",
    readTime: "7 min read",
  },
  {
    slug: "iphone-price-lebanon-2026",
    title: "iPhone 17 Pro Max Price in Lebanon 2026 – Full Guide",
    excerpt: "Complete guide to iPhone 17 Pro Max and iPhone 17 prices in Lebanon. Compare prices, check availability, and find the best deals on Apple's latest iPhones at Technodel.",
    date: "2026-05-16",
    author: "Technodel Team",
    category: "Smartphones",
    image: "/blog/iphone-price.jpg",
    readTime: "6 min read",
  },
  {
    slug: "budget-gaming-pc-build-lebanon",
    title: "Budget Gaming PC Build Guide for Lebanon 2026 – Under $800",
    excerpt: "Build a powerful gaming PC in Lebanon on a budget. Complete guide with parts, prices, and where to buy. From $500 entry-level to $800 mid-range gaming rigs.",
    date: "2026-05-14",
    author: "Technodel Team",
    category: "Gaming",
    image: "/blog/gaming-pc-build.jpg",
    readTime: "8 min read",
  },
  {
    slug: "best-printer-home-office-lebanon",
    title: "Best Printers for Home Office in Lebanon – 2026 Buying Guide",
    excerpt: "Find the best printer for your home office in Lebanon. Compare HP, Canon, Epson and Brother printers. Inkjet vs laser, all-in-one features, and best prices.",
    date: "2026-05-12",
    author: "Technodel Team",
    category: "Printers",
    image: "/blog/printer-guide.jpg",
    readTime: "7 min read",
  },
  {
    slug: "best-smartphones-under-500-lebanon",
    title: "Best Smartphones Under $500 in Lebanon – 2026 Top Picks",
    excerpt: "Looking for an affordable smartphone in Lebanon? We compare the best phones under $500 including Samsung Galaxy, Xiaomi, and Google Pixel. Great cameras, performance, and battery life.",
    date: "2026-05-08",
    author: "Technodel Team",
    category: "Smartphones",
    image: "/blog/smartphones-under500.jpg",
    readTime: "7 min read",
  },
  {
    slug: "macbook-price-lebanon-2026",
    title: "MacBook Air M4 & MacBook Pro M4 Price in Lebanon – 2026 Guide",
    excerpt: "Complete pricing guide for Apple MacBook Air M4 and MacBook Pro M4 in Lebanon. Compare models, specs, and find the best MacBook deals at Technodel.",
    date: "2026-05-06",
    author: "Technodel Team",
    category: "Laptops",
    image: "/blog/macbook-price.jpg",
    readTime: "6 min read",
  },
  {
    slug: "home-networking-setup-lebanon",
    title: "Complete Home Networking Setup Guide for Lebanon – 2026",
    excerpt: "Optimize your home network in Lebanon. Best routers, mesh WiFi systems, and networking gear from TP-Link, Asus, and Ubiquiti. Tips for fast, reliable internet throughout your home.",
    date: "2026-05-03",
    author: "Technodel Team",
    category: "Networking",
    image: "/blog/networking-setup.jpg",
    readTime: "7 min read",
  },
  {
    slug: "best-tablet-students-lebanon",
    title: "Best Tablets for Students in Lebanon – 2026 Buying Guide",
    excerpt: "Find the perfect tablet for school or university in Lebanon. Compare iPad, Samsung Galaxy Tab, and Huawei MatePad for note-taking, studying, and entertainment.",
    date: "2026-04-25",
    author: "Technodel Team",
    category: "Tablets",
    image: "/blog/tablet-students.jpg",
    readTime: "7 min read",
  },
  {
    slug: "best-gaming-chair-lebanon",
    title: "Best Gaming Chairs in Lebanon – 2026 Comfort & Style Guide",
    excerpt: "Find the perfect gaming chair in Lebanon. Compare top brands like DXRacer, Secretlab, Cougar and more. Ergonomic designs for long gaming sessions. Best prices at Technodel.",
    date: "2026-04-18",
    author: "Technodel Team",
    category: "Gaming",
    image: "/blog/gaming-chair.jpg",
    readTime: "7 min read",
  },
  {
    slug: "best-gaming-laptops-lebanon-2026",
    title: "Best Gaming Laptops in Lebanon 2026 – Ultimate Buying Guide",
    excerpt:
      "Looking for the best gaming laptop in Lebanon? We compare the top models from ASUS ROG, MSI, Lenovo Legion, and more. Find your perfect gaming machine at the best price.",
    date: "2026-05-15",
    author: "Technodel Team",
    category: "Gaming",
    image: "/blog/gaming-laptop-guide.jpg",
    readTime: "8 min read",
  },
  {
    slug: "laptop-buying-guide-lebanon-2026",
    title: "How to Choose the Perfect Laptop in Lebanon – 2026 Guide",
    excerpt:
      "Confused about which laptop to buy? Our comprehensive guide covers processors, RAM, storage, display, and budget tips for Lebanese shoppers.",
    date: "2026-05-10",
    author: "Technodel Team",
    category: "Laptops",
    image: "/blog/laptop-guide.jpg",
    readTime: "10 min read",
  },
  {
    slug: "iphone-vs-samsung-lebanon-2026",
    title: "iPhone vs Samsung Galaxy in Lebanon 2026 – Which is Better?",
    excerpt:
      "The ultimate comparison between iPhone 17 Pro Max and Samsung Galaxy S26 Ultra. Price, camera, performance, and where to buy in Lebanon.",
    date: "2026-05-05",
    author: "Technodel Team",
    category: "Smartphones",
    image: "/blog/iphone-vs-samsung.jpg",
    readTime: "7 min read",
  },
  {
    slug: "build-gaming-pc-lebanon-budget",
    title: "How to Build a Gaming PC in Lebanon on Any Budget",
    excerpt:
      "Step-by-step guide to building your own gaming PC in Lebanon. From budget builds under $800 to high-end rigs, with local pricing and availability.",
    date: "2026-04-28",
    author: "Technodel Team",
    category: "Gaming",
    image: "/blog/build-gaming-pc.jpg",
    readTime: "12 min read",
  },
  {
    slug: "tech-accessories-everyone-needs-2026",
    title: "10 Tech Accessories Every Lebanese Professional Needs in 2026",
    excerpt:
      "From wireless chargers to mechanical keyboards, discover the essential tech accessories that boost productivity and make life easier.",
    date: "2026-04-20",
    author: "Technodel Team",
    category: "Accessories",
    image: "/blog/tech-accessories.jpg",
    readTime: "6 min read",
  },
  {
    slug: "networking-guide-home-office-lebanon",
    title: "Complete Home Office Networking Guide for Lebanon",
    excerpt:
      "Optimize your home network with the best routers, mesh systems, and networking gear available in Lebanon. Tips for fast, reliable internet.",
    date: "2026-04-15",
    author: "Technodel Team",
    category: "Networking",
    image: "/blog/networking-guide.jpg",
    readTime: "9 min read",
  },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://technodel.net" },
    { "@type": "ListItem", position: 2, name: "Blog", item: "https://technodel.net/blog" },
  ],
};

const blogSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Technodel Blog",
  description: "Tech news, reviews and buying guides for Lebanon.",
  url: "https://technodel.net/blog",
};

export default function BlogPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />

      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
          <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              Technodel Blog
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Expert tech reviews, buying guides, and tips tailored for the Lebanese market.
              Stay informed before your next purchase.
            </p>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] transition-all duration-300 hover:border-accent/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-accent/5"
              >
                {/* Image placeholder */}
                <div className="aspect-[16/9] bg-gradient-to-br from-accent/10 via-white/5 to-accent/5 flex items-center justify-center overflow-hidden">
                  <div className="text-4xl opacity-30 group-hover:scale-110 transition-transform duration-500">
                    {post.category === "Gaming" ? "🎮" : post.category === "Laptops" ? "💻" : post.category === "Smartphones" ? "📱" : post.category === "Accessories" ? "🎧" : post.category === "Networking" ? "🌐" : "⚡"}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 text-xs text-white/40 mb-3">
                    <span className="px-2 py-1 rounded-md bg-accent/10 text-accent text-xs font-medium">
                      {post.category}
                    </span>
                    <span>{post.date}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h2 className="text-lg font-semibold text-white group-hover:text-accent transition-colors mb-2 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-white/50 line-clamp-3">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
