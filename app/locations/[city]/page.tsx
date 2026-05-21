import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

interface Props { params: Promise<{ city: string }> }

const CITIES: Record<string, {
  name: string;
  nameAr: string;
  description: string;
  metaDesc: string;
  keywords: string[];
  phone: string;
  neighborhoods: string[];
}> = {
  beirut: {
    name: "Beirut",
    nameAr: "بيروت",
    description: "Beirut, the vibrant capital of Lebanon, is home to tech-savvy shoppers looking for the latest laptops, smartphones, gaming gear, and electronics. Technodel serves Beirut with fast delivery and the best prices on premium tech products.",
    metaDesc: "Shop laptops, smartphones, and gaming gear in Beirut, Lebanon. Best prices, fast delivery, and genuine products at Technodel. Buy tech in Beirut today!",
    keywords: ["computer store beirut", "tech shop beirut", "laptop store beirut", "buy laptop beirut", "smartphone shop beirut", "gaming store beirut", "electronics beirut", "computer shop beirut lebanon", "pc shop beirut", "beirut tech store"],
    phone: "+961-1-XXX-XXX",
    neighborhoods: ["Hamra", "Achrafieh", "Verdun", "Mar Mikhael", "Gemmayze", "Badaro", "Downtown Beirut", "Raouché", "Mazraa", "Sodeco"],
  },
  tripoli: {
    name: "Tripoli",
    nameAr: "طرابلس",
    description: "Tripoli, Lebanon's second-largest city, has a growing demand for quality computers, smartphones, and accessories. Technodel delivers the best tech products to Tripoli at unbeatable prices with fast, reliable shipping.",
    metaDesc: "Shop laptops, smartphones, and electronics in Tripoli, Lebanon. Best prices and fast delivery from Technodel. Your trusted computer store in Tripoli!",
    keywords: ["computer store tripoli", "tech shop tripoli", "laptop store tripoli", "buy laptop tripoli lebanon", "smartphone tripoli", "electronics tripoli lebanon", "computer shop north lebanon", "pc shop tripoli", "gaming store tripoli"],
    phone: "+961-6-XXX-XXX",
    neighborhoods: ["Azmi", "Al-Qobbeh", "Abu Samra", "Zahrieh", "Al-Mina", "Beddawi", "Tal", "Dam w Farz"],
  },
  jounieh: {
    name: "Jounieh",
    nameAr: "جونيه",
    description: "Jounieh and the Keserwan district are home to a thriving community of tech enthusiasts and professionals. Technodel offers fast delivery to Jounieh with the best selection of laptops, smartphones, and gaming PCs.",
    metaDesc: "Find the best tech deals in Jounieh, Lebanon. Laptops, smartphones, gaming gear and more at unbeatable prices. Fast delivery across Jounieh from Technodel!",
    keywords: ["computer store jounieh", "tech shop jounieh", "laptop store jounieh", "electronics jounieh", "keserwan computer shop", "buy laptop jounieh", "smartphone jounieh", "gaming store jounieh", "pc shop keserwan"],
    phone: "+961-9-XXX-XXX",
    neighborhoods: ["Kaslik", "Harat Sakhr", "Sarba", "Maameltein", "Zouk Mosbeh", "Tabarja", "Adonis", "Hbaline"],
  },
  saida: {
    name: "Saida",
    nameAr: "صيدا",
    description: "Saida (Sidon) in South Lebanon has a vibrant tech community. Technodel provides fast delivery of laptops, smartphones, and accessories to Saida with the best prices guaranteed.",
    metaDesc: "Shop tech in Saida, Lebanon. Laptops, smartphones, and gaming gear with fast delivery. Best prices in South Lebanon at Technodel!",
    keywords: ["computer store saida", "tech shop saida", "laptop store saida", "electronics saida lebanon", "buy laptop south lebanon", "smartphone saida", "sidon computer shop", "gaming store saida"],
    phone: "+961-7-XXX-XXX",
    neighborhoods: ["Old Saida", "Al-Hilaliyeh", "Al-Bustan", "Al-Qassamiye", "Mieh Mieh", "Abra", "Dahr el-Maghar"],
  },
  zahle: {
    name: "Zahle",
    nameAr: "زحلة",
    description: "Zahle, the capital of the Beqaa Valley, is a growing tech hub. Technodel delivers premium laptops, smartphones, and electronics to Zahle with fast shipping and competitive prices.",
    metaDesc: "Shop computers and electronics in Zahle, Lebanon. Best prices on laptops, smartphones, and gaming gear with delivery across the Beqaa Valley from Technodel!",
    keywords: ["computer store zahle", "tech shop zahle", "laptop store beqaa", "electronics zahle lebanon", "buy laptop beqaa valley", "smartphone zahle", "computer shop beqaa", "gaming store zahle"],
    phone: "+961-8-XXX-XXX",
    neighborhoods: ["Maallaqa", "Karak", "Hazerta", "Taanayel", "Qabb Elias", "Bar Elias", "Chtaura"],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const info = CITIES[city];
  if (!info) return { title: "Location Not Found" };

  const title = `Computer Store ${info.name} Lebanon – Laptops, Smartphones & Tech | Technodel`;
  const description = info.metaDesc;

  return {
    title,
    description,
    keywords: info.keywords.join(", "),
    alternates: { canonical: `https://technodel.net/new/locations/${city}` },
    openGraph: {
      title,
      description,
      url: `https://technodel.net/new/locations/${city}`,
      siteName: "Technodel",
      type: "website",
      locale: "en_US",
    },
  };
}

export default async function LocationPage({ params }: Props) {
  const { city } = await params;
  const info = CITIES[city];
  if (!info) notFound();

  // Fetch visible categories count for the page
  const categoryCount = await prisma.category.count({ where: { isVisible: true } }).catch(() => 0);
  const productCount = await prisma.product.count({ where: { isVisible: true } }).catch(() => 0);

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "ComputerStore",
    name: `Technodel ${info.name}`,
    url: `https://technodel.net/new/locations/${city}`,
    logo: "https://technodel.net/logo.png",
    image: "https://technodel.net/og-image.png",
    description: info.metaDesc,
    address: {
      "@type": "PostalAddress",
      addressLocality: info.name,
      addressCountry: "LB",
    },
    telephone: info.phone,
    priceRange: "$$",
    areaServed: { "@type": "City", name: info.name },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Tech Products",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Product", name: "Laptops", url: "https://technodel.net/new/shop/laptops" } },
        { "@type": "Offer", itemOffered: { "@type": "Product", name: "Smartphones", url: "https://technodel.net/new/shop/smartphones" } },
        { "@type": "Offer", itemOffered: { "@type": "Product", name: "Gaming PCs", url: "https://technodel.net/new/shop/gaming" } },
      ],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <article className="min-h-screen">
        {/* Hero */}
        <header className="relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
          <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-6">
              <span>📍</span>
              <span>Lebanon</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              Computer Store in <span className="grad-text">{info.name}</span>
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">{info.description}</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
              >
                Shop All Products →
              </Link>
              <Link
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "961XXXXXXXX"}?text=Hi%20Technodel%2C%20I%20need%20help%20from%20your%20${info.name}%20store`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
                Chat on WhatsApp
              </Link>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: `${productCount.toLocaleString()}+`, label: "Products Available", icon: "📦" },
              { value: `${categoryCount}+`, label: "Categories", icon: "📁" },
              { value: "Free", label: "Delivery Across Lebanon", icon: "🚚" },
              { value: "100%", label: "Genuine Products", icon: "✅" },
            ].map((stat) => (
              <div key={stat.label} className="p-6 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold grad-text">{stat.value}</div>
                <div className="text-sm text-white/40 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Shop by Category */}
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <h2 className="text-2xl font-bold mb-8">Shop by Category in {info.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { slug: "laptops", name: "Laptops", icon: "💻" },
              { slug: "smartphones", name: "Smartphones", icon: "📱" },
              { slug: "gaming", name: "Gaming", icon: "🎮" },
              { slug: "audio", name: "Audio", icon: "🎧" },
              { slug: "accessories", name: "Accessories", icon: "🔌" },
              { slug: "tablets", name: "Tablets", icon: "📋" },
              { slug: "networking", name: "Networking", icon: "🌐" },
              { slug: "printers", name: "Printers", icon: "🖨" },
            ].map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop/${cat.slug}`}
                className="p-6 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-accent/30 transition-all text-center group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{cat.icon}</div>
                <div className="text-sm font-medium">{cat.name}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Why Shop in {city} */}
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <h2 className="text-2xl font-bold mb-8">Why Shop at Technodel in {info.name}?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Fast Delivery to Every Neighborhood", desc: `We deliver to ${info.neighborhoods.slice(0, 5).join(", ")}, and all across ${info.name} within 1-3 business days.` },
              { title: "Best Price Guarantee", desc: `We match competitor prices in ${info.name} on identical products. Show us a lower price and we'll beat it.` },
              { title: `${productCount.toLocaleString()}+ Products in Stock`, desc: `From laptops to smartphones, gaming PCs to accessories — ${info.name}'s largest tech selection is online at Technodel.` },
              { title: "Genuine Products with Warranty", desc: "Every product comes with full manufacturer warranty. No replicas, no imitations — only authentic tech." },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-xl bg-white/[0.03] border border-white/5">
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Neighborhoods */}
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <h2 className="text-2xl font-bold mb-8">We Deliver to These Areas in {info.name}</h2>
          <div className="flex flex-wrap gap-3">
            {info.neighborhoods.map((n) => (
              <span key={n} className="px-4 py-2 rounded-full bg-white/[0.05] border border-white/5 text-sm text-white/60">
                {n}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-4 pb-20">
          <div className="p-10 rounded-2xl bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border border-accent/20 text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to Order in {info.name}?</h2>
            <p className="text-white/60 mb-6 max-w-lg mx-auto">
              Browse thousands of products at the best prices in Lebanon. Free delivery to {info.name} and all across Lebanon.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/shop"
                className="px-8 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
              >
                Start Shopping
              </Link>
              <Link
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "961XXXXXXXX"}?text=Hi%20Technodel%2C%20I%27m%20in%20${info.name}%20and%20need%20help`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
              >
                Contact via WhatsApp
              </Link>
            </div>
          </div>
        </section>

        {/* Breadcrumb */}
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <nav className="text-sm text-white/30 flex gap-2">
            <Link href="/" className="hover:text-accent transition-colors">Home</Link>
            <span>›</span>
            <span className="text-white/50">Locations</span>
            <span>›</span>
            <span>{info.name}</span>
          </nav>
        </div>
      </article>
    </>
  );
}
