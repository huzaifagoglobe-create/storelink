import "server-only";
import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";

export interface Lead {
  id: string;
  shopId: string;
  phone: string;
  name: string | null;
  source: string | null;
  productId: string | null;
  createdAt: string;
}

// Demo store (globalThis so it persists across route bundles).
const g = globalThis as unknown as { __wsbLeads?: Map<string, Lead> };
if (!g.__wsbLeads) g.__wsbLeads = new Map();
const leadStore = g.__wsbLeads;
const key = (shopId: string, phone: string) => `${shopId}::${phone}`;
const normPhone = (p: string) => (p || "").replace(/\D/g, "");

/** Save a lead (visitor who opted in). Upsert on (shop, phone). */
export async function saveLead(input: {
  shopId: string;
  phone: string;
  name?: string | null;
  source?: string | null;
  productId?: string | null;
}): Promise<boolean> {
  const phone = normPhone(input.phone);
  if (!input.shopId || phone.length < 10) return false;

  if (!isSupabaseConfigured()) {
    const existing = leadStore.get(key(input.shopId, phone));
    leadStore.set(key(input.shopId, phone), {
      id: existing?.id ?? `lead-${Date.now()}`,
      shopId: input.shopId,
      phone,
      name: input.name ?? existing?.name ?? null,
      source: input.source ?? existing?.source ?? null,
      productId: input.productId ?? existing?.productId ?? null,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    return true;
  }
  const supabase = getServerSupabase();
  const { error } = await supabase.from("leads").upsert(
    {
      shop_id: input.shopId,
      phone,
      name: input.name ?? null,
      source: input.source ?? null,
      product_id: input.productId ?? null,
    },
    { onConflict: "shop_id,phone" }
  );
  if (error) {
    console.error("saveLead:", error.message);
    return false;
  }
  return true;
}

/** Seller view: all leads for a shop, newest first. */
export async function listLeads(shopId: string): Promise<Lead[]> {
  if (!isSupabaseConfigured()) {
    return [...leadStore.values()]
      .filter((l) => l.shopId === shopId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    console.error("listLeads:", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    shopId: r.shop_id,
    phone: r.phone,
    name: r.name ?? null,
    source: r.source ?? null,
    productId: r.product_id ?? null,
    createdAt: r.created_at,
  }));
}
