import { ReferralCard } from "@/components/storefront/referral-card";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopBySlug } from "@/server/services/shop-service";
import { getOrderByToken } from "@/server/services/order-service";
import { buildOrderWhatsappLink } from "@/server/whatsapp";
import { formatCurrency } from "@/lib/format";
import { trackingUrl } from "@/lib/courier";

export default async function OrderPage({
  params: _p,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const params = await _p;
  const shop = await getShopBySlug(params.slug);
  if (!shop) notFound();
  const order = await getOrderByToken(params.token);
  if (!order || order.shopId !== shop.id) notFound();

  const waLink = buildOrderWhatsappLink(shop, order);

  const STEPS = ["new", "confirmed", "delivered"] as const;
  const HEAD: Record<string, string> = {
    new: "Order placed!",
    confirmed: "Order confirmed",
    delivered: "Delivered",
    cancelled: "Order cancelled",
  };
  const SUB: Record<string, string> = {
    new: "We've received your order. The shop will confirm it shortly.",
    confirmed: "The shop has confirmed your order and is preparing it.",
    delivered: "This order has been delivered. Thank you!",
    cancelled: "This order was cancelled. Contact the shop if this is a mistake.",
  };
  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const cancelled = order.status === "cancelled";

  return (
    <div className="mx-auto max-w-xl space-y-5 text-center">
      <div className={"mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-full " + (cancelled ? "bg-[#FBECEA] text-[#8a2c22]" : "bg-[#E1ECE6] text-primary")}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {cancelled ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M20 6 9 17l-5-5" />}
        </svg>
      </div>

      <div>
        <h1 className="text-lg font-semibold text-ink">{HEAD[order.status]}</h1>
        <p className="text-sm text-muted">Order #{order.id}</p>
        <p className="mt-1 text-xs text-muted">{SUB[order.status]}</p>
      </div>

      {!cancelled && (
        <div className="flex items-center justify-center gap-1.5">
          {STEPS.map((st, i) => (
            <div key={st} className="flex items-center gap-1.5">
              <div className="flex flex-col items-center gap-1">
                <span className={"flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold " + (i <= stepIndex ? "bg-primary text-primary-foreground" : "bg-[#E6EBE9] text-muted")}>{i + 1}</span>
                <span className={"text-[11px] " + (i <= stepIndex ? "text-ink" : "text-muted")}>{st === "new" ? "Placed" : st === "confirmed" ? "Confirmed" : "Delivered"}</span>
              </div>
              {i < STEPS.length - 1 && <span className={"h-0.5 w-8 " + (i < stepIndex ? "bg-primary" : "bg-[#E6EBE9]")} />}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted">Bookmark this page to check your order status anytime.</p>

      {order.trackingNumber && (
        <div className="rounded-xl border border-line bg-surface p-4 text-left text-sm">
          <p className="mb-1 font-medium text-ink">Track your parcel</p>
          <p className="text-muted">
            {order.courier ? <span className="text-ink">{order.courier}</span> : "Courier"} · {order.trackingNumber}
          </p>
          {trackingUrl(order.courier, order.trackingNumber) && (
            <a
              href={trackingUrl(order.courier, order.trackingNumber)!}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Track on {order.courier} →
            </a>
          )}
        </div>
      )}

      <div className="rounded-xl border border-line bg-surface p-4 text-left text-sm">
        <p className="mb-2 font-medium text-ink">Summary</p>
        <ul className="space-y-1">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between">
              <span className="text-muted">
                {i.name} x{i.quantity}{i.variant ? " · " + i.variant : ""}
              </span>
              <span className="text-ink">
                {formatCurrency(i.price * i.quantity, shop.currency)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-line pt-3">
          <Row label="Subtotal" value={formatCurrency(order.subtotal, shop.currency)} />
          <Row label="Delivery" value={formatCurrency(order.deliveryFee, shop.currency)} />
          {order.discount > 0 && (
            <Row
              label={order.discountCode ? `Discount (${order.discountCode})` : "Discount"}
              value={`− ${formatCurrency(order.discount, shop.currency)}`}
            />
          )}
          <div className="flex justify-between pt-1 font-medium text-ink">
            <span>Total</span>
            <span>{formatCurrency(order.total, shop.currency)}</span>
          </div>
          <Row
            label="Payment"
            value={
              order.paymentState === "paid"
                ? "Paid online ✓"
                : order.paymentState === "pending"
                  ? "Payment pending"
                  : order.paymentState === "failed"
                    ? "Payment failed"
                    : order.paymentMethod === "cod"
                      ? "Cash on Delivery"
                      : "Pay online"
            }
          />
        </div>
      </div>

      {order.paymentState === "paid" && (
        <p className="rounded-xl bg-[#EAF3EE] p-3 text-left text-xs text-ink">
          <span className="font-medium">Payment received.</span> Your online payment was confirmed — no cash needed on delivery.
        </p>
      )}
      {order.paymentState === "failed" && (
        <p className="rounded-xl bg-[#FBEAEA] p-3 text-left text-xs text-ink">
          <span className="font-medium">Payment didn&apos;t go through.</span> Your order is saved — contact the seller on WhatsApp to complete payment or switch to Cash on Delivery.
        </p>
      )}

      {order.paymentMethod === "online" && shop.paymentNote && (
        <p className="rounded-xl bg-[#EAF3EE] p-3 text-left text-xs text-ink">
          <span className="font-medium">To pay online:</span> {shop.paymentNote}
        </p>
      )}

      <a href={waLink} target="_blank" rel="noopener noreferrer" className="block">
        <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 py-3 text-sm font-medium text-whatsapp-foreground">
          Confirm on WhatsApp
        </span>
      </a>
      <p className="text-xs text-muted">This opens a chat with {shop.name}.</p>

      {order.status === "delivered" && shop.referralAmount && shop.referralAmount > 0 ? (
        <ReferralCard shopName={shop.name} shopSlug={shop.slug} token={order.publicToken} amount={shop.referralAmount} />
      ) : null}

      <Link href={`/${shop.slug}`} className="inline-block text-sm text-primary">
        Continue shopping
      </Link>

      <p className="pt-2 text-center text-[11px] text-muted">
        Sell something yourself?{" "}
        <Link href="/?src=tracking" className="font-medium text-primary hover:underline">
          Open your own shop free →
        </Link>
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
