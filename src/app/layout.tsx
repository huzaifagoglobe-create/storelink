import { AcquisitionCapture } from "@/components/marketing/acquisition-capture";
import type { Metadata } from "next";
import { Analytics } from "@/components/analytics";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Your own online shop, no website needed`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "No website? Get a real online shop in minutes. For small businesses in Pakistan that sell on WhatsApp, Instagram, or by word of mouth — a branded store link, a cart, and Cash-on-Delivery checkout, with every order sent straight to your WhatsApp.",
  keywords: [
    "online shop Pakistan",
    "online store without a website",
    "no website online store",
    "small business online store Pakistan",
    "sell on WhatsApp",
    "WhatsApp shop",
    "Instagram shop Pakistan",
    "cash on delivery store",
    "online store builder",
  ],
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_PK",
    url: "/",
    title: `${SITE_NAME} — Your own online shop, no website needed`,
    description:
      "Get a real online shop in minutes — no website to build. A branded store link, a cart, and Cash-on-Delivery checkout. Orders land straight in your WhatsApp. Built for sellers in Pakistan.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "StoreLink — your shop, your link, orders on autopilot" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Your online shop, no website needed`,
    description:
      "A branded store link, cart, Cash-on-Delivery, orders straight to WhatsApp. No website needed. Built for Pakistan.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-full font-sans">{children}        <Analytics />
      </body>
    </html>
  );
}
