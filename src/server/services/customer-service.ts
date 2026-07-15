// Derives a customer list from a shop's orders (grouped by phone).
import { listShopOrders } from "./order-service";
import type { Customer } from "../types";

export async function listCustomers(shopId: string): Promise<Customer[]> {
  const orders = await listShopOrders(shopId);
  const map = new Map<string, Customer>();
  for (const o of orders) {
    const key = o.customerPhone || o.customerName;
    const spent = o.status === "delivered" ? o.total : 0;
    const existing = map.get(key);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += spent;
      if (o.createdAt > existing.lastOrderAt) {
        existing.lastOrderAt = o.createdAt;
        existing.name = o.customerName;
      }
    } else {
      map.set(key, {
        name: o.customerName,
        phone: o.customerPhone,
        orderCount: 1,
        totalSpent: spent,
        lastOrderAt: o.createdAt,
      });
    }
  }
  return [...map.values()].sort((a, b) => (a.lastOrderAt < b.lastOrderAt ? 1 : -1));
}

/** Buyers (name + phone, de-duped) who ordered a specific product. Powers the
 *  "message buyers of this product" restock/review/repeat nudge. */
export async function listProductBuyers(
  shopId: string,
  productId: string
): Promise<{ name: string; phone: string }[]> {
  const orders = await listShopOrders(shopId);
  const map = new Map<string, { name: string; phone: string }>();
  for (const o of orders) {
    if (!o.items.some((it) => it.productId === productId)) continue;
    const key = o.customerPhone || o.customerName;
    if (!key) continue;
    if (!map.has(key)) map.set(key, { name: o.customerName, phone: o.customerPhone });
  }
  return [...map.values()];
}
