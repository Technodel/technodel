import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Computer Store Locations in Lebanon | Technodel",
  description: "Find Technodel computer store locations across Lebanon. Shop laptops, smartphones, and electronics in Beirut, Tripoli, Jounieh, Saida, Zahle and more cities.",
  keywords: "technodel locations lebanon, computer store beirut, laptop shop tripoli, electronics jounieh, tech store saida, computer shop zahle",
  alternates: { canonical: "https://technodel.net/new/locations" },
  openGraph: {
    title: "Computer Store Locations in Lebanon | Technodel",
    description: "Shop laptops, smartphones, and electronics across Lebanon. Best prices, fast delivery.",
    url: "https://technodel.net/new/locations",
    siteName: "Technodel",
    type: "website",
  },
};

const CITIES = [
  { slug: "beirut", name: "Beirut", icon: "🏙️", desc: "Capital city with fast tech delivery to Hamra, Achrafieh, Verdun and more." },
  { slug: "tripoli", name: "Tripoli", icon: "🏛️", desc: "North Lebanon's tech hub — serving Azmi, Al-Mina, Abu Samra and beyond." },
  { slug: "jounieh", name: "Jounieh", icon: "🌊", desc: "Keserwan's premier tech destination — Kaslik, Zouk, Maameltein and more." },
  { slug: "saida", name: "Saida", icon: "🏖️", desc: "South Lebanon's growing tech market — Old Saida, Al-Hilaliyeh, Abra." },
  { slug: "zahle", name: "Zahle", icon: "🏔️", desc: "Beqaa Valley's tech capital — Maallaqa, Chtaura, Taanayel and beyond." },
];

export default function LocationsPage() {
  return (
    <article className="min-h-screen">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Technodel <span className="grad-text">Locations</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            We serve every corner of Lebanon with fast delivery of laptops, smartphones, gaming gear, and electronics.
            Find your city below and start shopping at the best prices in the country.
          </p>
        </div>
      </header>

      {/* City Grid */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CITIES.map((city) => (
            <Link
              key={city.slug}
              href={`/locations/${city.slug}`}
              className="group p-8 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-accent/30 transition-all"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{city.icon}</div>
              <h2 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">{city.name}</h2>
              <p className="text-sm text-white/50 leading-relaxed">{city.desc}</p>
              <div className="mt-4 text-sm text-accent font-medium group-hover:gap-2 transition-all flex items-center gap-1">
                Shop in {city.name} →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="p-10 rounded-2xl bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border border-accent/20 text-center">
          <h2 className="text-2xl font-bold mb-3">Delivering Across All Lebanon</h2>
          <p className="text-white/60 mb-6 max-w-lg mx-auto">
            No matter where you are in Lebanon, Technodel delivers. Free shipping on orders over a certain amount.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
          >
            Start Shopping →
          </Link>
        </div>
      </section>
    </article>
  );
}
