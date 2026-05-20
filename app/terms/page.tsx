import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions – Technodel Lebanon",
  description:
    "Terms and conditions for using Technodel's website and purchasing products in Lebanon. Read about payments, delivery, and legal agreements.",
  alternates: { canonical: "https://technodel.net/terms" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Terms & Conditions – Technodel Lebanon",
    description: "Read the terms and conditions governing your use of Technodel's website and services in Lebanon.",
    url: "https://technodel.net/terms",
    siteName: "Technodel",
    type: "website",
    locale: "en_US",
  },
};

export default function TermsPage() {
  return (
    <div className="page-enter" style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 100px" }}>
      <h1 className="grad-text" style={{ fontSize: 36, fontWeight: 900, marginBottom: 8, letterSpacing: "-0.5px" }}>
        Terms & Conditions
      </h1>
      <p style={{ color: "var(--c-muted)", fontSize: 15, marginBottom: 40 }}>Last updated: May 2026</p>

      <div className="desc-content">
        <h2>📜 Agreement</h2>
        <p>
          By accessing and using Technodel.net, you agree to these terms and conditions.
          If you do not agree, please do not use our website or services.
        </p>

        <h2>🛒 Orders & Pricing</h2>
        <ul>
          <li>All prices are in USD and may include VAT where applicable</li>
          <li>Prices are subject to change without notice</li>
          <li>We reserve the right to cancel orders if pricing errors occur</li>
          <li>Order confirmation does not guarantee product availability</li>
          <li>We may limit quantities per customer or per order</li>
        </ul>

        <h2>💳 Payment</h2>
        <ul>
          <li>Payment methods: Cash on Delivery, Bank Transfer (USD/LBP)</li>
          <li>Full payment is required before order processing for bank transfers</li>
          <li>COD orders require confirmation via WhatsApp</li>
        </ul>

        <h2>🚚 Delivery</h2>
        <ul>
          <li>Delivery times are estimates, not guarantees</li>
          <li>Free delivery on orders over $150</li>
          <li>Delivery within 1-3 business days to most Lebanese regions</li>
          <li>Risk transfers to customer upon delivery</li>
        </ul>

        <h2>🔙 Returns & Refunds</h2>
        <ul>
          <li>7-day return policy as detailed in our Returns page</li>
          <li>Refunds processed within 3-7 business days</li>
          <li>Shipping costs for returns may apply</li>
        </ul>

        <h2>📱 Product Information</h2>
        <ul>
          <li>Product images are for illustration; actual product may vary</li>
          <li>Specifications are provided by manufacturers and may change</li>
          <li>We strive for accuracy but do not guarantee error-free listings</li>
        </ul>

        <h2>⚖️ Limitation of Liability</h2>
        <p>
          Technodel shall not be liable for any indirect, incidental, or consequential
          damages arising from the use of our products or services. Our total liability
          is limited to the purchase price of the product.
        </p>

        <h2>📧 Contact</h2>
        <p>
          For questions about these terms, contact us at legal@technodel.net
          or via <a href="https://wa.me/961XXXXXXXX">WhatsApp</a>.
        </p>
      </div>
    </div>
  );
}
