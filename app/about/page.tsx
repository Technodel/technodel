import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Technodel – Lebanon's Premium Tech Store",
  description:
    "Learn about Technodel, Lebanon's most trusted online tech store. We offer genuine products, competitive prices, and fast delivery across all Lebanon.",
  alternates: { canonical: "https://technodel.net/about" },
  openGraph: {
    title: "About Technodel – Lebanon's #1 Tech Store",
    description: "Discover the story behind Technodel — Lebanon's premier destination for laptops, smartphones, gaming gear and accessories.",
    url: "https://technodel.net/about",
    siteName: "Technodel",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Technodel – Lebanon's #1 Tech Store",
    description: "Discover the story behind Technodel — Lebanon's premier tech destination.",
  },
};

const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Technodel",
  description: "Lebanon's premium tech store — laptops, smartphones, gaming, and accessories.",
  url: "https://technodel.net/about",
  isPartOf: { "@type": "WebSite", name: "Technodel", url: "https://technodel.net" },
};

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }} />
      <div className="page-enter" style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 100px" }}>
        <h1 className="grad-text" style={{ fontSize: 36, fontWeight: 900, marginBottom: 8, letterSpacing: "-0.5px" }}>
          About Technodel
        </h1>
        <p style={{ color: "var(--c-muted)", fontSize: 15, marginBottom: 40 }}>Lebanon&apos;s most trusted tech destination</p>

        <div className="desc-content">
          <h2>🇱🇧 Our Story</h2>
          <p>
            Technodel was founded with a single mission: <strong>make premium technology
            accessible to everyone in Lebanon</strong>. We saw a market where customers had limited
            options, inflated prices, and uncertainty about product authenticity. We decided to
            change that.
          </p>
          <p>
            Today, Technodel is Lebanon&apos;s fastest-growing online tech store, offering
            <strong> over 5,000 products</strong> across laptops, smartphones, gaming,
            audio, accessories, networking, and more. We serve customers from Beirut to Tripoli,
            from Zahle to Tyre — delivering genuine products at competitive prices.
          </p>

          <h2>🎯 Our Mission</h2>
          <p>
            To provide every Lebanese customer with access to authentic tech products at
            fair prices, backed by exceptional service and fast delivery.
          </p>

          <h2>✅ Why Technodel?</h2>
          <table>
            <thead>
              <tr><th>Feature</th><th>What It Means For You</th></tr>
            </thead>
            <tbody>
              <tr><td>✅ 100% Authentic</td><td>Every product is genuine with manufacturer warranty</td></tr>
              <tr><td>💰 Best Price Guarantee</td><td>We price-match competitors daily</td></tr>
              <tr><td>🚚 Fast Delivery</td><td>1-3 days across all Lebanon</td></tr>
              <tr><td>🔄 Easy Returns</td><td>7-day hassle-free return policy</td></tr>
              <tr><td>🔧 After-Sales Support</td><td>Warranty claims and technical support</td></tr>
              <tr><td>💬 WhatsApp Service</td><td>Personal shopping assistance via chat</td></tr>
            </tbody>
          </table>

          <h2>📊 By The Numbers</h2>
          <ul>
            <li><strong>5,000+</strong> products in stock</li>
            <li><strong>200+</strong> top brands</li>
            <li><strong>15,000+</strong> satisfied customers</li>
            <li><strong>1-3 day</strong> delivery across Lebanon</li>
            <li><strong>9+ competitor prices</strong> matched daily</li>
          </ul>

          <h2>🌍 Our Promise</h2>
          <p>
            We believe that every Lebanese customer deserves access to the best technology
            at fair prices. We work tirelessly to bring you the latest products, compare
            prices across the market, and deliver an unmatched shopping experience.
          </p>

          <h2>📞 Get In Touch</h2>
          <p>
            Have a question? We&apos;d love to hear from you.{" "}
            <a href="https://wa.me/961XXXXXXXX">Chat on WhatsApp</a>,{" "}
            visit our <Link href="/contact">Contact page</Link>, or{" "}
            <Link href="/shop">browse our store</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
