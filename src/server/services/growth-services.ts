import "server-only";
import { randomUUID } from "crypto";
import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";
import type { SellerLead, SellerLeadStatus, PromoCode, SellerStory } from "../types";

// Demo stores pinned to globalThis so every route bundle shares one copy.
const g = globalThis as unknown as {
  __wsbSellerLeads?: SellerLead[];
  __wsbPromoCodes?: PromoCode[];
  __wsbStories?: SellerStory[];
};
g.__wsbSellerLeads ??= [];
g.__wsbPromoCodes ??= [];
g.__wsbStories ??= [];

// ---------------------------------------------------------------------------
// Seller leads — the founder's sales pipeline
// ---------------------------------------------------------------------------

export async function createSellerLead(input: { name: string; whatsapp: string; selling: string | null; source: string | null }): Promise<void> {
  if (!isSupabaseConfigured()) {
    g.__wsbSellerLeads!.push({ id: randomUUID(), ...input, status: "new", createdAt: new Date().toISOString() });
    return;
  }
  const supabase = getServerSupabase();
  await supabase.from("seller_leads").insert({ name: input.name, whatsapp: input.whatsapp, selling: input.selling, source: input.source });
}

export async function listSellerLeads(): Promise<SellerLead[]> {
  if (!isSupabaseConfigured()) return [...g.__wsbSellerLeads!].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from("seller_leads").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) { console.error("listSellerLeads:", error.message); return []; }
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, whatsapp: r.whatsapp, selling: r.selling ?? null, source: r.source ?? null, status: r.status as SellerLeadStatus, createdAt: r.created_at }));
}

export async function setLeadStatus(id: string, status: SellerLeadStatus): Promise<void> {
  if (!isSupabaseConfigured()) {
    const l = g.__wsbSellerLeads!.find((x) => x.id === id);
    if (l) l.status = status;
    return;
  }
  const supabase = getServerSupabase();
  await supabase.from("seller_leads").update({ status }).eq("id", id);
}

// ---------------------------------------------------------------------------
// Promo codes — longer trials for campaigns
// ---------------------------------------------------------------------------

export async function listPromoCodes(): Promise<PromoCode[]> {
  if (!isSupabaseConfigured()) return [...g.__wsbPromoCodes!].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
  if (error) { console.error("listPromoCodes:", error.message); return []; }
  return (data ?? []).map((r) => ({ id: r.id, code: r.code, trialDays: Number(r.trial_days), isActive: r.is_active, uses: Number(r.uses), createdAt: r.created_at }));
}

export async function createPromoCode(code: string, trialDays: number): Promise<void> {
  const c = code.toUpperCase();
  if (!isSupabaseConfigured()) {
    if (g.__wsbPromoCodes!.some((p) => p.code === c)) throw new Error("That code already exists.");
    g.__wsbPromoCodes!.push({ id: randomUUID(), code: c, trialDays, isActive: true, uses: 0, createdAt: new Date().toISOString() });
    return;
  }
  const supabase = getServerSupabase();
  const { error } = await supabase.from("promo_codes").insert({ code: c, trial_days: trialDays });
  if (error) throw new Error(error.code === "23505" ? "That code already exists." : "Could not create the code.");
}

export async function setPromoActive(id: string, active: boolean): Promise<void> {
  if (!isSupabaseConfigured()) {
    const p = g.__wsbPromoCodes!.find((x) => x.id === id);
    if (p) p.isActive = active;
    return;
  }
  const supabase = getServerSupabase();
  await supabase.from("promo_codes").update({ is_active: active }).eq("id", id);
}

/** Validate at signup: returns extra trial days, or null if invalid. Bumps uses. */
export async function redeemPromoCode(code: string): Promise<number | null> {
  const c = code.trim().toUpperCase();
  if (!c) return null;
  if (!isSupabaseConfigured()) {
    const p = g.__wsbPromoCodes!.find((x) => x.code === c && x.isActive);
    if (!p) return null;
    p.uses++;
    return p.trialDays;
  }
  const supabase = getServerSupabase();
  const { data } = await supabase.from("promo_codes").select("*").eq("code", c).eq("is_active", true).maybeSingle();
  if (!data) return null;
  await supabase.from("promo_codes").update({ uses: Number(data.uses) + 1 }).eq("id", data.id);
  return Number(data.trial_days);
}

// ---------------------------------------------------------------------------
// Seller stories — public proof at /stories
// ---------------------------------------------------------------------------

export async function listStories(publishedOnly = true): Promise<SellerStory[]> {
  if (!isSupabaseConfigured()) {
    return [...g.__wsbStories!].filter((s) => !publishedOnly || s.isPublished).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  const supabase = getServerSupabase();
  let q = supabase.from("seller_stories").select("*").order("created_at", { ascending: false });
  if (publishedOnly) q = q.eq("is_published", true);
  const { data, error } = await q;
  if (error) { console.error("listStories:", error.message); return []; }
  return (data ?? []).map((r) => ({ id: r.id, slug: r.slug, title: r.title, sellerName: r.seller_name, body: r.body, isPublished: r.is_published, createdAt: r.created_at }));
}

export async function getStory(slug: string): Promise<SellerStory | null> {
  const all = await listStories(true);
  return all.find((s) => s.slug === slug) ?? null;
}

export async function createStory(input: { title: string; sellerName: string; body: string }): Promise<void> {
  const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) + "-" + Date.now().toString().slice(-4);
  if (!isSupabaseConfigured()) {
    g.__wsbStories!.push({ id: randomUUID(), slug, title: input.title, sellerName: input.sellerName, body: input.body, isPublished: true, createdAt: new Date().toISOString() });
    return;
  }
  const supabase = getServerSupabase();
  await supabase.from("seller_stories").insert({ slug, title: input.title, seller_name: input.sellerName, body: input.body });
}

export async function setStoryPublished(id: string, published: boolean): Promise<void> {
  if (!isSupabaseConfigured()) {
    const s = g.__wsbStories!.find((x) => x.id === id);
    if (s) s.isPublished = published;
    return;
  }
  const supabase = getServerSupabase();
  await supabase.from("seller_stories").update({ is_published: published }).eq("id", id);
}
