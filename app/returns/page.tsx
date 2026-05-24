import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Returns & Exchanges Policy – Technodel Lebanon",
  description:
    "Easy 7-day return and exchange policy for all tech products purchased from Technodel in Lebanon. Full refund or replacement guaranteed.",
  alternates: { canonical: "https://technodel.net/new/returns" },
  openGraph: {
    title: "Returns & Exchanges – Technodel Lebanon",
    description: "Shop with confidence. 7-day return policy on all tech products with fast processing and full refunds.",
    url: "https://technodel.net/new/returns",
    siteName: "Technodel",
    type: "website",
    locale: "en_US",
  },
};

const returnsSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Returns & Exchanges Policy – Technodel Lebanon",
  url: "https://technodel.net/new/returns",
  isPartOf: { "@type": "WebSite", name: "Technodel", url: "https://technodel.net/new" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Technodel's return policy?",
      acceptedAnswer: { "@type": "Answer", text: "We offer a 7-day return policy from the date of delivery. Products must be unused, in original packaging, with all accessories included." },
    },
    {
      "@type": "Question",
      name: "How long does a refund take in Lebanon?",
      acceptedAnswer: { "@type": "Answer", text: "Refunds are processed within 3-7 business days after we receive and inspect the returned item. The refund will be issued to your original payment method." },
    },
    {
      "@type": "Question",
      name: "Can I exchange a product purchased from Technodel?",
      acceptedAnswer: { "@type": "Answer", text: "Yes, you can exchange most products within 7 days of delivery. The product must be in its original condition and packaging." },
    },
  ],
};

export default function ReturnsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(returnsSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="page-enter" style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 100px" }}>
        <h1 className="grad-text" style={{ fontSize: 36, fontWeight: 900, marginBottom: 8, letterSpacing: "-0.5px" }}>
          Returns & Exchanges
        </h1>
        <p style={{ color: "var(--c-muted)", fontSize: 15, marginBottom: 40 }}>Last updated: May 2026</p>

        <div className="desc-content">
          <h2>🔄 7-Day Return Policy</h2>
          <p>
            We want you to love your purchase. If you're not completely satisfied,
            you can return most items within <strong>7 days of delivery</strong> for a
            full refund or exchange.
          </p>

          <h2>✅ Eligible Items</h2>
          <ul>
            <li>Unopened and unused products in original packaging</li>
            <li>All accessories, manuals, and cables included</li>
            <li>Sealed items must have unbroken seals</li>
            <li>Electronics must not show signs of use or installation</li>
          </ul>

          <h2>❌ Non-Returnable Items</h2>
          <ul>
            <li>Opened software, games, or digital downloads</li>
            <li>Personal hygiene products (earphones, headphones — if hygiene seals broken)</li>
            <li>Custom-configured or special-order products</li>
            <li>Products damaged due to customer misuse</li>
            <li>Products returned after 7 days</li>
          </ul>

          <h2>📋 Return Process</h2>
          <ol>
            <li><strong>Contact us</strong> via WhatsApp or email to initiate the return</li>
            <li><strong>Pack the product</strong> securely in its original packaging</li>
            <li><strong>Include proof of purchase</strong> (order number or invoice)</li>
            <li><strong>Ship or bring</strong> the item to our location</li>
            <li><strong>We inspect</strong> the item within 1-2 business days</li>
            <li><strong>Refund processed</strong> within 3-7 business days</li>
          </ol>

          <h2>💳 Refund Information</h2>
          <table>
            <thead>
              <tr><th>Payment Method</th><th>Refund Time</th></tr>
            </thead>
            <tbody>
              <tr><td>Cash on Delivery</td><td>3-5 business days (bank transfer)</td></tr>
              <tr><td>Bank Transfer</td><td>3-7 business days</td></tr>
              <tr><td>Credit/Debit Card</td><td>5-10 business days</td></tr>
            </tbody>
          </table>

          <h2>🚚 Return Shipping</h2>
          <p>
            Return shipping costs are covered by Technodel if the return is due to
            a defect or our error. For change-of-mind returns, the customer covers
            return shipping fees.
          </p>

          <h2>📞 Start a Return</h2>
          <p>
            Need to start a return? <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""}`}>Message us on WhatsApp</a>{" "}
            or visit our <Link href="/contact">Contact page</Link>.
            Our team will guide you through the process.
          </p>
        </div>
      </div>
    </>
  );
}
