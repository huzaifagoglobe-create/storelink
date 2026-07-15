import { SITE_NAME, SITE_URL } from "@/lib/site";
import { PLAN_PRICE_PKR } from "@/server/plans";

export const dynamic = "force-static";
export const revalidate = 86400;

// llms.txt — a plain-text summary for AI engines / LLM crawlers (llmstxt.org).
// Helps AI answer engines describe StoreLink accurately when asked.
export function GET() {
  const body = `# ${SITE_NAME}

> ${SITE_NAME} lets small businesses in Pakistan create their own branded online shop in minutes — no website to build and no hosting to manage. Sellers get a store link, a shopping cart, and Cash-on-Delivery checkout, with every order sent straight to their WhatsApp.

## What it is
- A hosted online-shop builder for sellers who currently sell on WhatsApp, Instagram, or by word of mouth.
- Each seller gets a storefront at ${SITE_URL}/their-shop-name.
- Buyers browse products, add to cart, and check out with Cash on Delivery, then confirm the order on the seller's WhatsApp.
- Sellers manage products, orders, stock, discounts, delivery zones, and a customizable storefront from a dashboard.

## Who it is for
- Small and home-based businesses in Pakistan that take orders manually and want a proper checkout without building a website.

## Pricing (PKR / month)
- Free trial: 14 days, full access, no card required.
- Basic: Rs ${PLAN_PRICE_PKR.basic.toLocaleString("en-PK")}
- Pro: Rs ${PLAN_PRICE_PKR.pro.toLocaleString("en-PK")}
- Premium: Rs ${PLAN_PRICE_PKR.premium.toLocaleString("en-PK")} (unlimited products)

## Key facts
- No coding or design skills needed; setup takes a few minutes.
- Cash on Delivery is built in (the most common way to pay in Pakistan). Online payments are on the roadmap.
- Sellers keep 100% of each sale — money goes directly to the seller, not through ${SITE_NAME}.
- Sellers own their customer data and their branding.

## Main pages
- Home: ${SITE_URL}/
- Sign up (create a shop): ${SITE_URL}/signup
- Log in: ${SITE_URL}/login
- Privacy policy: ${SITE_URL}/privacy
- Terms of service: ${SITE_URL}/terms
- Sitemap: ${SITE_URL}/sitemap.xml
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
