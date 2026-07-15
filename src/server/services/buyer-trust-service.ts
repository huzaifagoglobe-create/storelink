import "server-only";
import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";
import type { Order } from "../types";

// Demo order store lives on globalThis (see order-service).
const g = globalThis as unknown as { __wsbOrderStore?: Map<string, Order> };

const norm = (p: string) => (p || "").replace(/\D/g, "");

export interface BuyerTrust {
  /** Orders this phone number successfully received — across ALL StoreLink shops. */
  deliveredAll: number;
  /** Orders cancelled/refused — across ALL shops. */
  cancelledAll: number;
  /** Same, but only within the current shop. */
  deliveredHere: number;
  cancelledHere: number;
  tier: "trusted" | "new" | "risky";
}

/**
 * The "buyer trust passport": one phone number's delivery history across the
 * whole platform. Sellers see it on every new order, so a serial COD-refuser
 * can't burn shop after shop — and reliable buyers get recognised everywhere.
 * This is network data no individual seller could build alone.
 */
export async function getBuyerTrust(phone: string, shopId: string): Promise<BuyerTrust> {
  const p = norm(phone);
  const empty: BuyerTrust = { deliveredAll: 0, cancelledAll: 0, deliveredHere: 0, cancelledHere: 0, tier: "new" };
  if (p.length < 10) return empty;

  let rows: { shopId: string; status: string }[] = [];
  if (!isSupabaseConfigured()) {
    const store = g.__wsbOrderStore ?? new Map<string, Order>();
    for (const o of store.values()) {
      if (norm(o.customerPhone) === p) rows.push({ shopId: o.shopId, status: o.status });
    }
  } else {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("orders")
      .select("shop_id, status, customer_phone")
      .eq("customer_phone", phone)
      .limit(500);
    if (error) {
      console.error("getBuyerTrust:", error.message);
      return empty;
    }
    rows = (data ?? []).map((r) => ({ shopId: r.shop_id, status: r.status }));
  }

  const t = { ...empty };
  for (const r of rows) {
    if (r.status === "delivered") {
      t.deliveredAll++;
      if (r.shopId === shopId) t.deliveredHere++;
    } else if (r.status === "cancelled") {
      t.cancelledAll++;
      if (r.shopId === shopId) t.cancelledHere++;
    }
  }
  // Tiers: proven receivers are trusted; repeat refusers are flagged; the rest are new.
  if (t.cancelledAll >= 2 && t.cancelledAll > t.deliveredAll) t.tier = "risky";
  else if (t.deliveredAll >= 2) t.tier = "trusted";
  else t.tier = "new";
  return t;
}
