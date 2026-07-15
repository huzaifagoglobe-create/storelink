import type { PlanTier } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// FREE MODE — the one switch that makes the whole product free.
// ═══════════════════════════════════════════════════════════════════════════
// While the product is being tested, everything is free for every seller:
//   · no prices shown anywhere
//   · no product or category limits
//   · no trial countdown and no trial expiry
//   · no upgrade prompts
//
// It is ON by default, so a fresh deploy is free with zero setup.
//
// ─── TO START CHARGING (when testing is done) ─────────────────────────────
// Set this environment variable on the server and redeploy:
//
//     NEXT_PUBLIC_FREE_MODE=0
//
// That's the only change. Every price, limit and trial below switches back on
// exactly as written — nothing was deleted, only paused.
// ═══════════════════════════════════════════════════════════════════════════
export const FREE_MODE = process.env.NEXT_PUBLIC_FREE_MODE !== "0";

/** What sellers see instead of a plan name while everything is free. */
export const FREE_MODE_LABEL = "Free beta";


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
  // Free beta: every shop gets everything, whatever plan they are on.
  if (FREE_MODE) return { products: Infinity, categories: Infinity };
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.trial;
}

export function limitLabel(n: number): string {
  return n === Infinity ? "Unlimited" : String(n);
}

// ---- Free-trial window ------------------------------------------------------
export const TRIAL_DAYS = 14;

/** Whole days left in a trial (null if not on a trial / no end date). */
export function trialDaysLeft(plan: PlanTier, trialEndsAt: string | null): number | null {
  if (FREE_MODE) return null; // free beta: nothing is counting down
  if (plan !== "trial" || !trialEndsAt) return null;
  return Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000);
}

/** True once a trial has run out. */
export function isTrialExpired(plan: PlanTier, trialEndsAt: string | null): boolean {
  if (FREE_MODE) return false; // free beta: a trial can never run out
  const d = trialDaysLeft(plan, trialEndsAt);
  return d !== null && d <= 0;
}
