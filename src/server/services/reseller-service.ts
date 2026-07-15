import "server-only";
import { randomUUID } from "crypto";
import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";
import type { Reseller } from "../types";

// Demo store pinned to globalThis so every route bundle shares one copy.
const g = globalThis as unknown as { __wsbResellers?: Reseller[] };
g.__wsbResellers ??= [];
const store = g.__wsbResellers;

function rowToReseller(r: any): Reseller {
  return {
    id: r.id,
    shopId: r.shop_id,
    name: r.name,
    phone: r.phone,
    code: r.code,
    commissionPercent: Number(r.commission_percent ?? 10),
    createdAt: r.created_at,
  };
}

/** Short, human-friendly, unique-per-shop code like "AYESHA7". */
function makeCode(name: string, existing: Set<string>): string {
  const base =
    name
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 6) || "TEAM";
  for (let i = 0; i < 100; i++) {
    const c = base + Math.floor(Math.random() * 90 + 10);
    if (!existing.has(c)) return c;
  }
  return base + Date.now().toString().slice(-4);
}

export async function listResellers(shopId: string): Promise<Reseller[]> {
  if (!isSupabaseConfigured()) {
    return store.filter((r) => r.shopId === shopId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("resellers")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listResellers:", error.message);
    return [];
  }
  return (data ?? []).map(rowToReseller);
}

export async function getResellerByCode(shopId: string, code: string): Promise<Reseller | null> {
  const c = code.trim().toUpperCase();
  if (!c) return null;
  if (!isSupabaseConfigured()) {
    return store.find((r) => r.shopId === shopId && r.code === c) ?? null;
  }
  const supabase = getServerSupabase();
  const { data } = await supabase.from("resellers").select("*").eq("shop_id", shopId).eq("code", c).maybeSingle();
  return data ? rowToReseller(data) : null;
}

export async function createReseller(
  shopId: string,
  input: { name: string; phone: string; commissionPercent: number }
): Promise<Reseller> {
  const existing = new Set((await listResellers(shopId)).map((r) => r.code));
  const code = makeCode(input.name, existing);
  const commission = Math.min(50, Math.max(0, Math.round(input.commissionPercent)));
  if (!isSupabaseConfigured()) {
    const r: Reseller = {
      id: randomUUID(),
      shopId,
      name: input.name,
      phone: input.phone,
      code,
      commissionPercent: commission,
      createdAt: new Date().toISOString(),
    };
    store.push(r);
    return r;
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("resellers")
    .insert({ shop_id: shopId, name: input.name, phone: input.phone, code, commission_percent: commission })
    .select()
    .single();
  if (error) throw new Error("Could not add the reseller: " + error.message);
  return rowToReseller(data);
}

export async function deleteReseller(shopId: string, id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const i = store.findIndex((r) => r.shopId === shopId && r.id === id);
    if (i >= 0) store.splice(i, 1);
    return;
  }
  const supabase = getServerSupabase();
  await supabase.from("resellers").delete().eq("shop_id", shopId).eq("id", id);
}
