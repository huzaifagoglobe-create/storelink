import Link from "next/link";
import { requireSeller } from "@/server/auth/current-seller";
import { listShopOrders } from "@/server/services/order-service";
import { formatCurrency } from "@/lib/format";
import { StatusBadge } from "@/components/dashboard/status-badge";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

export default async function OrdersPage() {
  const { shop } = await requireSeller();
  const orders = await listShopOrders(shop.id);

  // COD reconciliation: for delivered COD orders, how much cash is collected vs
  // still owed. Online-paid orders don't count (money already received).
  const deliveredCod = orders.filter(
    (o) => o.status === "delivered" && o.paymentMethod === "cod" && o.paymentState !== "paid"
  );
  const codCollected = deliveredCod.filter((o) => o.codCollected).reduce((s, o) => s + o.total, 0);
  const codPending = deliveredCod.filter((o) => !o.codCollected).reduce((s, o) => s + o.total, 0);
  const pendingCount = deliveredCod.filter((o) => !o.codCollected).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Orders</h1>
          <p className="text-sm text-muted">{orders.length} total</p>
        </div>
        <div className="flex flex-none items-center gap-2">
          <Link href="/dashboard/orders/new" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
            + Add WhatsApp order
          </Link>
        {orders.length > 0 && (
          // eslint-disable-next-line @next/next/no-html-link-for-pages -- file download (Content-Disposition: attachment), not page navigation
          <a
            href="/api/dashboard/orders/export"
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:border-primary"
          >
            Download CSV
          </a>
        )}
        </div>
      </div>

      {deliveredCod.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">COD cash collected</p>
            <p className="mt-1 text-lg font-semibold text-primary">{formatCurrency(codCollected, shop.currency)}</p>
          </div>
          <div className={"rounded-2xl border p-4 " + (codPending > 0 ? "border-[#E7C98A] bg-[#FBF7EC]" : "border-line bg-surface")}>
            <p className="text-xs text-muted">COD still to collect</p>
            <p className="mt-1 text-lg font-semibold text-ink">{formatCurrency(codPending, shop.currency)}</p>
            {pendingCount > 0 && <p className="text-[11px] text-muted">{pendingCount} delivered order{pendingCount > 1 ? "s" : ""} awaiting cash</p>}
          </div>
        </div>
      )}

      {pendingCount > 0 && (
        <details className="rounded-2xl border border-[#E7C98A] bg-[#FBF7EC] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-ink">
            ⚠️ {pendingCount} parcel{pendingCount > 1 ? "s" : ""} delivered but cash not received — the list to chase
            with your courier
          </summary>
          <p className="mt-2 text-xs text-muted">
            These orders were delivered (buyer paid the rider) but you haven&apos;t marked the cash as received. When
            your courier settles, tick each one off on its order page — whatever stays here is money to chase.
          </p>
          <ul className="mt-3 space-y-1.5">
            {deliveredCod
              .filter((o) => !o.codCollected)
              .slice(0, 25)
              .map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/dashboard/orders/${o.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2 text-sm transition hover:bg-white"
                  >
                    <span className="min-w-0 truncate text-ink">
                      #{o.id} · {o.customerName}
                      {o.courier ? <span className="text-muted"> · {o.courier}</span> : null}
                    </span>
                    <span className="flex-none font-semibold text-ink">{formatCurrency(o.total, shop.currency)}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </details>
      )}

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-sm text-muted">
            No orders yet. Share your shop link to start selling.
          </p>
          <Link
            href={`/${shop.slug}`}
            target="_blank"
            className="mt-3 inline-flex rounded-xl border border-primary px-4 py-2 text-sm font-medium text-primary"
          >
            View your shop ↗
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Order</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Total</th>
                <th className="px-4 py-2.5 font-medium">Payment</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-[#f7faf8]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      className="font-medium text-ink hover:text-primary"
                    >
                      #{o.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink">
                    <Link href={`/dashboard/orders/${o.id}`} className="hover:text-primary">
                      {o.customerName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink">{formatCurrency(o.total, shop.currency)}</td>
                  <td className="px-4 py-3 text-muted">
                    {o.paymentMethod === "cod" ? "COD" : "Online"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
