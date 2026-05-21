import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us – Technodel Lebanon | Get In Touch",
  description: "Contact Technodel Lebanon for inquiries, support, bulk orders, or partnerships. Call, WhatsApp, email or visit our showroom in Beirut.",
  openGraph: {
    title: "Contact Us – Technodel Lebanon",
    description: "Get in touch with Technodel Lebanon. Call, WhatsApp, email or visit us.",
    url: "https://technodel.net/new/contact",
    siteName: "Technodel",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us – Technodel Lebanon",
    description: "Get in touch with Technodel Lebanon.",
  },
  alternates: { canonical: "https://technodel.net/new/contact" },
};

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Technodel",
  url: "https://technodel.net/new",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+961-XX-XXX-XXX",
    contactType: "customer service",
    hoursAvailable: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "14:00" },
    ],
    availableLanguage: ["English", "Arabic"],
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "Beirut",
    addressLocality: "Beirut",
    addressCountry: "LB",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://technodel.net/new" },
    { "@type": "ListItem", position: 2, name: "Contact", item: "https://technodel.net/new/contact" },
  ],
};

const contactMethods = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    title: "Call Us",
    detail: "+961 XX XXX XXX",
    sub: "Mon–Fri 9AM–6PM, Sat 9AM–2PM",
    href: "tel:+961XXXXXXXXX",
    label: "+961 XX XXX XXX",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: "WhatsApp",
    detail: "Chat with us",
    sub: "Quickest response time",
    href: "https://wa.me/961XXXXXXXXX",
    label: "Chat on WhatsApp",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "Email",
    detail: "info@technodel.net",
    sub: "We reply within 24 hours",
    href: "mailto:info@technodel.net",
    label: "Send Email",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Visit Us",
    detail: "Beirut, Lebanon",
    sub: "Showroom: Call ahead for appointment",
    href: "#",
    label: "Get Directions",
  },
];

export default function ContactPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
          <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              Get In Touch
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              We&apos;re here to help. Reach out for orders, support, bulk purchases, or any questions.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, i) => (
              <a
                key={i}
                href={method.href}
                target={method.href.startsWith("http") ? "_blank" : undefined}
                rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-accent/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-accent/5"
              >
                <div className="text-accent mb-4 transition-transform duration-300 group-hover:scale-110">{method.icon}</div>
                <h3 className="font-semibold text-white mb-1">{method.title}</h3>
                <p className="text-sm text-white/80 font-medium">{method.detail}</p>
                <p className="text-xs text-white/40 mt-1">{method.sub}</p>
                <span className="inline-block mt-3 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  {method.label} &rarr;
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Contact Form */}
        <section className="border-t border-white/5">
          <div className="max-w-2xl mx-auto px-4 py-16">
            <h2 className="text-2xl font-bold text-center mb-8">Send Us a Message</h2>
            <form className="space-y-5" action="#">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-2">Name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-white/70 mb-2">Subject</label>
                <input
                  id="subject"
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
                  placeholder="How can we help?"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-white/70 mb-2">Message</label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors resize-none"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>
              <button
                type="submit"
                className="w-full px-8 py-3.5 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-all active:scale-[0.98]"
              >
                Send Message
              </button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}
