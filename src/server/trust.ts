import type { Shop } from "./types";

// Tune these thresholds freely — they're the only place the numbers live.
export const TRUST = {
  ESTABLISHED_ORDERS: 5,
  TRUSTED_ORDERS: 25,
  TRUSTED_RATING: 4.0,
  TRUSTED_REVIEWS: 5,
  REPORT_FLAG: 5,
} as const;

export type TrustTier = "new" | "established" | "trusted";

export interface TrustInfo {
  tier: TrustTier;
  tierLabel: string;
  verified: boolean;
  canAcceptOnlinePayments: boolean;
  ordersToOnlinePay: number; // delivered orders still needed to unlock online pay
  badges: string[];
}

export function computeTrust(
  shop: Pick<Shop, "verificationStatus">,
  deliveredOrders: number,
  rating: number,
  reviewCount: number
): TrustInfo {
  const verified = shop.verificationStatus === "verified";
  let tier: TrustTier = "new";
  if (
    verified &&
    deliveredOrders >= TRUST.TRUSTED_ORDERS &&
    rating >= TRUST.TRUSTED_RATING &&
    reviewCount >= TRUST.TRUSTED_REVIEWS
  ) {
    tier = "trusted";
  } else if (verified && deliveredOrders >= TRUST.ESTABLISHED_ORDERS) {
    tier = "established";
  }
  const canAcceptOnlinePayments = verified;
  const tierLabel = tier === "trusted" ? "Trusted" : tier === "established" ? "Established" : "New seller";
  const badges: string[] = [];
  if (verified) badges.push("Verified");
  if (tier === "trusted") badges.push("Trusted");
  return {
    tier,
    tierLabel,
    verified,
    canAcceptOnlinePayments,
    ordersToOnlinePay: 0,
    badges,
  };
}
