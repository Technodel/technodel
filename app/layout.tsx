import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/layout/ThemeProvider";
import AppShell from "@/components/layout/AppShell";
import LoadingScreen from "@/components/ui/LoadingScreen";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  manifest: "/manifest.json",
  metadataBase: new URL("https://technodel.net"),
  title: {
    default: "Technodel – Lebanon's #1 Tech Store | Laptops, Smartphones & More",
    template: "%s | Technodel Lebanon",
  },
  description: "Lebanon's premium tech destination. Shop laptops, smartphones, gaming gear, accessories & more at unbeatable prices with fast delivery across Lebanon.",
  keywords: [
    "technodel", "technodel lebanon", "lebanon tech store", "computer store lebanon",
    "laptops lebanon", "smartphones lebanon", "gaming lebanon", "electronics lebanon",
    "buy laptop beirut", "pc shop lebanon", "tech accessories lebanon",
    "cheap laptops lebanon", "computer parts lebanon", "gaming pc lebanon",
  ],
  authors: [{ name: "Technodel" }],
  creator: "Technodel",
  publisher: "Technodel",
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  alternates: {
    canonical: "https://technodel.net",
    languages: {
      "en": "https://technodel.net",
      "ar": "https://technodel.net/ar",
      "x-default": "https://technodel.net",
    },
  },
  openGraph: {
    siteName: "Technodel",
    type: "website",
    locale: "en_US",
    title: "Technodel – Lebanon's #1 Tech Store",
    description: "Shop laptops, smartphones, gaming gear and accessories. Fast delivery across Lebanon.",
    url: "https://technodel.net",
    images: [{ url: "/new/og-image.svg", width: 1200, height: 630, alt: "Technodel Lebanon" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Technodel – Lebanon's #1 Tech Store",
    description: "Shop laptops, smartphones, gaming gear and accessories. Fast delivery across Lebanon.",
    images: ["/new/og-image.svg"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION_ID || "YOUR_GOOGLE_SEARCH_CONSOLE_ID",
  },
  other: {
    "theme-color": "#040b14",
    "google-site-verification": process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION_ID || "YOUR_GOOGLE_SEARCH_CONSOLE_ID",
  },
};

// JSON-LD schemas for brand presence
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Technodel",
  url: "https://technodel.net",
  logo: "https://technodel.net/new/logo.png",
  description: "Lebanon's premium tech store — laptops, smartphones, accessories and more.",
  address: { "@type": "PostalAddress", addressCountry: "LB" },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+961-XX-XXX-XXX",
    availableLanguage: ["English", "Arabic"],
  },
  sameAs: [
    "https://facebook.com/technodel",
    "https://instagram.com/technodel",
    "https://twitter.com/technodel",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Technodel",
  url: "https://technodel.net",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://technodel.net/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "ComputerStore",
  name: "Technodel",
  url: "https://technodel.net",
  logo: "https://technodel.net/new/logo.png",
  image: "https://technodel.net/new/og-image.svg",
  description: "Lebanon's premium computer and electronics store — laptops, smartphones, gaming gear, accessories and more with fast delivery across Lebanon.",
  address: { "@type": "PostalAddress", addressCountry: "LB", addressLocality: "Beirut" },
  telephone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+961-XX-XXX-XXX",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@technodel.net",
  priceRange: "$$",
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "09:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "09:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Wednesday", opens: "09:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Thursday", opens: "09:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "09:00", closes: "17:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "14:00" },
  ],
  areaServed: [
    { "@type": "City", name: "Beirut" },
    { "@type": "City", name: "Tripoli" },
    { "@type": "City", name: "Jounieh" },
    { "@type": "City", name: "Saida" },
    { "@type": "City", name: "Zahle" },
    { "@type": "City", name: "Tyre" },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Tech Products",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Product", name: "Laptops", url: "https://technodel.net/shop/laptops" } },
      { "@type": "Offer", itemOffered: { "@type": "Product", name: "Smartphones", url: "https://technodel.net/shop/smartphones" } },
      { "@type": "Offer", itemOffered: { "@type": "Product", name: "Gaming", url: "https://technodel.net/shop/gaming" } },
    ],
  },
  sameAs: [
    "https://facebook.com/technodel",
    "https://instagram.com/technodel",
    "https://twitter.com/technodel",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-US" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/new/favicon.svg" />
        <link rel="alternate icon" href="/new/favicon.ico" />
        <link rel="apple-touch-icon" href="/new/logo.png" sizes="180x180" />
        <link rel="preconnect" href="https://cdn11.bigcommerce.com" />
        <link rel="preconnect" href="https://ayoubcomputers.com" />
        <link rel="preconnect" href="https://ezone.com.lb" />
        <link rel="dns-prefetch" href="https://cdn11.bigcommerce.com" />
        <link rel="dns-prefetch" href="https://ayoubcomputers.com" />
        <link rel="dns-prefetch" href="https://ezone.com.lb" />
      </head>
      <body className="min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <GoogleAnalytics />
        <ThemeProvider>
          <LoadingScreen />
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
