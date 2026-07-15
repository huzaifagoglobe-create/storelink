import "server-only";
import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";

// Demo store on globalThis so views persist across route bundles. Each entry is
// { shopId, productId, kind, ts }. Unused in real mode (Postgres is the source).
interface PV { shopId: string; productId: string | null; kind: "shop" | "product"; ts: number; source?: string | null }
const g = globalThis as unknown as { __wsbViews?: PV[] };
if (!g.__wsbViews) g.__wsbViews = [];
const views = g.__wsbViews;

/** Record a storefront or product page view. Fire-and-forget; never throws. */
export async function recordView(shopId: string, kind: "shop" | "product", productId?: string | null, source?: string | null): Promise<void> {
  if (!shopId) return;
  try {
    if (!isSupabaseConfigured()) {
      views.push({ shopId, productId: productId ?? null, kind, ts: Date.now(), source: source ?? null });
      // keep memory bounded in demo
      if (views.length > 5000) views.splice(0, views.length - 5000);
      return;
    }
    const supabase = getServerSupabase();
    await supabase.from("page_views").insert({ shop_id: shopId, product_id: productId ?? null, kind, source: source ?? null });
  } catch (e) {
    console.error("recordView:", e);
  }
}

export interface ShopStats {
  totalViews: number;
  shopViews: number;
  productViews: number;
  views7d: number;
  views30d: number;
  topProducts: { productId: string; views: number }[];
  dailyLast14: { day: string; views: number }[]; // oldest → newest
  /** Where visitors come from: Instagram, TikTok, WhatsApp, Google, Direct… */
  sources: { source: string; views: number }[];
}

/** Aggregate view stats for a seller's dashboard. */
export async function getShopStats(shopId: string): Promise<ShopStats> {
  const now = Date.now();
  const day = 86400000;
  const empty: ShopStats = {
    totalViews: 0, shopViews: 0, productViews: 0, views7d: 0, views30d: 0,
    topProducts: [], dailyLast14: [], sources: [],
  };

  let rows: PV[];
  if (!isSupabaseConfigured()) {
    rows = views.filter((v) => v.shopId === shopId);
  } else {
    const supabase = getServerSupabase();
    const since = new Date(now - 30 * day).toISOString();
    const { data, error } = await supabase
      .from("page_views")
      .select("product_id, kind, created_at, source")
      .eq("shop_id", shopId)
      .gte("created_at", since)
      .limit(50000);
    if (error) {
      console.error("getShopStats:", error.message);
      return empty;
    }
    rows = (data ?? []).map((r) => ({
      shopId,
      productId: r.product_id ?? null,
      kind: r.kind as "shop" | "product",
      ts: new Date(r.created_at).getTime(),
      source: r.source ?? null,
    }));
  }

  if (rows.length === 0) return empty;

  const shopViews = rows.filter((r) => r.kind === "shop").length;
  const productViews = rows.filter((r) => r.kind === "product").length;
  const views7d = rows.filter((r) => r.ts >= now - 7 * day).length;
  const views30d = rows.filter((r) => r.ts >= now - 30 * day).length;

  const perProduct = new Map<string, number>();
  for (const r of rows) {
    if (r.kind === "product" && r.productId) {
      perProduct.set(r.productId, (perProduct.get(r.productId) ?? 0) + 1);
    }
  }
  const topProducts = [...perProduct.entries()]
    .map(([productId, v]) => ({ productId, views: v }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  // Last 14 days, bucketed by calendar day (oldest first).
  const dailyLast14: { day: string; views: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dStart = new Date(now - i * day);
    dStart.setHours(0, 0, 0, 0);
    const start = dStart.getTime();
    const end = start + day;
    const count = rows.filter((r) => r.ts >= start && r.ts < end).length;
    dailyLast14.push({
      day: dStart.toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
      views: count,
    });
  }

  const perSource = new Map<string, number>();
  for (const r of rows) {
    const src = r.source || "Direct / other";
    perSource.set(src, (perSource.get(src) ?? 0) + 1);
  }
  const sources = [...perSource.entries()]
    .map(([source, v]) => ({ source, views: v }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  return {
    totalViews: rows.length,
    shopViews,
    productViews,
    views7d,
    views30d,
    topProducts,
    dailyLast14,
    sources,
  };
}
