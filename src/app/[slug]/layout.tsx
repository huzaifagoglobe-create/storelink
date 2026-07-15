import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getShopBySlug } from "@/server/services/shop-service";
import { ShopUnavailable } from "@/components/storefront/shop-unavailable";
import { shopHasAccess, effectiveSubscriptionStatus } from "@/server/billing";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { ShopHeader } from "@/components/storefront/shop-header";
import { StoreFooter } from "@/components/storefront/store-footer";
import { AttributionCapture } from "@/components/storefront/attribution-capture";
import { ShopTracking } from "@/components/storefront/shop-tracking";
import { getTemplate, pageTintClass } from "@/server/storefront-templates";
import { getLang } from "@/lib/get-lang";
import { tr } from "@/lib/i18n";

export async function generateMetadata({ params: _p }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await _p;
  const shop = await getShopBySlug(params.slug);
  if (!shop) return {};
  // Seller's custom Google appearance wins; otherwise we auto-generate.
  const title = shop.seoTitle || shop.name;
  const description =
    shop.seoDescription ||
    shop.tagline ||
    `Shop ${shop.name} online — browse products and order on WhatsApp with cash on delivery.`;
  const url = `${SITE_URL}/${shop.slug}`;
  const images = shop.bannerImage ? [shop.bannerImage] : undefined;
  return {
    title: { default: title, template: `%s · ${shop.name}` },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: "website", images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

// Loads the shop for this slug, shows the header, and provides the cart.
// A missing or inactive shop becomes a 404.
export default async function ShopLayout({
  children,
  params: _p,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const params = await _p;
  const shop = await getShopBySlug(params.slug);
  if (!shop) notFound();
  // Closed by the seller, or paused/pending for billing → friendly page, not 404.
  if (!shop.isActive || !shopHasAccess(shop)) {
    return <ShopUnavailable shop={shop} paused={!shop.isActive || effectiveSubscriptionStatus(shop) === "paused"} />;
  }
  const config = getTemplate(shop.template);
  const lang = await getLang();
  const escapeJsonLd = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");
  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: shop.name,
    url: `${SITE_URL}/${shop.slug}`,
    ...(shop.tagline ? { description: shop.tagline } : {}),
    ...(shop.address ? { address: { "@type": "PostalAddress", streetAddress: shop.address, addressCountry: "PK" } } : {}),
    ...(shop.whatsapp ? { telephone: `+${shop.whatsapp}` } : {}),
    ...(shop.bannerImage ? { image: shop.bannerImage } : {}),
    priceRange: "PKR",
    areaServed: "PK",
  };

  return (
    <CartProvider shopSlug={shop.slug}>
      <WishlistProvider shopSlug={shop.slug}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(localBusinessLd) }} />
      <div dir={lang === "ur" ? "rtl" : "ltr"} lang={lang} className={"min-h-screen " + pageTintClass(config.surface)}>
      <ShopTracking fbPixelId={shop.fbPixelId} gaMeasurementId={shop.gaMeasurementId} />
      <AttributionCapture slug={shop.slug} />
      <ShopHeader shop={shop} config={config} lang={lang} />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">{children}</main>
      <StoreFooter shop={shop} config={config} />

      </div>
      </WishlistProvider>
    </CartProvider>
  );
}
