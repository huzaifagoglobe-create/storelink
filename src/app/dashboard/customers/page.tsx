import { requireSeller } from "@/server/auth/current-seller";
import { listCustomers } from "@/server/services/customer-service";
import { formatCurrency } from "@/lib/format";
import { BroadcastTool } from "@/components/dashboard/broadcast-tool";

export default async function CustomersPage() {
  const { shop } = await requireSeller();
  const customers = await listCustomers(shop.id);

  // Sort by spend (best customers first), then order count.
  const sorted = [...customers].sort((a, b) => b.totalSpent - a.totalSpent || b.orderCount - a.orderCount);
  const repeatCount = customers.filter((c) => c.orderCount > 1).length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-ink">Customers</h1>
        <p className="text-sm text-muted">Everyone who has ordered from your shop.</p>
      </div>

      {customers.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">Total customers</p>
            <p className="mt-1 text-xl font-semibold text-ink">{customers.length}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">Repeat buyers</p>
            <p className="mt-1 text-xl font-semibold text-ink">{repeatCount}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">Delivered revenue</p>
            <p className="mt-1 text-xl font-semibold text-ink">{formatCurrency(totalRevenue, shop.currency)}</p>
          </div>
        </div>
      )}

      {customers.length > 0 && <BroadcastTool customers={sorted.map((c) => ({ name: c.name, phone: c.phone }))} shopName={shop.name} />}

      {customers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
          No customers yet. Orders will build this list automatically.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <ul className="divide-y divide-line">
            {sorted.map((c) => (
              <li key={c.phone || c.name} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#EAF3EE] text-xs font-semibold uppercase text-primary">
                  {c.name.slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-medium text-ink">
                    {c.name}
                    {c.orderCount > 1 && (
                      <span className="flex-none rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-[#1E3A30]">
                        Repeat ×{c.orderCount}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted">{c.phone || "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-ink">
                    {c.orderCount} {c.orderCount === 1 ? "order" : "orders"}
                  </p>
                  <p className="text-xs text-muted">{formatCurrency(c.totalSpent, shop.currency)} spent</p>
                </div>
                {c.phone && (
                  <div className="flex gap-2">
                    <a href={`tel:${c.phone}`} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink">
                      Call
                    </a>
                    <a
                      href={`https://wa.me/${c.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-whatsapp px-3 py-1.5 text-xs font-medium text-whatsapp-foreground"
                    >
                      WhatsApp
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
