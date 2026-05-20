import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – Technodel Lebanon",
  description:
    "Technodel's privacy policy explains how we collect, use, and protect your personal information when you shop with us in Lebanon.",
  alternates: { canonical: "https://technodel.net/privacy" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Privacy Policy – Technodel Lebanon",
    description: "Learn how Technodel protects your personal data and privacy when shopping online.",
    url: "https://technodel.net/privacy",
    siteName: "Technodel",
    type: "website",
    locale: "en_US",
  },
};

export default function PrivacyPage() {
  return (
    <div className="page-enter" style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 100px" }}>
      <h1 className="grad-text" style={{ fontSize: 36, fontWeight: 900, marginBottom: 8, letterSpacing: "-0.5px" }}>
        Privacy Policy
      </h1>
      <p style={{ color: "var(--c-muted)", fontSize: 15, marginBottom: 40 }}>Last updated: May 2026</p>

      <div className="desc-content">
        <h2>📄 Introduction</h2>
        <p>
          Technodel ("we," "our," or "us") is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, disclose, and safeguard
          your information when you visit our website or make a purchase.
        </p>

        <h2>📋 Information We Collect</h2>
        <p>We may collect the following information:</p>
        <ul>
          <li><strong>Personal data:</strong> Name, email address, phone number, shipping address</li>
          <li><strong>Order data:</strong> Purchase history, product preferences, payment details</li>
          <li><strong>Technical data:</strong> IP address, browser type, device information, cookies</li>
          <li><strong>Communication data:</strong> WhatsApp chats, emails, and support inquiries</li>
        </ul>

        <h2>🔒 How We Use Your Data</h2>
        <ul>
          <li>Process and fulfill your orders</li>
          <li>Communicate order updates and delivery information</li>
          <li>Provide customer support and warranty service</li>
          <li>Send promotional offers (only with your consent)</li>
          <li>Improve our website and shopping experience</li>
          <li>Prevent fraud and ensure transaction security</li>
        </ul>

        <h2>🤝 Data Sharing</h2>
        <p>
          We do not sell your personal information. We may share data with:
        </p>
        <ul>
          <li><strong>Delivery partners</strong> — to ship your orders</li>
          <li><strong>Payment processors</strong> — to handle transactions securely</li>
          <li><strong>Legal authorities</strong> — if required by law</li>
        </ul>

        <h2>🍪 Cookies</h2>
        <p>
          We use cookies to enhance your browsing experience, remember your preferences,
          and analyze site traffic. You can control cookie settings in your browser.
          Essential cookies are required for the shopping cart and account features.
        </p>

        <h2>🔐 Data Security</h2>
        <p>
          We implement industry-standard security measures including SSL encryption,
          secure payment gateways, and restricted data access to protect your information.
        </p>

        <h2>📧 Your Rights</h2>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Opt out of marketing communications at any time</li>
          <li>Withdraw consent where processing is based on consent</li>
        </ul>

        <h2>📞 Contact</h2>
        <p>
          For privacy-related inquiries, contact us at privacy@technodel.net
          or via <a href="https://wa.me/961XXXXXXXX">WhatsApp</a>.
        </p>
      </div>
    </div>
  );
}
