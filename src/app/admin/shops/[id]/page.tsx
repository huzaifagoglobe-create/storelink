import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/current-admin";
import { getAdminShopDetail } from "@/server/services/admin-service";
import { setShopPlanAction, setShopActiveAction, recordPaymentAction, pauseSubscriptionAction, setFeaturedAction } from "@/server/actions/admin-actions";
import { PinReset } from "@/components/admin/pin-reset";
import { grantReferrerRewardAction } from "@/server/actions/admin-actions";
import { effectiveSubscriptionStatus, daysUntilExpiry, BILLING_GATE_ENABLED } from "@/server/billing";
import { PLAN_TIERS, PLAN_LABEL, PLAN_PRICE_PKR } from "@/server/plans";
import { formatCurrency } from "@/lib/format";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { SubmitButton } from "@/components/dashboard/submit-button";
import { inputClass } from "@/components/dashboard/field";
import { PlanBadge, ActiveBadge } from "@/components/admin/badges";

export default async function AdminShopDetail({ params: _p }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const params = await _p;
  const detail = await getAdminShopDetail(params.id);
  if (!detail) notFound();
  const { shop, orderCount, productCount, revenue, recentOrders } = detail;

  const stats = [
    { label: "Orders", value: String(orderCount) },
    { label: "Products", value: String(productCount) },
    { label: "Revenue", value: formatCurrency(revenue) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/shops" className="text-sm text-primary">
          ← All shops
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold text-ink">{shop.name}</h1>
          <PlanBadge plan={shop.plan} />
          <ActiveBadge active={shop.isActive} />
        </div>
        <p className="mt-1 text-sm text-muted">
          <Link href={`/${shop.slug}`} target="_blank" className="text-primary">
            /{shop.slug} ↗
          </Link>{" "}
          · WhatsApp {shop.whatsapp}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xl font-semibold text-ink">{s.value}</p>
            <p className="mt-0.5 text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-sm font-medium text-ink">Subscription plan</p>
          <p className="mt-0.5 text-xs text-muted">What this shop is billed each month.</p>
          <form action={setShopPlanAction} className="mt-3 flex items-end gap-2">
            <input type="hidden" name="shopId" value={shop.id} />
            <select name="plan" defaultValue={shop.plan} className={inputClass + " flex-1"}>
              {PLAN_TIERS.map((t) => (
                <option key={t} value={t}>
                  {PLAN_LABEL[t]} —{" "}
                  {PLAN_PRICE_PKR[t] === 0 ? "free" : `${formatCurrency(PLAN_PRICE_PKR[t])}/mo`}
                </option>
              ))}
            </select>
            <SubmitButton pendingText="Saving…">Update plan</SubmitButton>
          </form>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-sm font-medium text-ink">Shop status</p>
          <p className="mt-0.5 text-xs text-muted">
            {shop.isActive
              ? "The storefront is live and visible to buyers."
              : "The storefront is hidden from buyers."}
          </p>
          <form action={setShopActiveAction} className="mt-3">
            <input type="hidden" name="shopId" value={shop.id} />
            <input type="hidden" name="next" value={shop.isActive ? "false" : "true"} />
            <SubmitButton
              variant={shop.isActive ? "outline" : "primary"}
              pendingText="Saving…"
            >
              {shop.isActive ? "Pause shop" : "Activate shop"}
            </SubmitButton>
          </form>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink">Subscription &amp; payment</p>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
            {effectiveSubscriptionStatus(shop).replace("_", " ")}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted">
          {shop.planExpiresAt
            ? (() => {
                const d = daysUntilExpiry(shop.planExpiresAt);
                return d !== null && d >= 0
                  ? `Paid until ${new Date(shop.planExpiresAt).toLocaleDateString()} (${d} day${d === 1 ? "" : "s"} left).`
                  : `Expired on ${new Date(shop.planExpiresAt!).toLocaleDateString()}.`;
              })()
            : "No payment recorded yet."}
          {!BILLING_GATE_ENABLED && " The billing gate is currently OFF, so this is for your records only."}
        </p>

        <form action={recordPaymentAction} className="mt-3 grid gap-2 sm:grid-cols-4">
          <input type="hidden" name="shopId" value={shop.id} />
          <select name="plan" defaultValue={shop.plan === "trial" ? "basic" : shop.plan} className={inputClass}>
            {PLAN_TIERS.filter((t) => t !== "trial").map((t) => (
              <option key={t} value={t}>{PLAN_LABEL[t]}</option>
            ))}
          </select>
          <input name="months" type="number" min={1} max={36} defaultValue={1} placeholder="Months" className={inputClass} />
          <input name="amount" type="number" min={0} defaultValue={PLAN_PRICE_PKR[shop.plan === "trial" ? "basic" : shop.plan]} placeholder="Amount" className={inputClass} />
          <SubmitButton pendingText="Saving…">Mark paid</SubmitButton>
        </form>
        <p className="mt-1 text-[11px] text-muted">Extends the paid period and switches the shop on. Reference is optional.</p>


        <form action={pauseSubscriptionAction} className="mt-3 border-t border-line pt-3">
          <input type="hidden" name="shopId" value={shop.id} />
          <button type="submit" className="text-xs font-medium text-[#C0362C] hover:underline">
            Pause subscription (shop shows &ldquo;temporarily closed&rdquo;)
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-line bg-surface">
        <div className="border-b border-line px-4 py-3">
          <p className="text-sm font-medium text-ink">Recent orders</p>
        </div>
        {recentOrders.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    #{o.id} · {o.customerName}
                  </p>
                  <p className="text-xs text-muted">
                    {formatCurrency(o.total, shop.currency)} ·{" "}
                    {o.paymentMethod === "cod" ? "COD" : "Online"}
                  </p>
                </div>
                <StatusBadge status={o.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {shop.referredByShop && (
        <div className={"rounded-2xl border p-4 " + (shop.referrerRewarded ? "border-line bg-surface" : "border-[#bfe0cd] bg-[#EAF3EE]")}>
          <p className="text-sm font-medium text-ink">
            🤝 Referred by <span className="font-semibold">{shop.referredByShop}</span>
          </p>
          {shop.referrerRewarded ? (
            <p className="mt-1 text-xs text-muted">Referrer&apos;s free month already granted ✓</p>
          ) : (
            <>
              <p className="mt-1 text-xs text-muted">
                When THIS shop becomes a paying customer, grant the referrer their free month — one tap, once only.
              </p>
              <form action={grantReferrerRewardAction} className="mt-3">
                <input type="hidden" name="shopId" value={shop.id} />
                <input type="hidden" name="referrerSlug" value={shop.referredByShop} />
                <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                  Grant {shop.referredByShop} a free month
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Bazaar curation */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-sm font-medium text-ink">Bazaar placement</p>
        <p className="mt-1 text-xs text-muted">
          Featured shops pin to the top of the Bazaar and category pages with a ⭐ badge.
        </p>
        <form action={setFeaturedAction} className="mt-3">
          <input type="hidden" name="shopId" value={shop.id} />
          <input type="hidden" name="featured" value={shop.featured ? "false" : "true"} />
          <button type="submit" className={"rounded-xl px-4 py-2 text-sm font-medium " + (shop.featured ? "border border-line text-ink hover:border-primary" : "bg-primary text-primary-foreground")}>
            {shop.featured ? "★ Featured — remove" : "☆ Feature this shop"}
          </button>
        </form>
      </div>

      <PinReset shopId={shop.id} whatsapp={shop.whatsapp} shopName={shop.name} />

      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="mb-2 text-sm font-medium text-ink">Quick links</p>
        <div className="flex flex-wrap gap-2">
          <a href={`/${shop.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-line px-3 py-2 text-xs font-medium text-ink hover:border-primary">
            Open storefront ↗
          </a>
          <a href={`https://wa.me/${shop.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-whatsapp px-3 py-2 text-xs font-medium text-whatsapp-foreground">
            💬 WhatsApp the seller
          </a>
        </div>
      </div>
    </div>
  );
}
