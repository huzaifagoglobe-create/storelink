import { requireAdmin } from "@/server/auth/current-admin";
import { listAllShops } from "@/server/services/shop-service";
import { listShopOrders } from "@/server/services/order-service";
import { getProductsByShop } from "@/server/services/product-service";
import { formatCurrency } from "@/lib/format";

const DAY = 86400000;

/**
 * Growth: where the platform is going, and where sellers die. Signups per
 * week, GMV trend, and the activation funnel (signed up → added product →
 * first order) — the numbers behind every decision and every investor call.
 */
export default async function AdminGrowthPage() {
  await requireAdmin();
  const shops = await listAllShops();
  const now = Date.now();

  // Signups per week (last 8 weeks, oldest → newest).
  const weeks: { label: string; count: number }[] = [];
  for (let w = 7; w >= 0; w--) {
    const start = now - (w + 1) * 7 * DAY;
    const end = now - w * 7 * DAY;
    const count = shops.filter((s) => {
      const t = new Date(s.createdAt).getTime();
      return t >= start && t < end;
    }).length;
    weeks.push({ label: w === 0 ? "this wk" : `−${w}w`, count });
  }
  const maxWeek = Math.max(1, ...weeks.map((w) => w.count));

  // Orders + GMV across the platform (all shops), plus activation funnel.
  let totalOrders = 0;
  let deliveredGmv = 0;
  let orders7d = 0;
  let withProducts = 0;
  let withOrders = 0;
  for (const s of shops) {
    const [orders, products] = await Promise.all([listShopOrders(s.id), getProductsByShop(s.id)]);
    if (products.length > 0) withProducts++;
    if (orders.length > 0) withOrders++;
    totalOrders += orders.length;
    for (const o of orders) {
      if (o.status === "delivered") deliveredGmv += o.total;
      if (now - new Date(o.createdAt).getTime() < 7 * DAY) orders7d++;
    }
  }

  const funnel = [
    { label: "Signed up", n: shops.length, hint: "created a shop" },
    { label: "Added a product", n: withProducts, hint: "shop has ≥1 product" },
    { label: "Got an order", n: withOrders, hint: "shop has ≥1 order" },
  ];
  const pct = (n: number) => (shops.length > 0 ? Math.round((n / shops.length) * 100) : 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-ink">Growth</h1>
        <p className="text-sm text-muted">Signups, sales volume, and where sellers get stuck.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xl font-semibold text-ink">{shops.length}</p>
          <p className="mt-0.5 text-xs text-muted">Total shops</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xl font-semibold text-ink">{totalOrders}</p>
          <p className="mt-0.5 text-xs text-muted">Total orders (all time)</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xl font-semibold text-ink">{orders7d}</p>
          <p className="mt-0.5 text-xs text-muted">Orders — last 7 days</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xl font-semibold text-[#2C6B57]">{formatCurrency(deliveredGmv)}</p>
          <p className="mt-0.5 text-xs text-muted">Delivered GMV (all time)</p>
        </div>
      </div>

      {/* Signups per week */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="mb-3 text-sm font-semibold text-ink">New shops per week</p>
        <div className="flex items-end gap-2" style={{ height: 120 }}>
          {weeks.map((w) => (
            <div key={w.label} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[11px] font-medium text-ink">{w.count}</span>
              <div
                className="w-full rounded-t-md bg-primary/70"
                style={{ height: `${Math.max(4, (w.count / maxWeek) * 90)}px` }}
              />
              <span className="text-[10px] text-muted">{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Signups by source / promo */}
      {(() => {
        const bySource = new Map<string, number>();
        for (const s of shops) {
          const key = s.promoCode ? `code: ${s.promoCode}` : s.signupSource || "direct / unknown";
          bySource.set(key, (bySource.get(key) ?? 0) + 1);
        }
        const rows = [...bySource.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
        return (
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-sm font-semibold text-ink">Signups by source</p>
            <p className="mb-3 mt-1 text-xs text-muted">Where shops come from (?src links and promo codes). Double down on what works.</p>
            <ul className="space-y-1.5">
              {rows.map(([k, v]) => (
                <li key={k} className="flex items-center justify-between rounded-xl bg-[#f6f8f6] px-3 py-2 text-sm">
                  <span className="text-ink">{k}</span>
                  <span className="font-semibold text-ink">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      {/* Activation funnel */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-sm font-semibold text-ink">Activation funnel</p>
        <p className="mb-3 mt-1 text-xs text-muted">
          Where sellers get stuck: a gap between steps 1→2 is an onboarding problem; between 2→3 it&apos;s a
          &quot;bringing buyers&quot; problem.
        </p>
        <div className="space-y-2">
          {funnel.map((f) => (
            <div key={f.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink">{f.label}</span>
                <span className="text-muted">
                  {f.n} ({pct(f.n)}%)
                </span>
              </div>
              <div className="mt-1 h-2.5 w-full rounded-full bg-[#eef3f0]">
                <div className="h-2.5 rounded-full bg-primary/70" style={{ width: `${pct(f.n)}%` }} />
              </div>
              <p className="mt-0.5 text-[10px] text-muted">{f.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
