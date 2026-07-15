import { notFound } from "next/navigation";
import { getShopBySlug } from "@/server/services/shop-service";
import { getProductsByShop } from "@/server/services/product-service";
import { listCategories } from "@/server/services/category-service";
import { listReviewsForShop, summarizeByProduct, reviewSummary } from "@/server/services/review-service";
import { listShopOrders } from "@/server/services/order-service";
import { computeTrust } from "@/server/trust";
import { getTemplate, TEMPLATE_IDS } from "@/server/storefront-templates";
import { getCurrentSeller } from "@/server/auth/current-seller";
import { StorefrontHome } from "@/components/storefront/storefront-home";
import { ViewBeacon } from "@/components/storefront/view-beacon";
import { ShopUnavailable } from "@/components/storefront/shop-unavailable";
import { shopHasAccess, effectiveSubscriptionStatus } from "@/server/billing";

export default async function StorefrontPage({
  params: _p,
  searchParams: _sp,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ previewTemplate?: string }>;
}) {
  const params = await _p;
  const sp = await _sp;
  const shop = await getShopBySlug(params.slug);
  if (!shop) notFound();
  if (!shopHasAccess(shop)) {
    return <ShopUnavailable shop={shop} paused={effectiveSubscriptionStatus(shop) === "paused"} />;
  }

  const [products, categories, reviews, orders] = await Promise.all([
    getProductsByShop(shop.id),
    listCategories(shop.id),
    listReviewsForShop(shop.id),
    listShopOrders(shop.id),
  ]);
  const ratings = summarizeByProduct(reviews);
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const { average, count } = reviewSummary(reviews);
  const trust = computeTrust(shop, delivered, average, count);
  // Owner live-preview: apply ?previewTemplate=<id> only if this viewer owns the shop.
  let previewTemplate: string | null = null;
  if (sp?.previewTemplate && (TEMPLATE_IDS as string[]).includes(sp.previewTemplate)) {
    const seller = await getCurrentSeller();
    if (seller && seller.shop.id === shop.id) previewTemplate = sp.previewTemplate;
  }
  const config = getTemplate(previewTemplate ?? shop.template);

  return (
    <>
      <ViewBeacon slug={shop.slug} kind="shop" />
      <StorefrontHome
        shop={shop}
        products={products}
        categories={categories}
        ratings={ratings}
        config={config}
        trust={trust}
        delivered={delivered}
        reviewAvg={average}
        reviewCount={count}
      />
    </>
  );
}
