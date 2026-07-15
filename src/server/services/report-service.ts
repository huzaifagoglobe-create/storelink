import "server-only";
import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";
import type { ShopReport } from "../types";

const mockReports: ShopReport[] = [];

function rowToReport(r: any): ShopReport {
  return {
    id: r.id,
    shopId: r.shop_id,
    reason: r.reason,
    details: r.details ?? null,
    status: r.status,
    createdAt: r.created_at,
  };
}

export async function createReport(input: {
  shopId: string;
  reason: string;
  details: string | null;
}): Promise<void> {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured()) {
    mockReports.push({
      id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      shopId: input.shopId,
      reason: input.reason,
      details: input.details,
      status: "open",
      createdAt: now,
    });
    return;
  }
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("shop_reports")
    .insert({ shop_id: input.shopId, reason: input.reason, details: input.details, status: "open" });
  if (error) {
    console.error("createReport:", error);
    throw new Error("Could not submit the report. Please try again.");
  }
}

/** All open reports, newest first (admin). */
export async function listOpenReports(): Promise<ShopReport[]> {
  if (!isSupabaseConfigured()) {
    return [...mockReports]
      .filter((r) => r.status === "open")
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("shop_reports")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });
  return (data ?? []).map(rowToReport);
}

export async function dismissReport(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const r = mockReports.find((x) => x.id === id);
    if (r) r.status = "dismissed";
    return;
  }
  const supabase = getServerSupabase();
  const { error } = await supabase.from("shop_reports").update({ status: "dismissed" }).eq("id", id);
  if (error) console.error("dismissReport:", error);
}
