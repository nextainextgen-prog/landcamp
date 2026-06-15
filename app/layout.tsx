import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, IBM_Plex_Sans_Thai } from "next/font/google";
import { siteConfig } from "@/data/siteConfig";
import { StructuredData } from "@/components/seo/StructuredData";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-plex-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Cormorant Garamond — brand wordmark only. Upright only (no italic),
// used for "LandCamp" + "Villa khaoyai" in navbar, hero, footer.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#4d584b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.seo.siteUrl),
  title: {
    default: `${siteConfig.brand.nameFull} | ที่พักไพรเวทกลางขุนเขาเขาใหญ่`,
    template: `%s | ${siteConfig.brand.nameFull}`,
  },
  description: siteConfig.brand.description.th,
  keywords: [...siteConfig.seo.keywordsTh, ...siteConfig.seo.keywordsEn],
  authors: [{ name: siteConfig.brand.nameFull }],
  creator: siteConfig.brand.nameFull,
  publisher: siteConfig.brand.nameFull,
  alternates: {
    canonical: siteConfig.seo.siteUrl,
    languages: {
      "th-TH": siteConfig.seo.siteUrl,
      "en-US": `${siteConfig.seo.siteUrl}/en`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    alternateLocale: "en_US",
    url: siteConfig.seo.siteUrl,
    siteName: siteConfig.brand.nameFull,
    title: `${siteConfig.brand.nameFull} — ${siteConfig.brand.tagline.th}`,
    description: siteConfig.brand.description.th,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: siteConfig.brand.nameFull,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.brand.nameFull,
    description: siteConfig.brand.tagline.en,
    images: ["/og-image.jpg"],
  },
  category: "hospitality",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="th"
      className={`${inter.variable} ${plexThai.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[color:var(--color-bone)] text-[color:var(--color-ink)]">
        <StructuredData />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
