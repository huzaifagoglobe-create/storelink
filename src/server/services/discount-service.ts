// Discount codes per shop. Demo-data fallback when Supabase is not configured.
import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";
import { mockDiscounts } from "../mock-data";
import type { Discount, DiscountInput } from "../types";

function rowToDiscount(r: any): Discount {
  return {
    id: r.id,
    shopId: r.shop_id,
    code: r.code,
    type: r.type,
    value: Number(r.value),
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

function normalizeCode(c: string): string {
  return (c ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

/** Pure helper: how much this discount takes off a given subtotal. */
export function discountAmount(subtotal: number, d: Discount): number {
  if (!d.isActive || subtotal <= 0) return 0;
  const amt = d.type === "percent" ? Math.round((subtotal * d.value) / 100) : Math.round(d.value);
  return Math.max(0, Math.min(amt, subtotal));
}

export async function listDiscounts(shopId: string): Promise<Discount[]> {
  if (!isSupabaseConfigured()) {
    return mockDiscounts.filter((d) => d.shopId === shopId).slice().reverse();
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("discounts")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToDiscount);
}

export async function getActiveDiscountByCode(shopId: string, code: string): Promise<Discount | null> {
  const norm = normalizeCode(code);
  if (!norm) return null;
  if (!isSupabaseConfigured()) {
    return mockDiscounts.find((d) => d.shopId === shopId && d.isActive && d.code === norm) ?? null;
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("discounts")
    .select("*")
    .eq("shop_id", shopId)
    .eq("code", norm)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;
  return rowToDiscount(data);
}

export async function createDiscount(shopId: string, input: DiscountInput): Promise<Discount> {
  const code = normalizeCode(input.code);
  if (!code) throw new Error("Enter a code.");
  if (!isSupabaseConfigured()) {
    if (mockDiscounts.some((d) => d.shopId === shopId && d.code === code)) {
      throw new Error("That code already exists.");
    }
    const disc: Discount = {
      id: `disc-${Date.now()}`,
      shopId,
      code,
      type: input.type,
      value: input.value,
      isActive: input.isActive ?? true,
      createdAt: new Date().toISOString(),
    };
    mockDiscounts.push(disc);
    return disc;
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("discounts")
    .insert({ shop_id: shopId, code, type: input.type, value: input.value, is_active: input.isActive ?? true })
    .select("*")
    .single();
  if (error || !data) {
    if ((error as { code?: string })?.code === "23505") throw new Error("That code already exists.");
    console.error("createDiscount:", error);
    throw new Error("Could not create the code. Please try again.");
  }
  return rowToDiscount(data);
}

export async function setDiscountActive(shopId: string, id: string, active: boolean): Promise<void> {
  if (!isSupabaseConfigured()) {
    const d = mockDiscounts.find((x) => x.id === id && x.shopId === shopId);
    if (d) d.isActive = active;
    return;
  }
  const supabase = getServerSupabase();
  await supabase.from("discounts").update({ is_active: active }).eq("id", id).eq("shop_id", shopId);
}

export async function deleteDiscount(shopId: string, id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const i = mockDiscounts.findIndex((x) => x.id === id && x.shopId === shopId);
    if (i >= 0) mockDiscounts.splice(i, 1);
    return;
  }
  const supabase = getServerSupabase();
  await supabase.from("discounts").delete().eq("id", id).eq("shop_id", shopId);
}
