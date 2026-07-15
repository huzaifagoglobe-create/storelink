import Link from "next/link";
import type { Shop } from "@/server/types";

/**
 * "Get your first order" checklist for new sellers — shown on the overview
 * until every step is done, then disappears. Each step is detected from real
 * shop data, so it ticks itself as the seller makes progress.
 */
export function OnboardingChecklist({
  shop,
  productCount,
  orderCount,
}: {
  shop: Shop;
  productCount: number;
  orderCount: number;
}) {
  const steps = [
    {
      label: "Add your first product",
      hint: "Photos + price — takes 2 minutes",
      href: "/dashboard/products/new",
      done: productCount > 0,
    },
    {
      label: "Set your delivery charges",
      hint: "Flat fee, free-over amount, or per-city",
      href: "/dashboard/settings",
      done: shop.deliveryFee > 0 || shop.freeDeliveryOver !== null || shop.deliveryZones.length > 0,
    },
    {
      label: "Make the shop yours",
      hint: "Pick a design, colour, and banner",
      href: "/dashboard/storefront",
      done: Boolean(shop.bannerHeading || shop.bannerImage || shop.template !== "classic" || shop.themeColor),
    },
    {
      label: "Get the Verified badge",
      hint: "Buyers trust verified shops more",
      href: "/dashboard/verification",
      done: shop.verificationStatus !== "unverified",
    },
    {
      label: "Get your first order",
      hint: "Share your link on Instagram, Facebook, TikTok, WhatsApp",
      href: "/dashboard",
      done: orderCount > 0,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">Get your first order 🚀</p>
        <p className="text-xs text-muted">
          {doneCount}/{steps.length} done
        </p>
      </div>
      <div className="mb-3 h-2 w-full rounded-full bg-[#eef3f0]">
        <div
          className="h-2 rounded-full bg-primary transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>
      <ul className="space-y-1.5">
        {steps.map((s) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className={
                "flex items-center gap-3 rounded-xl px-2 py-1.5 transition " +
                (s.done ? "opacity-60" : "hover:bg-[#f3f7f4]")
              }
            >
              <span
                className={
                  "grid h-5 w-5 flex-none place-items-center rounded-full text-[11px] font-bold " +
                  (s.done ? "bg-primary text-primary-foreground" : "border-2 border-line text-transparent")
                }
              >
                ✓
              </span>
              <span className="min-w-0">
                <span className={"block text-sm " + (s.done ? "text-muted line-through" : "font-medium text-ink")}>
                  {s.label}
                </span>
                {!s.done && <span className="block text-xs text-muted">{s.hint}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
