import { requireSeller } from "@/server/auth/current-seller";
import { listShopOrders } from "@/server/services/order-service";
import { getProductsByShop } from "@/server/services/product-service";
import { formatCurrency } from "@/lib/format";
import { PLAN_LABEL } from "@/server/plans";
import { resolveRange, inRange } from "@/lib/date-range";
import { ReportRange } from "@/components/dashboard/report-range";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}

export default async function ReportsPage({
  searchParams: _sp,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { shop } = await requireSeller();
  const allowed = shop.plan === "pro" || shop.plan === "premium";

  if (!allowed) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-lg font-semibold text-ink">Sales reports</h1>
        <div className="rounded-2xl border border-line bg-surface p-6 text-center">
          <p className="text-sm font-medium text-ink">Reports are a Pro feature</p>
          <p className="mt-1 text-sm text-muted">
            You&apos;re on the {PLAN_LABEL[shop.plan]} plan. Upgrade to Pro or Premium to see sales,
            revenue, and order trends.
          </p>
        </div>
      </div>
    );
  }

  const searchParams = await _sp;
  const orders = await listShopOrders(shop.id);
  const { start, end, key, label } = resolveRange({
    range: typeof searchParams.range === "string" ? searchParams.range : undefined,
    from: typeof searchParams.from === "string" ? searchParams.from : undefined,
    to: typeof searchParams.to === "string" ? searchParams.to : undefined,
  });
  const ranged = orders.filter((o) => inRange(o.createdAt, start, end));
  const rDelivered = ranged.filter((o) => o.status === "delivered");
  const revenue = rDelivered.reduce((s, o) => s + o.total, 0);

  // Profit = (sell − cost) × qty on delivered orders. Uses the cost saved on
  // each order item; items without one fall back to the product's current cost
  // price; items with no cost anywhere count at 0 cost and are flagged below.
  const products = await getProductsByShop(shop.id);
  const costOf = new Map(products.map((pr) => [pr.id, pr.costPrice]));
  let profit = 0;
  let itemsMissingCost = 0;
  for (const o of rDelivered) {
    for (const it of o.items) {
      const unitCost = it.cost ?? costOf.get(it.productId) ?? null;
      if (unitCost === null) itemsMissingCost += it.quantity;
      profit += (it.price - (unitCost ?? 0)) * it.quantity;
    }
  }
  const pendingRevenue = ranged
    .filter((o) => o.status === "new" || o.status === "confirmed")
    .reduce((s, o) => s + o.total, 0);

  // Fixed 6-month trend (independent of the selected range).
  const allDelivered = orders.filter((o) => o.status === "delivered");
  const now = new Date();
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = (mk: string) => {
    const [y, m] = mk.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
  };
  const buckets: { key: string; revenue: number; orders: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: monthKey(d), revenue: 0, orders: 0 });
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  for (const o of allDelivered) {
    const i = idx.get(monthKey(new Date(o.createdAt)));
    if (i !== undefined) {
      buckets[i].revenue += o.total;
      buckets[i].orders += 1;
    }
  }
  const maxRev = Math.max(1, ...buckets.map((b) => b.revenue));

  const statuses: { status: string; count: number }[] = [
    { status: "new", count: ranged.filter((o) => o.status === "new").length },
    { status: "confirmed", count: ranged.filter((o) => o.status === "confirmed").length },
    { status: "delivered", count: rDelivered.length },
    { status: "cancelled", count: ranged.filter((o) => o.status === "cancelled").length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">Sales reports</h1>
        <p className="text-sm text-muted">How your shop is performing.</p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <ReportRange activeKey={key} />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Revenue (delivered)" value={formatCurrency(revenue, shop.currency)} />
          <Stat label="Profit (delivered)" value={formatCurrency(profit, shop.currency)} />
          <Stat label="Pending revenue" value={formatCurrency(pendingRevenue, shop.currency)} />
          <Stat label="Orders" value={String(ranged.length)} />
        </div>
        {itemsMissingCost > 0 && (
          <p className="text-xs text-muted">
            💡 {itemsMissingCost} sold item{itemsMissingCost > 1 ? "s have" : " has"} no cost price, so profit is
            overstated. Add cost prices to your products for an accurate figure.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="mb-3 text-sm font-semibold text-ink">Revenue — last 6 months</p>
        <div className="space-y-2">
          {buckets.map((b) => (
            <div key={b.key} className="flex items-center gap-3">
              <span className="w-20 flex-none text-xs text-muted">{monthLabel(b.key)}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#EEF3F0]">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(b.revenue / maxRev) * 100}%` }} />
              </div>
              <span className="w-24 flex-none text-right text-xs font-medium text-ink">
                {formatCurrency(b.revenue, shop.currency)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="mb-3 text-sm font-semibold text-ink">Orders by status · {label}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statuses.map((s) => (
            <div key={s.status}>
              <p className="text-2xl font-semibold text-ink">{s.count}</p>
              <p className="text-xs capitalize text-muted">{s.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
