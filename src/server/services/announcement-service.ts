import "server-only";
import { randomUUID } from "crypto";
import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";
import type { Announcement } from "../types";

// Demo store pinned to globalThis so every route bundle shares one copy.
const g = globalThis as unknown as { __wsbAnnouncements?: Announcement[] };
g.__wsbAnnouncements ??= [];
const store = g.__wsbAnnouncements;

function rowTo(r: any): Announcement {
  return { id: r.id, message: r.message, isActive: r.is_active, createdAt: r.created_at };
}

export async function listAnnouncements(): Promise<Announcement[]> {
  if (!isSupabaseConfigured()) return [...store].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(30);
  if (error) {
    console.error("listAnnouncements:", error.message);
    return [];
  }
  return (data ?? []).map(rowTo);
}

/** The newest active announcement (what sellers see), or null. */
export async function latestAnnouncement(): Promise<Announcement | null> {
  const all = await listAnnouncements();
  return all.find((a) => a.isActive) ?? null;
}

export async function createAnnouncement(message: string): Promise<Announcement> {
  if (!isSupabaseConfigured()) {
    const a: Announcement = { id: randomUUID(), message, isActive: true, createdAt: new Date().toISOString() };
    store.push(a);
    return a;
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from("announcements").insert({ message }).select().single();
  if (error) throw new Error("Could not post the announcement: " + error.message);
  return rowTo(data);
}

export async function setAnnouncementActive(id: string, active: boolean): Promise<void> {
  if (!isSupabaseConfigured()) {
    const a = store.find((x) => x.id === id);
    if (a) a.isActive = active;
    return;
  }
  const supabase = getServerSupabase();
  await supabase.from("announcements").update({ is_active: active }).eq("id", id);
}
