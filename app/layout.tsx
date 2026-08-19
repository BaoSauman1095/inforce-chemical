import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { PHONE_DISPLAY, PHONE_TEL, SITE_NAME, SITE_URL, SOCIALS } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

const title = "IN FORCE CHEMICAL — насіння, добрива та захист рослин";
const description =
  "Офіційний дистриб'ютор Limagrain, Ocean Invest, Biolchim та Holland Farming в Україні. Насіння, добрива, засоби захисту рослин, власна агрономічна служба та доставка по всій Україні.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: title,
    template: `%s — ${SITE_NAME}`,
  },
  description,
  keywords: [
    "насіння кукурудзи",
    "насіння соняшника",
    "добрива для сільського господарства",
    "засоби захисту рослин",
    "Limagrain Україна",
    "Ocean Invest",
    "Biolchim",
    "Holland Farming",
    "агрохімія",
    "IN FORCE CHEMICAL",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  generator: "Next.js",
  referrer: "strict-origin-when-cross-origin",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    url: SITE_URL,
    siteName: SITE_NAME,
    title,
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/icon",
    shortcut: "/icon",
    apple: "/icon",
  },
  category: "business",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0d0d",
  colorScheme: "dark",
};

function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon`,
    description,
    telephone: PHONE_TEL,
    address: {
      "@type": "PostalAddress",
      addressCountry: "UA",
    },
    sameAs: Object.values(SOCIALS),
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: PHONE_TEL,
        contactType: "sales",
        areaServed: "UA",
        availableLanguage: ["Ukrainian", "Russian"],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" className={`${inter.variable} ${montserrat.variable}`}>
      <head>
        <OrganizationJsonLd />
      </head>
      <body className="font-sans antialiased">
        {children}
        <p className="sr-only">
          Телефон для замовлень: {PHONE_DISPLAY}
        </p>
      </body>
    </html>
  );
}
