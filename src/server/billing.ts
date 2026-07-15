import type { SubscriptionStatus } from "./types";

/** Master switch — when off, NOTHING about billing is shown to sellers or buyers
 *  and every shop behaves exactly as before. Turn on by setting BILLING_GATE=1. */
export const BILLING_GATE_ENABLED = process.env.BILLING_GATE === "1";

/** When on (and gate enabled), brand-new signups start as "pending" (pay before
 *  using the dashboard). When off, signups are "active" and use the free trial
 *  first — recommended. Set BILLING_PAY_FIRST=1 to switch to pay-first. */
export const BILLING_PAY_FIRST = process.env.BILLING_PAY_FIRST === "1";

/** Days after the paid period ends during which the shop still works fully. */
export const BILLING_GRACE_DAYS = 5;

type BillingShape = {
  subscriptionStatus: string;
  planExpiresAt: string | null;
  plan?: string;
  trialEndsAt?: string | null;
};

/** The real status right now, accounting for the paid-until date + grace window. */
export function effectiveSubscriptionStatus(shop: BillingShape): SubscriptionStatus {
  const s = shop.subscriptionStatus as SubscriptionStatus;
  if (s === "pending" || s === "paused") return s;
  // A free trial that has ended with no paid period yet → must pay (treated as paused).
  if (
    shop.plan === "trial" &&
    !shop.planExpiresAt &&
    shop.trialEndsAt &&
    Date.now() > new Date(shop.trialEndsAt).getTime()
  ) {
    return "paused";
  }
  if (shop.planExpiresAt) {
    const end = new Date(shop.planExpiresAt).getTime();
    const now = Date.now();
    if (now > end + BILLING_GRACE_DAYS * 86_400_000) return "paused";
    if (now > end) return "past_due"; // in grace: still works, but nudge to renew
  }
  return "active";
}

/** Can the seller use the dashboard / is the storefront live?
 *  Always true when the gate is disabled. Grace period counts as access. */
export function shopHasAccess(shop: BillingShape): boolean {
  if (!BILLING_GATE_ENABLED) return true;
  const eff = effectiveSubscriptionStatus(shop);
  return eff === "active" || eff === "past_due";
}

/** Status a brand-new signup should get. */
export function initialSubscriptionStatus(): SubscriptionStatus {
  return BILLING_GATE_ENABLED && BILLING_PAY_FIRST ? "pending" : "active";
}

/** Whole days until the paid period ends (negative once expired). */
export function daysUntilExpiry(planExpiresAt: string | null): number | null {
  if (!planExpiresAt) return null;
  return Math.ceil((new Date(planExpiresAt).getTime() - Date.now()) / 86_400_000);
}
