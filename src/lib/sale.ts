/**
 * Storewide flash-sale helpers. Pure functions, safe on server and client.
 * A sale is active when salePercent is 1–90 and saleEndsAt is in the future.
 * The SERVER always recomputes prices with these at order time, so a stale
 * client can never charge the wrong amount.
 */

export interface SaleFields {
  salePercent: number | null;
  saleEndsAt: string | null;
}

export function saleActive(shop: SaleFields, now: number = Date.now()): boolean {
  if (!shop.salePercent || shop.salePercent < 1 || shop.salePercent > 90) return false;
  if (!shop.saleEndsAt) return false;
  const ends = new Date(shop.saleEndsAt).getTime();
  return Number.isFinite(ends) && ends > now;
}

/** Effective selling price for a product under the shop's current sale. */
export function salePrice(price: number, shop: SaleFields, now: number = Date.now()): number {
  if (!saleActive(shop, now)) return price;
  return Math.max(1, Math.round(price * (1 - (shop.salePercent as number) / 100)));
}
