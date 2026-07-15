import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-admin";
import { listAllShops, listRecentPayments } from "@/server/services/shop-service";
import { PLAN_PRICE_PKR, PLAN_LABEL } from "@/server/plans";
import { formatCurrency } from "@/lib/format";

const DAY = 86400000;

/**
 * The money screen. Since subscriptions are collected manually at launch, the
 * admin IS the billing system — this page makes renewal day a 10-minute
 * routine instead of silent revenue leaks.
 */
export default async function AdminRevenuePage() {
  await requireAdmin();
  const shops = await listAllShops();
  const now = Date.now();

  const paying = shops.filter(
    (s) =>
      s.plan !== "trial" &&
      s.subscriptionStatus === "active" &&
      s.planExpiresAt &&
      new Date(s.planExpiresAt).getTime() > now
  );
  const mrr = paying.reduce((sum, s) => sum + (PLAN_PRICE_PKR[s.plan] ?? 0), 0);

  const expiringSoon = paying
    .filter((s) => new Date(s.planExpiresAt as string).getTime() - now < 7 * DAY)
    .sort((a, b) => new Date(a.planExpiresAt as string).getTime() - new Date(b.planExpiresAt as string).getTime());

  const lapsed = shops.filter(
    (s) => s.plan !== "trial" && s.planExpiresAt && new Date(s.planExpiresAt).getTime() <= now
  );

  const trialing = shops.filter((s) => s.plan === "trial");
  const payments = await listRecentPayments(12);
  const shopName = new Map(shops.map((s) => [s.id, s.name]));

  const renewMsg = (name: string, plan: string, days: number) =>
    `Assalam o Alaikum! It's StoreLink 👋\nYour ${PLAN_LABEL[plan as keyof typeof PLAN_LABEL] ?? plan} plan for "${name}" renews in ${days} day${days === 1 ? "" : "s"} (Rs ${(PLAN_PRICE_PKR[plan as keyof typeof PLAN_PRICE_PKR] ?? 0).toLocaleString()}/month). Reply here and we'll share payment details — takes 2 minutes. Shukriya! 💚`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-ink">Revenue</h1>
        <p className="text-sm text-muted">Subscriptions in, renewals chased, nothing leaking.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xl font-semibold text-[#2C6B57]">{formatCurrency(mrr)}</p>
          <p className="mt-0.5 text-xs text-muted">Monthly recurring revenue</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xl font-semibold text-ink">{paying.length}</p>
          <p className="mt-0.5 text-xs text-muted">Paying shops</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xl font-semibold text-ink">{trialing.length}</p>
          <p className="mt-0.5 text-xs text-muted">On trial</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xl font-semibold text-ink">
            {paying.length > 0 ? formatCurrency(Math.round(mrr / paying.length)) : "—"}
          </p>
          <p className="mt-0.5 text-xs text-muted">Average per shop</p>
        </div>
      </div>

      {/* Renewal chase list */}
      <div className={"rounded-2xl border p-4 " + (expiringSoon.length > 0 ? "border-[#E7C98A] bg-[#FBF7EC]" : "border-line bg-surface")}>
        <p className="text-sm font-semibold text-ink">
          ⏰ Renewals due in the next 7 days {expiringSoon.length > 0 ? `— ${expiringSoon.length} to chase` : "— all clear"}
        </p>
        {expiringSoon.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {expiringSoon.map((s) => {
              const days = Math.max(0, Math.ceil((new Date(s.planExpiresAt as string).getTime() - now) / DAY));
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2">
                  <div className="min-w-0">
                    <Link href={`/admin/shops/${s.id}`} className="truncate text-sm font-medium text-ink hover:text-primary">
                      {s.name}
                    </Link>
                    <p className="text-[11px] text-muted">
                      {PLAN_LABEL[s.plan]} · {formatCurrency(PLAN_PRICE_PKR[s.plan] ?? 0)}/mo · expires in {days} day{days === 1 ? "" : "s"}
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(renewMsg(s.name, s.plan, days))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-none rounded-lg bg-whatsapp px-3 py-1.5 text-xs font-medium text-whatsapp-foreground"
                  >
                    💬 Remind
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Lapsed */}
      {lapsed.length > 0 && (
        <div className="rounded-2xl border border-[#E7B8B2] bg-[#FBECEA] p-4">
          <p className="text-sm font-semibold text-ink">🔴 Lapsed — paid before, expired now ({lapsed.length})</p>
          <p className="mt-1 text-xs text-muted">These were paying customers. A friendly message brings many back.</p>
          <ul className="mt-3 space-y-1.5">
            {lapsed.slice(0, 15).map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2">
                <Link href={`/admin/shops/${s.id}`} className="min-w-0 truncate text-sm font-medium text-ink hover:text-primary">
                  {s.name}
                  <span className="ml-2 text-[11px] font-normal text-muted">
                    expired {new Date(s.planExpiresAt as string).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                  </span>
                </Link>
                <a
                  href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Assalam o Alaikum! It's StoreLink — your shop "${s.name}" plan has expired. Want to switch it back on? Reply here and it takes 2 minutes 💚`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-none rounded-lg bg-whatsapp px-3 py-1.5 text-xs font-medium text-whatsapp-foreground"
                >
                  💬 Win back
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent payments */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-sm font-semibold text-ink">Recent payments</p>
        {payments.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            None recorded yet. When a seller pays you, open their shop page and use &quot;Record payment&quot; — it
            extends their plan and lands here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <Link href={`/admin/shops/${p.shopId}`} className="truncate font-medium text-ink hover:text-primary">
                    {shopName.get(p.shopId) ?? "Shop"}
                  </Link>
                  <p className="text-[11px] text-muted">
                    {PLAN_LABEL[p.plan as keyof typeof PLAN_LABEL] ?? p.plan} · {p.months} month{p.months > 1 ? "s" : ""} ·{" "}
                    {new Date(p.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                    {p.reference ? ` · ref ${p.reference}` : ""}
                  </p>
                </div>
                <span className="flex-none font-semibold text-[#2C6B57]">{formatCurrency(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
