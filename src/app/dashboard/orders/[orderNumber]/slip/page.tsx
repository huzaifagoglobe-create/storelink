import { notFound } from "next/navigation";
import { requireSeller } from "@/server/auth/current-seller";
import { getShopOrderByNumber } from "@/server/services/order-service";
import { formatCurrency } from "@/lib/format";
import { PrintButton } from "@/components/dashboard/print-button";

/**
 * Printable packing slip: everything the courier and the buyer need, on one
 * clean sheet the seller can tape to the parcel. Print styles strip the chrome.
 */
export default async function PackingSlipPage({ params: _p }: { params: Promise<{ orderNumber: string }> }) {
  const params = await _p;
  const { shop } = await requireSeller();
  const order = await getShopOrderByNumber(shop.id, params.orderNumber);
  if (!order) notFound();

  const codDue = order.paymentMethod === "cod" && order.paymentState !== "paid";

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-muted">Packing slip · Order #{order.id}</p>
        <PrintButton />
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 print:rounded-none print:border-0 print:p-0">
        {/* Shop header */}
        <div className="flex items-start justify-between gap-3 border-b border-dashed border-line pb-4">
          <div>
            <p className="text-lg font-bold text-ink">{shop.name}</p>
            {shop.whatsapp && <p className="text-xs text-muted">WhatsApp: {shop.whatsapp}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-ink">Order #{order.id}</p>
            <p className="text-xs text-muted">{new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
        </div>

        {/* Deliver to */}
        <div className="border-b border-dashed border-line py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Deliver to</p>
          <p className="mt-1 text-base font-bold text-ink">{order.customerName}</p>
          <p className="text-sm font-medium text-ink">{order.customerPhone}</p>
          <p className="mt-1 text-sm text-ink">
            {order.address}
            {order.city ? `, ${order.city}` : ""}
          </p>
        </div>

        {/* Items */}
        <div className="border-b border-dashed border-line py-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Items</p>
          <table className="w-full text-sm">
            <tbody>
              {order.items.map((it) => (
                <tr key={it.id}>
                  <td className="py-1 pr-2 text-ink">
                    {it.name}
                    {it.variant ? <span className="text-muted"> · {it.variant}</span> : null}
                  </td>
                  <td className="py-1 pr-2 text-right text-muted">×{it.quantity}</td>
                  <td className="py-1 text-right text-ink">{formatCurrency(it.price * it.quantity, shop.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="space-y-1 py-4 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal, shop.currency)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Delivery</span>
            <span>{order.deliveryFee > 0 ? formatCurrency(order.deliveryFee, shop.currency) : "Free"}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-muted">
              <span>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</span>
              <span>−{formatCurrency(order.discount, shop.currency)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-ink">
            <span>Total</span>
            <span>{formatCurrency(order.total, shop.currency)}</span>
          </div>
        </div>

        {/* Payment box */}
        <div
          className={
            "rounded-xl border-2 p-3 text-center " +
            (codDue ? "border-ink" : "border-line bg-[#EAF3EE]")
          }
        >
          {codDue ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Cash on Delivery — collect</p>
              <p className="text-2xl font-extrabold text-ink">{formatCurrency(order.total, shop.currency)}</p>
            </>
          ) : (
            <p className="text-sm font-bold text-ink">PAID {order.paymentState === "paid" ? "ONLINE ✓" : "✓"} — do not collect cash</p>
          )}
        </div>

        {(order.courier || order.trackingNumber) && (
          <p className="mt-3 text-center text-xs text-muted">
            {order.courier ?? ""} {order.trackingNumber ? `· Tracking: ${order.trackingNumber}` : ""}
          </p>
        )}
        <p className="mt-3 text-center text-[11px] text-muted">Thank you for your order! 💚 {shop.name}</p>
      </div>
    </div>
  );
}
