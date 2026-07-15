import "server-only";
import { listAllShops, getShopById } from "./shop-service";
import { listShopProducts } from "./product-service";
import { listShopOrders, listAllOrders } from "./order-service";
import { PLAN_PRICE_PKR } from "../plans";
import type { Order, PlanTier, Shop } from "../types";

export interface AdminShopRow {
  shop: Shop;
  orderCount: number;
  revenue: number; // sum of non-cancelled order totals
}

export interface PlatformStats {
  totalShops: number;
  activeShops: number;
  pausedShops: number;
  totalOrders: number;
  totalRevenue: number;
  planCounts: Record<PlanTier, number>;
  mrr: number; // estimated monthly recurring revenue = active shops × plan price
}

/** Every shop with its order count and revenue. One pass over all orders. */
export async function listAdminShops(): Promise<AdminShopRow[]> {
  const [shops, orders] = await Promise.all([listAllShops(), listAllOrders()]);
  const byShop = new Map<string, { count: number; revenue: number }>();
  for (const o of orders) {
    const agg = byShop.get(o.shopId) ?? { count: 0, revenue: 0 };
    agg.count += 1;
    if (o.status !== "cancelled") agg.revenue += o.total;
    byShop.set(o.shopId, agg);
  }
  return shops.map((shop) => {
    const agg = byShop.get(shop.id) ?? { count: 0, revenue: 0 };
    return { shop, orderCount: agg.count, revenue: agg.revenue };
  });
}

export function summarizeShops(rows: AdminShopRow[]): PlatformStats {
  const planCounts: Record<PlanTier, number> = { trial: 0, basic: 0, pro: 0, premium: 0 };
  let activeShops = 0;
  let totalOrders = 0;
  let totalRevenue = 0;
  let mrr = 0;
  for (const { shop, orderCount, revenue } of rows) {
    planCounts[shop.plan] += 1;
    totalOrders += orderCount;
    totalRevenue += revenue;
    if (shop.isActive) {
      activeShops += 1;
      mrr += PLAN_PRICE_PKR[shop.plan];
    }
  }
  return {
    totalShops: rows.length,
    activeShops,
    pausedShops: rows.length - activeShops,
    totalOrders,
    totalRevenue,
    planCounts,
    mrr,
  };
}

export interface AdminShopDetail {
  shop: Shop;
  orderCount: number;
  productCount: number;
  revenue: number;
  recentOrders: Order[];
}

export async function getAdminShopDetail(shopId: string): Promise<AdminShopDetail | null> {
  const shop = await getShopById(shopId);
  if (!shop) return null;
  const [orders, products] = await Promise.all([
    listShopOrders(shopId),
    listShopProducts(shopId),
  ]);
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);
  return {
    shop,
    orderCount: orders.length,
    productCount: products.length,
    revenue,
    recentOrders: orders.slice(0, 6),
  };
}
