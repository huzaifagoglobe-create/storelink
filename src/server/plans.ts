import type { PlanTier } from "./types";

export const PLAN_TIERS: PlanTier[] = ["trial", "basic", "pro", "premium"];

export const PLAN_LABEL: Record<PlanTier, string> = {
  trial: "Free trial",
  basic: "Basic",
  pro: "Pro",
  premium: "Premium",
};

// Subscription pricing (PKR / month).
export const PLAN_PRICE_PKR: Record<PlanTier, number> = {
  trial: 0,
  basic: 2500,
  pro: 5500,
  premium: 9999,
};

export interface PlanLimits {
  products: number; // Infinity = unlimited
  categories: number;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  trial: { products: 9, categories: 0 },
  basic: { products: 35, categories: 5 },
  pro: { products: 90, categories: 9 },
  premium: { products: Infinity, categories: Infinity },
};

export function planLimits(plan: PlanTier): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.trial;
}

export function limitLabel(n: number): string {
  return n === Infinity ? "Unlimited" : String(n);
}

// ---- Free-trial window ------------------------------------------------------
export const TRIAL_DAYS = 14;

/** Whole days left in a trial (null if not on a trial / no end date). */
export function trialDaysLeft(plan: PlanTier, trialEndsAt: string | null): number | null {
  if (plan !== "trial" || !trialEndsAt) return null;
  return Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000);
}

/** True once a trial has run out. */
export function isTrialExpired(plan: PlanTier, trialEndsAt: string | null): boolean {
  const d = trialDaysLeft(plan, trialEndsAt);
  return d !== null && d <= 0;
}
