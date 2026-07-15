import Link from "next/link";
import { requireSeller } from "@/server/auth/current-seller";
import { listShopOrders } from "@/server/services/order-service";
import { getProductsByShop } from "@/server/services/product-service";
import { listExpenses } from "@/server/services/expense-service";
import { removeExpenseAction } from "@/server/actions/expense-actions";
import { ExpenseForm } from "@/components/dashboard/expense-form";
import { formatCurrency } from "@/lib/format";

/**
 * Khata: the seller's whole business in one page. Sales come in automatically
 * from delivered orders, product costs from cost prices — the seller only adds
 * expenses (packaging, courier, ads…). Result: REAL monthly profit, not a
 * guess. The books most small sellers never had.
 */
export default async function KhataPage({ searchParams: _sp }: { searchParams: Promise<{ m?: string }> }) {
  const { shop } = await requireSeller();
  const sp = await _sp;
  const month = /^\d{4}-\d{2}$/.test(sp.m ?? "") ? (sp.m as string) : new Date().toISOString().slice(0, 7);

  const [orders, products, expenses] = await Promise.all([
    listShopOrders(shop.id),
    getProductsByShop(shop.id),
    listExpenses(shop.id, month),
  ]);

  // Delivered sales + product costs for this month.
  const costOf = new Map(products.map((p) => [p.id, p.costPrice]));
  let sales = 0;
  let productCosts = 0;
  let missingCost = 0;
  for (const o of orders) {
    if (o.status !== "delivered" || !o.createdAt.startsWith(month)) continue;
    sales += o.total;
    for (const it of o.items) {
      const unitCost = it.cost ?? costOf.get(it.productId) ?? null;
      if (unitCost === null) missingCost += it.quantity;
      productCosts += (unitCost ?? 0) * it.quantity;
    }
  }
  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  const net = sales - productCosts - spent;

  // Month navigation.
  const [y, m] = month.split("-").map(Number);
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const nowMonth = new Date().toISOString().slice(0, 7);
  const monthLabel = new Date(`${month}-15`).toLocaleDateString("en-PK", { month: "long", year: "numeric" });

  const byCat = new Map<string, number>();
  for (const e of expenses) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Khata</h1>
          <p className="text-sm text-muted">Your real monthly profit — sales in, costs out, nothing hidden.</p>
        </div>
        <div className="flex flex-none items-center gap-1 text-sm">
          <Link href={`/dashboard/khata?m=${prev}`} className="rounded-lg border border-line px-2.5 py-1.5 text-ink hover:border-primary" aria-label="Previous month">
            ←
          </Link>
          <span className="min-w-32 px-1 text-center font-medium text-ink">{monthLabel}</span>
          {month < nowMonth ? (
            <Link href={`/dashboard/khata?m=${next}`} className="rounded-lg border border-line px-2.5 py-1.5 text-ink hover:border-primary" aria-label="Next month">
              →
            </Link>
          ) : (
            <span className="rounded-lg border border-line px-2.5 py-1.5 text-muted opacity-40">→</span>
          )}
        </div>
      </div>

      {/* The month's books */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted">Sales (delivered orders)</dt>
            <dd className="font-semibold text-ink">{formatCurrency(sales, shop.currency)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted">− Product costs</dt>
            <dd className="text-ink">{formatCurrency(productCosts, shop.currency)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted">− Expenses ({expenses.length})</dt>
            <dd className="text-ink">{formatCurrency(spent, shop.currency)}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-2">
            <dt className="font-semibold text-ink">= Net profit</dt>
            <dd className={"text-lg font-bold " + (net >= 0 ? "text-[#2C6B57]" : "text-[#C0362C]")}>
              {formatCurrency(net, shop.currency)}
            </dd>
          </div>
        </dl>
        {missingCost > 0 && (
          <p className="mt-3 rounded-xl bg-[#FBF7EC] px-3 py-2 text-[11px] text-muted">
            💡 {missingCost} sold item{missingCost > 1 ? "s have" : " has"} no cost price, so profit reads higher than
            reality — add cost prices on those products for exact books.
          </p>
        )}
      </div>

      {/* Quick add */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="mb-3 text-sm font-semibold text-ink">Add an expense</p>
        <ExpenseForm />
      </div>

      {/* This month's expense list */}
      {expenses.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">Expenses — {monthLabel}</p>
            <p className="text-xs text-muted">
              {[...byCat.entries()].map(([c, v]) => `${c}: ${formatCurrency(v, shop.currency)}`).join(" · ")}
            </p>
          </div>
          <ul className="divide-y divide-line">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">
                    {e.category}
                    {e.note ? <span className="text-muted"> — {e.note}</span> : null}
                  </p>
                  <p className="text-[11px] text-muted">
                    {new Date(`${e.spentOn}T12:00:00`).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-3">
                  <span className="text-sm font-semibold text-ink">{formatCurrency(e.amount, shop.currency)}</span>
                  <form action={removeExpenseAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <button type="submit" className="rounded-lg px-2 py-1 text-xs text-[#C0362C] hover:bg-[#FBECEA]" aria-label={`Delete ${e.category} expense`}>
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {expenses.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line p-5 text-center text-sm text-muted">
          No expenses recorded for {monthLabel} yet. Add what you spend (packaging, courier, ads) and your net profit
          becomes real, not a guess.
        </p>
      )}
    </div>
  );
}
