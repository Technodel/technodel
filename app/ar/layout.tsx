import type { Metadata } from "next";
import { Tajawal } from "next/font/google";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://technodel.net"),
  title: {
    default: "تكنوديل – أفضل متجر إلكترونيات في لبنان | لابتوبات، هواتف ذكية",
    template: "%s | تكنوديل لبنان",
  },
  description: "أفضل وجهة للتسوق الإلكتروني في لبنان. تسوق اللابتوبات، الهواتف الذكية، أجهزة الألعاب، الإكسسوارات والمزيد بأفضل الأسعار مع توصيل سريع في جميع أنحاء لبنان.",
  keywords: [
    "تكنوديل", "تكنوديل لبنان", "متجر الكترونيات لبنان", "متجر كمبيوتر لبنان",
    "لابتوب لبنان", "هواتف ذكية لبنان", "العاب لبنان", "الكترونيات لبنان",
    "شراء لابتوب بيروت", "كمبيوتر لبنان", "اكسسوارات لبنان",
  ],
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  alternates: {
    canonical: "https://technodel.net/ar",
    languages: {
      "en": "https://technodel.net",
      "ar": "https://technodel.net/ar",
      "x-default": "https://technodel.net",
    },
  },
  openGraph: {
    siteName: "تكنوديل",
    type: "website",
    locale: "ar_LB",
    title: "تكنوديل – أفضل متجر إلكترونيات في لبنان",
    description: "تسوق اللابتوبات، الهواتف الذكية، أجهزة الألعاب والإكسسوارات بأفضل الأسعار مع توصيل سريع في لبنان.",
    url: "https://technodel.net/ar",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "تكنوديل لبنان" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "تكنوديل – أفضل متجر إلكترونيات في لبنان",
    description: "تسوق اللابتوبات، الهواتف الذكية، أجهزة الألعاب والإكسسوارات بأفضل الأسعار.",
    images: ["/og-image.png"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION_ID || "YOUR_GOOGLE_SEARCH_CONSOLE_ID",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "تكنوديل",
  url: "https://technodel.net",
  logo: "https://technodel.net/logo.png",
  description: "أفضل متجر إلكترونيات في لبنان — لابتوبات، هواتف ذكية، إكسسوارات والمزيد.",
  address: { "@type": "PostalAddress", addressCountry: "LB" },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+961-XX-XXX-XXX",
    availableLanguage: ["Arabic", "English"],
  },
};

export default function ArabicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col font-[family-name:var(--font-arabic)]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
