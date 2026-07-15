import "server-only";
import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";
import type { AbandonedCart, AbandonedCartItem } from "../types";

// Demo store — kept on globalThis so writes are shared across route bundles
// (same reason as the order store). Unused in real mode.
const g = globalThis as unknown as { __wsbCarts?: Map<string, AbandonedCart> };
if (!g.__wsbCarts) g.__wsbCarts = new Map();
const cartStore = g.__wsbCarts;
const key = (shopId: string, phone: string) => `${shopId}::${phone}`;

function normPhone(p: string): string {
  return (p || "").replace(/\D/g, "");
}

/**
 * Save (or update) an abandoned cart for a shop+phone. Called when a buyer is at
 * checkout with a valid phone but hasn't completed the order. Upsert keyed on
 * (shop, phone) so repeated saves don't create duplicates.
 */
export async function saveAbandonedCart(input: {
  shopId: string;
  customerName: string | null;
  customerPhone: string;
  items: AbandonedCartItem[];
  subtotal: number;
}): Promise<void> {
  const phone = normPhone(input.customerPhone);
  if (!input.shopId || phone.length < 10 || input.items.length === 0) return;

  if (!isSupabaseConfigured()) {
    const existing = cartStore.get(key(input.shopId, phone));
    cartStore.set(key(input.shopId, phone), {
      id: existing?.id ?? `ac-${Date.now()}`,
      shopId: input.shopId,
      customerName: input.customerName,
      customerPhone: phone,
      items: input.items,
      subtotal: input.subtotal,
      recovered: false,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    return;
  }
  const supabase = getServerSupabase();
  const { error } = await supabase.from("abandoned_carts").upsert(
    {
      shop_id: input.shopId,
      customer_name: input.customerName,
      customer_phone: phone,
      items: input.items,
      subtotal: input.subtotal,
      recovered: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "shop_id,customer_phone" }
  );
  if (error) console.error("saveAbandonedCart:", error.message);
}

/**
 * Remove / mark-recovered a cart once the buyer actually orders. Called from the
 * order flow so a completed cart doesn't show up as "abandoned".
 */
export async function clearAbandonedCart(shopId: string, phone: string): Promise<void> {
  const p = normPhone(phone);
  if (!shopId || !p) return;
  if (!isSupabaseConfigured()) {
    cartStore.delete(key(shopId, p));
    return;
  }
  const supabase = getServerSupabase();
  await supabase.from("abandoned_carts").delete().eq("shop_id", shopId).eq("customer_phone", p);
}

/** Seller view: abandoned carts for a shop, newest first. */
export async function listAbandonedCarts(shopId: string): Promise<AbandonedCart[]> {
  if (!isSupabaseConfigured()) {
    return [...cartStore.values()]
      .filter((c) => c.shopId === shopId && !c.recovered)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("abandoned_carts")
    .select("*")
    .eq("shop_id", shopId)
    .eq("recovered", false)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("listAbandonedCarts:", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    shopId: r.shop_id,
    customerName: r.customer_name ?? null,
    customerPhone: r.customer_phone,
    items: (r.items ?? []) as AbandonedCartItem[],
    subtotal: Number(r.subtotal ?? 0),
    recovered: r.recovered,
    createdAt: r.created_at,
  }));
}
