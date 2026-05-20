import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ – Shipping, Warranty, Payment & More | Technodel Lebanon",
  description: "Find answers about shipping across Lebanon, warranty coverage, payment methods, returns, and more. Your complete guide to shopping at Technodel.",
  openGraph: {
    title: "FAQ – Technodel Lebanon",
    description: "Find answers about shipping, warranty, payment, returns and more at Technodel.",
    url: "https://technodel.net/faq",
    siteName: "Technodel",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ – Technodel Lebanon",
    description: "Find answers about shipping, warranty, payment, returns and more.",
  },
  alternates: { canonical: "https://technodel.net/faq" },
};

const faqs = [
  {
    question: "How long does shipping take within Lebanon?",
    answer:
      "We deliver to all Lebanese regions. Beirut & Mount Lebanon: 1–2 business days. Other regions: 2–4 business days. Same-day delivery is available in Beirut for orders placed before 2 PM.",
  },
  {
    question: "What are the shipping costs?",
    answer:
      "Free delivery on orders over $100. Standard delivery within Beirut costs $3, and other regions $5–$8 depending on location.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept Cash on Delivery (COD), Wish Money transfer, and Crypto (USDT, BTC, ETH). No hidden fees \u2014 what you see is what you pay.",
  },
  {
    question: "Do you offer warranty on products?",
    answer:
      "Yes! All products come with manufacturer warranty. Laptops and PCs include 1–2 year warranty. Accessories include minimum 6 months. Extended warranty plans are available at checkout.",
  },
  {
    question: "Can I return a product?",
    answer:
      "You can return unopened products within 14 days of delivery for a full refund. Defective products are covered under warranty. Contact us within 48 hours of delivery for any issues.",
  },
  {
    question: "Do you price match competitors?",
    answer:
      "Yes! If you find a lower price from a competitor on an identical product, we'll match it. Contact us with the competitor's link before purchasing.",
  },
  {
    question: "Are the products genuine?",
    answer:
      "Absolutely. We source all products directly from authorized distributors and manufacturers. Every product is 100% genuine with full warranty.",
  },
  {
    question: "Do you ship to all Lebanese regions?",
    answer:
      "Yes, we deliver to all cities and villages across Lebanon including Beirut, Tripoli, Sidon, Tyre, Zahle, Jounieh, Byblos, Baalbek, Nabatieh, and all other regions.",
  },
  {
    question: "Can I track my order?",
    answer:
      "Yes, after your order is dispatched, you'll receive a tracking link via WhatsApp or email. You can also check your order status in your account dashboard.",
  },
  {
    question: "Do you offer installation services?",
    answer:
      "We offer professional installation for PCs, laptops, and networking equipment. Installation services can be added during checkout for an additional fee.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.answer,
    },
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://technodel.net" },
    { "@type": "ListItem", position: 2, name: "FAQ", item: "https://technodel.net/faq" },
  ],
};

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
          <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Everything you need to know about shopping at Technodel Lebanon.
              Can&apos;t find what you&apos;re looking for?{" "}
              <a href="/contact" className="text-accent hover:underline">
                Contact us
              </a>
              .
            </p>
          </div>
        </section>

        {/* FAQ Items */}
        <section className="max-w-3xl mx-auto px-4 py-16">
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-white/5 bg-white/[0.02] transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]"
              >
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none select-none">
                  <span className="text-base font-medium text-white/90 pr-4">{faq.question}</span>
                  <svg
                    className="w-5 h-5 text-white/40 shrink-0 transition-transform duration-300 group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-5 pt-0 border-t border-white/5 mt-0">
                  <p className="text-white/60 leading-relaxed">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Still Have Questions */}
        <section className="border-t border-white/5">
          <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <h2 className="text-2xl font-bold mb-3">Still Have Questions?</h2>
            <p className="text-white/60 mb-8">
              Our support team is ready to help you.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Support
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
