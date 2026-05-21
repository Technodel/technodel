import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Warranty Policy – Technodel Lebanon",
  description:
    "Technodel's warranty policy for all tech products purchased in Lebanon. Learn about manufacturer warranty, extended coverage, and how to claim.",
  alternates: { canonical: "https://technodel.net/new/warranty" },
  openGraph: {
    title: "Warranty Policy – Technodel Lebanon",
    description: "Learn about our comprehensive warranty coverage for laptops, smartphones, gaming gear and accessories in Lebanon.",
    url: "https://technodel.net/new/warranty",
    siteName: "Technodel",
    type: "website",
    locale: "en_US",
  },
};

const warrantySchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Warranty Policy – Technodel Lebanon",
  description: "Technodel's warranty policy for all tech products purchased in Lebanon.",
  url: "https://technodel.net/new/warranty",
  isPartOf: { "@type": "WebSite", name: "Technodel", url: "https://technodel.net/new" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How long is the warranty on products purchased from Technodel?",
      acceptedAnswer: { "@type": "Answer", text: "Most products come with a 1-year manufacturer warranty. Select products may have extended warranties. Check the product page for specific warranty details." },
    },
    {
      "@type": "Question",
      name: "Does Technodel cover international warranty?",
      acceptedAnswer: { "@type": "Answer", text: "Warranty is valid in Lebanon through authorized service centers. International warranty depends on the manufacturer and product model." },
    },
    {
      "@type": "Question",
      name: "How do I claim warranty on my Technodel product?",
      acceptedAnswer: { "@type": "Answer", text: "Contact us via WhatsApp or visit our store with your proof of purchase. Our team will assist you with the warranty claim process." },
    },
  ],
};

export default function WarrantyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(warrantySchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="page-enter" style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 100px" }}>
        <h1 className="grad-text" style={{ fontSize: 36, fontWeight: 900, marginBottom: 8, letterSpacing: "-0.5px" }}>
          Warranty Policy
        </h1>
        <p style={{ color: "var(--c-muted)", fontSize: 15, marginBottom: 40 }}>Last updated: May 2026</p>

        <div className="desc-content">
          <h2>🛡️ Our Warranty Commitment</h2>
          <p>
            At Technodel, every product we sell is 100% genuine and comes with manufacturer warranty
            valid in Lebanon. We stand behind the quality of our products and are committed to
            ensuring your peace of mind.
          </p>

          <h2>📋 Warranty Coverage</h2>
          <table>
            <thead>
              <tr><th>Product Category</th><th>Warranty Period</th><th>Coverage</th></tr>
            </thead>
            <tbody>
              <tr><td>Laptops</td><td>1 Year</td><td>Manufacturer defects</td></tr>
              <tr><td>Smartphones</td><td>1 Year</td><td>Manufacturer defects</td></tr>
              <tr><td>Gaming Consoles</td><td>1 Year</td><td>Manufacturer defects</td></tr>
              <tr><td>Audio & Headphones</td><td>6 Months – 1 Year</td><td>Depends on brand</td></tr>
              <tr><td>Accessories</td><td>3 – 6 Months</td><td>Manufacturer defects</td></tr>
              <tr><td>Networking Gear</td><td>1 Year</td><td>Manufacturer defects</td></tr>
            </tbody>
          </table>

          <h2>🔧 What's Covered</h2>
          <ul>
            <li><strong>Manufacturing defects</strong> in materials and workmanship</li>
            <li><strong>Hardware failures</strong> not caused by physical damage</li>
            <li><strong>Battery defects</strong> during the warranty period (normal wear excluded)</li>
            <li><strong>DOA (Dead on Arrival)</strong> — immediate replacement within 7 days</li>
          </ul>

          <h2>❌ What's Not Covered</h2>
          <ul>
            <li>Physical damage (drops, liquid spills, cracks, dents)</li>
            <li>Unauthorized repairs or modifications</li>
            <li>Normal wear and tear (battery life, screen burn-in)</li>
            <li>Software issues, viruses, or data recovery</li>
            <li>Lost or stolen products</li>
            <li>Accessories included in the box (chargers, cables, cases)</li>
          </ul>

          <h2>📝 How to Claim</h2>
          <ol>
            <li><strong>Contact us</strong> via WhatsApp or visit our store</li>
            <li><strong>Provide proof of purchase</strong> (order confirmation, invoice, or receipt)</li>
            <li><strong>Describe the issue</strong> in detail</li>
            <li><strong>Ship or bring</strong> the product to our service center</li>
            <li><strong>We diagnose and process</strong> the claim within 3-7 business days</li>
          </ol>

          <h2>📞 Need Help?</h2>
          <p>
            Our support team is available Sunday–Friday, 9 AM – 7 PM.
            Contact us on <a href="https://wa.me/961XXXXXXXX">WhatsApp</a> or visit our{" "}
            <Link href="/contact">Contact page</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
