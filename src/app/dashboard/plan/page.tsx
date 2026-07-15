import { redirect } from "next/navigation";
import { requireSeller } from "@/server/auth/current-seller";
import { PLAN_TIERS, PLAN_LABEL, PLAN_PRICE_PKR, planLimits, limitLabel } from "@/server/plans";
import { formatCurrency } from "@/lib/format";
import { supportLink } from "@/lib/site";

export const metadata = { title: "Plan" };

const FEATURES: Record<string, string[]> = {
  trial: ["Your own shop link", "Cash on Delivery", "Orders to WhatsApp"],
  basic: ["Discount codes", "Reviews & ratings", "No “Powered by” badge", "Delivery rates by city"],
  pro: ["Sales reports", "All storefront themes", "Customer insights"],
  premium: ["Unlimited products", "Advanced analytics", "Online payments", "Priority support"],
};

export default async function PlanPage() {
  const { shop, isOwner } = await requireSeller();
  if (!isOwner) redirect("/dashboard");
  const current = shop.plan;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Your plan</h1>
        <p className="text-sm text-muted">
          You&apos;re on the {PLAN_LABEL[current]} plan. Upgrade any time as your shop grows.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_TIERS.map((t) => {
          const isCurrent = t === current;
          const limits = planLimits(t);
          const waMsg = `Hi, I'd like to upgrade my shop "${shop.name}" (/${shop.slug}) to the ${PLAN_LABEL[t]} plan.`;
          return (
            <div
              key={t}
              className={"flex flex-col rounded-2xl border p-4 " + (isCurrent ? "border-primary bg-[#F3F8F5]" : "border-line bg-surface")}
            >
              <p className="text-sm font-semibold text-ink">{PLAN_LABEL[t]}</p>
              <p className="mt-1 text-xl font-semibold text-ink">
                {PLAN_PRICE_PKR[t] === 0 ? "Free" : formatCurrency(PLAN_PRICE_PKR[t], shop.currency)}
                {PLAN_PRICE_PKR[t] === 0 ? "" : <span className="text-xs font-normal text-muted">/mo</span>}
              </p>
              <p className="mt-1 text-xs text-muted">
                {limitLabel(limits.products)} products · {limitLabel(limits.categories)} categories
              </p>
              <ul className="mt-3 flex-1 space-y-1 text-xs text-muted">
                {(FEATURES[t] ?? []).map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <div className="mt-4">
                {isCurrent ? (
                  <span className="inline-flex rounded-lg bg-[#E7F2EC] px-3 py-1.5 text-xs font-medium text-[#2C6B57]">
                    Current plan
                  </span>
                ) : (
                  <a
                    href={supportLink(waMsg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    Upgrade
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted">
        To change your plan, message us and we&apos;ll set it up. (Self-serve online plan checkout is
        coming soon.)
      </p>
    </div>
  );
}
