import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSeller } from "@/server/auth/current-seller";
import { getShopOrderByNumber } from "@/server/services/order-service";
import { buildCustomerWhatsappLink } from "@/server/whatsapp";
import { formatCurrency } from "@/lib/format";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { OrderStatusControl } from "@/components/dashboard/order-status-control";
import { OrderEditForm } from "@/components/dashboard/order-edit-form";
import { OrderTrackingForm } from "@/components/dashboard/order-tracking-form";
import { toggleCodCollectedAction } from "@/server/actions/order-actions";
import { getBuyerTrust } from "@/server/services/buyer-trust-service";
import { SITE_URL } from "@/lib/site";

export default async function OrderDetailPage({
  params: _p,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const params = await _p;
  const { shop } = await requireSeller();
  const order = await getShopOrderByNumber(shop.id, params.orderNumber);
  if (!order) notFound();
  const trust = await getBuyerTrust(order.customerPhone, shop.id);
  const wa = order.customerPhone.replace(/\D/g, "");
  const trackUrl = `${SITE_URL}/${shop.slug}/order/${order.publicToken}`;
  const waMsg = (text: string) => `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
  const msgConfirm = `Assalam o Alaikum ${order.customerName}! 👋\nYour order #${order.id} at ${shop.name} is CONFIRMED ✅\nTotal: Rs ${order.total.toLocaleString()}${order.paymentMethod === "cod" ? " (Cash on Delivery)" : ""}.\nTrack it here: ${trackUrl}`;
  const msgShipped = `Good news ${order.customerName}! 📦\nYour order #${order.id} from ${shop.name} has been SHIPPED${order.courier ? ` with ${order.courier}` : ""}${order.trackingNumber ? `\nTracking number: ${order.trackingNumber}` : ""}.\nFollow it live: ${trackUrl}`;
  const msgDelivered = `Thank you ${order.customerName}! 💚\nHope you love your order from ${shop.name}. If anything's not right, just reply here — we fix it fast. See you again soon!`;
  const msgReview = `Thank you for shopping with ${shop.name}, ${order.customerName}! 🌟\nIf you have 30 seconds, a quick rating helps our small business a lot — just open your order page and tap the stars: ${trackUrl}\nJazakAllah! 💚`;
  const waLink = buildCustomerWhatsappLink(order, shop.name);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/dashboard/orders" className="text-sm text-primary">
        ← Back to orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Order #{order.id}</h1>
          <p className="text-sm text-muted">
            {order.paymentState === "paid"
              ? "Paid online ✓"
              : order.paymentState === "pending"
                ? "Online payment pending"
                : order.paymentState === "failed"
                  ? "Online payment failed"
                  : order.paymentMethod === "cod"
                    ? "Cash on Delivery"
                    : "Pay online (manual)"}
          </p>
        </div>
        <div className="flex flex-none flex-wrap items-center gap-2">
          {trust.tier === "trusted" && (
            <span className="rounded-full bg-[#E7F2EC] px-2.5 py-1 text-xs font-semibold text-[#2C6B57]" title={`${trust.deliveredAll} delivered across StoreLink, ${trust.deliveredHere} in your shop`}>
              ✅ Trusted buyer · {trust.deliveredAll} delivered
            </span>
          )}
          {trust.tier === "risky" && (
            <span className="rounded-full bg-[#FBECEA] px-2.5 py-1 text-xs font-semibold text-[#C0362C]" title={`${trust.cancelledAll} cancelled/refused across StoreLink`}>
              ⚠️ {trust.cancelledAll} refused/cancelled before — confirm on WhatsApp first
            </span>
          )}
          {trust.tier === "new" && (
            <span className="rounded-full bg-[#F1EFEB] px-2.5 py-1 text-xs font-medium text-muted">New buyer</span>
          )}
          <Link
            href={`/dashboard/orders/${order.id}/slip`}
            className="rounded-xl border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:border-primary"
          >
            🖨️ Packing slip
          </Link>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4 text-sm">
          <p className="mb-2 font-medium text-ink">Customer</p>
          <p className="text-ink">{order.customerName}</p>
          <p className="text-muted">{order.customerPhone}</p>
          {order.customerEmail && (
            <p className="text-muted">{order.customerEmail}</p>
          )}
          <p className="mt-1 text-muted">
            {order.address}, {order.city}
          </p>
          <p className="mt-3 text-xs text-muted">Call the customer to confirm this order:</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <a
              href={`tel:${order.customerPhone}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink"
            >
              Call
            </a>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-3 py-2 text-sm font-medium text-whatsapp-foreground"
            >
              Message on WhatsApp
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 text-sm">
          <p className="mb-2 font-medium text-ink">Update status</p>
          <OrderStatusControl orderNumber={order.id} current={order.status} />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 text-sm">
        <p className="mb-1 font-medium text-ink">Update your customer — one tap</p>
        <p className="mb-3 text-xs text-muted">
          Opens WhatsApp with the message already written (order number, tracking, link — all filled in). Just press send.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href={waMsg(msgConfirm)} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-line px-3 py-2 text-xs font-medium text-ink transition hover:border-primary">
            ✅ Order confirmed
          </a>
          <a href={waMsg(msgShipped)} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-whatsapp px-3 py-2 text-xs font-medium text-whatsapp-foreground">
            📦 Shipped + tracking
          </a>
          <a href={waMsg(msgDelivered)} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-line px-3 py-2 text-xs font-medium text-ink transition hover:border-primary">
            💚 Thank you
          </a>
          <a href={waMsg(msgReview)} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-line px-3 py-2 text-xs font-medium text-ink transition hover:border-primary">
            ⭐ Ask for a review
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 text-sm">
        <p className="mb-1 font-medium text-ink">Shipping &amp; tracking</p>
        <p className="mb-3 text-xs text-muted">
          Book with your courier, then add the tracking number here so your customer can follow their order.
        </p>
        <OrderTrackingForm orderNumber={order.id} courier={order.courier} trackingNumber={order.trackingNumber} />
      </div>

      {order.paymentMethod === "cod" && order.paymentState !== "paid" && (
        <div className={"rounded-2xl border p-4 text-sm " + (order.codCollected ? "border-[#bfe0cd] bg-[#EAF3EE]" : "border-line bg-surface")}>
          <p className="mb-1 font-medium text-ink">Cash collection (COD)</p>
          <p className="mb-3 text-xs text-muted">
            {order.codCollected
              ? "You've marked the cash for this order as received."
              : "Once you receive the cash for this delivery, mark it collected to keep your books straight."}
          </p>
          <form action={toggleCodCollectedAction}>
            <input type="hidden" name="orderNumber" value={order.id} />
            <input type="hidden" name="collected" value={(!order.codCollected).toString()} />
            <button
              type="submit"
              className={
                order.codCollected
                  ? "rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-ink"
                  : "rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              }
            >
              {order.codCollected ? "Mark as not collected" : "Mark cash collected ✓"}
            </button>
          </form>
        </div>
      )}

      <div className="rounded-2xl border border-line bg-surface p-4 text-sm">
        <p className="mb-2 font-medium text-ink">Items</p>
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
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span className="text-ink">{formatCurrency(order.subtotal, shop.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Delivery</span>
            <span className="text-ink">{formatCurrency(order.deliveryFee, shop.currency)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted">
                Discount{order.discountCode ? ` (${order.discountCode})` : ""}
              </span>
              <span className="text-primary">− {formatCurrency(order.discount, shop.currency)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 font-medium text-ink">
            <span>Total</span>
            <span>{formatCurrency(order.total, shop.currency)}</span>
          </div>
        </div>
      </div>

      <OrderEditForm
        orderNumber={order.id}
        currency={shop.currency}
        deliveryFee={order.deliveryFee}
        discount={order.discount}
        customerName={order.customerName}
        customerPhone={order.customerPhone}
        customerEmail={order.customerEmail}
        address={order.address}
        city={order.city}
        items={order.items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, variant: i.variant }))}
      />
    </div>
  );
}
