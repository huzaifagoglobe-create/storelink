import { requireAdmin } from "@/server/auth/current-admin";
import { listOpenReports } from "@/server/services/report-service";
import { listAllShops } from "@/server/services/shop-service";
import { dismissReportAction } from "@/server/actions/report-actions";
import { setShopActiveAction } from "@/server/actions/admin-actions";
import { TRUST } from "@/server/trust";

const REASON_LABEL: Record<string, string> = {
  didnt_deliver: "Didn't deliver after payment",
  fake_products: "Fake or wrong products",
  fraud: "Fraud / scam",
  other: "Other",
};

export const metadata = { title: "Admin · Reports" };

export default async function AdminReports() {
  await requireAdmin();
  const [reports, shops] = await Promise.all([listOpenReports(), listAllShops()]);
  const shopById = new Map(shops.map((s) => [s.id, s]));
  const byShop = new Map<string, typeof reports>();
  for (const r of reports) {
    const arr = byShop.get(r.shopId) ?? [];
    arr.push(r);
    byShop.set(r.shopId, arr);
  }
  const groups = [...byShop.entries()]
    .map(([shopId, rs]) => ({ shopId, shop: shopById.get(shopId), reports: rs }))
    .sort((a, b) => b.reports.length - a.reports.length);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Reported shops</h1>
        <p className="text-sm text-muted">
          {reports.length} open report{reports.length === 1 ? "" : "s"}
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
          No open reports.
        </div>
      ) : (
        <ul className="space-y-3">
          {groups.map((g) => {
            const flagged = g.reports.length >= TRUST.REPORT_FLAG;
            return (
              <li key={g.shopId} className={"rounded-2xl border bg-surface p-4 " + (flagged ? "border-[#E0B4B0]" : "border-line")}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{g.shop?.name ?? "Unknown shop"}</p>
                    <p className="text-xs text-muted">
                      {g.shop ? `/${g.shop.slug} · ` : ""}
                      {g.reports.length} report{g.reports.length === 1 ? "" : "s"}
                      {flagged ? " · needs urgent review" : ""}
                      {g.shop && !g.shop.isActive ? " · suspended" : ""}
                    </p>
                  </div>
                  {g.shop && g.shop.isActive && (
                    <form action={setShopActiveAction}>
                      <input type="hidden" name="shopId" value={g.shopId} />
                      <input type="hidden" name="next" value="" />
                      <button type="submit" className="shrink-0 rounded-lg border border-[#C0362C] px-3 py-1.5 text-sm font-medium text-[#C0362C]">
                        Suspend shop
                      </button>
                    </form>
                  )}
                </div>
                <ul className="mt-3 space-y-2">
                  {g.reports.map((r) => (
                    <li key={r.id} className="flex items-start justify-between gap-3 rounded-lg bg-[#f7faf8] px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm text-ink">{REASON_LABEL[r.reason] ?? r.reason}</p>
                        {r.details && <p className="text-xs text-muted">{r.details}</p>}
                      </div>
                      <form action={dismissReportAction}>
                        <input type="hidden" name="reportId" value={r.id} />
                        <button type="submit" className="shrink-0 text-xs font-medium text-muted hover:text-ink">
                          Dismiss
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
