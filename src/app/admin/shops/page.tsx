import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-admin";
import { listAdminShops } from "@/server/services/admin-service";
import { formatCurrency } from "@/lib/format";
import { PlanBadge, ActiveBadge } from "@/components/admin/badges";

export const metadata = { title: "Admin · Shops" };

export default async function AdminShops() {
  await requireAdmin();
  const rows = await listAdminShops();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Shops</h1>
        <p className="text-sm text-muted">{rows.length} total</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Shop</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Orders</th>
              <th className="px-4 py-3 text-right font-medium">Revenue</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(({ shop, orderCount, revenue }) => (
              <tr key={shop.id} className="hover:bg-[#f7faf8]">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{shop.name}</p>
                  <p className="text-xs text-muted">/{shop.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <PlanBadge plan={shop.plan} />
                </td>
                <td className="px-4 py-3">
                  <ActiveBadge active={shop.isActive} />
                </td>
                <td className="px-4 py-3 text-right text-ink">{orderCount}</td>
                <td className="px-4 py-3 text-right text-ink">{formatCurrency(revenue)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/shops/${shop.id}`}
                    className="text-sm font-medium text-primary"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
