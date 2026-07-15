import { notFound } from "next/navigation";
import { getShopBySlug } from "@/server/services/shop-service";
import { CheckoutClient } from "@/components/storefront/checkout-client";
import { onlinePaymentEnabled, activeGateway } from "@/server/payments/gateway";
import { getLang } from "@/lib/get-lang";

export default async function CheckoutPage({ params: _p }: { params: Promise<{ slug: string }> }) {
  const params = await _p;
  const shop = await getShopBySlug(params.slug);
  if (!shop) notFound();

  // Verified shops can accept online payments (no order-count requirement).
  const payOnline =
    shop.verificationStatus === "verified"
      ? {
          method: shop.payoutMethod,
          accountName: shop.payoutAccountName,
          accountNumber: shop.payoutAccountNumber,
          whatsapp: shop.whatsapp,
        }
      : null;

  // Card/wallet gateway (if switched on). Available to verified shops.
  const payGateway =
    onlinePaymentEnabled() && shop.verificationStatus === "verified" ? { label: activeGateway().label } : null;

  return (
    <CheckoutClient
      lang={await getLang()}
      slug={shop.slug}
      shopName={shop.name}
      whatsapp={shop.whatsapp}
      currency={shop.currency}
      payOnline={payOnline}
      payGateway={payGateway}
      delivery={{ fee: shop.deliveryFee, freeOver: shop.freeDeliveryOver, zones: shop.deliveryZones }}
    />
  );
}
