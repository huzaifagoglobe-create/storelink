import Link from "next/link";
import { PLAN_TIERS, PLAN_LABEL } from "@/server/plans";
import { requireAdmin } from "@/server/auth/current-admin";
import { listAdminShops, summarizeShops } from "@/server/services/admin-service";
import { listPendingVerifications } from "@/server/services/verification-service";
import { listOpenReports } from "@/server/services/report-service";
import { formatCurrency } from "@/lib/format";
import { PlanBadge, ActiveBadge } from "@/components/admin/badges";
import { RevenueProvider, RevenueToggle, SecretMoney } from "@/components/admin/revenue-visibility";

export const metadata = { title: "Admin · Overview" };

export default async function AdminOverview() {
  await requireAdmin();
  const rows = await listAdminShops();
  const stats = summarizeShops(rows);
  const pendingVerifications = (await listPendingVerifications()).length;
  const openReports = (await listOpenReports()).length;
  const recent = rows.slice(0, 6);

  const cards = [
    { label: "Shops", value: String(stats.totalShops) },
    { label: "Active", value: String(stats.activeShops) },
    { label: "Paused", value: String(stats.pausedShops) },
    { label: "Total orders", value: String(stats.totalOrders) },
  ];

  return (
    <RevenueProvider>
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">Platform overview</h1>
        <p className="text-sm text-muted">Every shop on StoreLink.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xl font-semibold text-ink">{c.value}</p>
            <p className="mt-0.5 text-xs text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink">Revenue</p>
          <RevenueToggle />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xl font-semibold text-ink">
              <SecretMoney value={formatCurrency(stats.totalRevenue)} />
            </p>
            <p className="mt-0.5 text-xs text-muted">Order revenue</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-ink">
              <SecretMoney value={formatCurrency(stats.mrr)} />
            </p>
            <p className="mt-0.5 text-xs text-muted">Est. MRR</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">Hidden by default — tap Show to reveal.</p>
      </div>

      <Link
        href="/admin/verifications"
        className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 transition hover:border-primary"
      >
        <span className="text-sm font-medium text-ink">Seller verifications</span>
        <span className="text-sm text-muted">{pendingVerifications} pending →</span>
      </Link>

      <Link
        href="/admin/reports"
        className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 transition hover:border-primary"
      >
        <span className="text-sm font-medium text-ink">Reported shops</span>
        <span className="text-sm text-muted">{openReports} open →</span>
      </Link>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-sm font-medium text-ink">Plans</p>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
          {PLAN_TIERS.map((t) => (
            <span key={t}>
              {PLAN_LABEL[t]}: <span className="font-medium text-ink">{stats.planCounts[t]}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-sm font-medium text-ink">Shops</p>
          <Link href="/admin/shops" className="text-xs font-medium text-primary">
            See all
          </Link>
        </div>
        <ul className="divide-y divide-line">
          {recent.map(({ shop, orderCount, revenue }) => (
            <li key={shop.id}>
              <Link
                href={`/admin/shops/${shop.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#f7faf8]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{shop.name}</p>
                  <p className="truncate text-xs text-muted">
                    /{shop.slug} · {orderCount} orders · <SecretMoney value={formatCurrency(revenue)} />
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <PlanBadge plan={shop.plan} />
                  <ActiveBadge active={shop.isActive} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
    </RevenueProvider>
  );
}
