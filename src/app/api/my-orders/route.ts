import { NextResponse } from "next/server";
import { listOrdersByPhone } from "@/server/services/order-service";
import { getShopById } from "@/server/services/shop-service";
import { rateLimitDb, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Buyer "My Orders" lookup across all StoreLink shops. Requires the phone AND
 * one of the buyer's own order numbers, so a phone number alone can't unlock
 * someone else's history. Tightly rate-limited.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await rateLimitDb(`myorders:${ip}`, 8, 300))) {
    return NextResponse.json({ error: "Too many tries — please wait a few minutes." }, { status: 429 });
  }
  let body: { phone?: string; orderNumber?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const orders = await listOrdersByPhone((body.phone ?? "").toString(), (body.orderNumber ?? "").toString());
  if (!orders) {
    return NextResponse.json(
      { error: "No match. Check the phone number and that the order number is one of yours." },
      { status: 404 }
    );
  }
  const shopNames = new Map<string, { name: string; slug: string }>();
  for (const o of orders) {
    if (!shopNames.has(o.shopId)) {
      const s = await getShopById(o.shopId);
      shopNames.set(o.shopId, { name: s?.name ?? "Shop", slug: s?.slug ?? "" });
    }
  }
  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      shop: shopNames.get(o.shopId)?.name ?? "Shop",
      status: o.status,
      total: o.total,
      createdAt: o.createdAt,
      trackUrl: `/${shopNames.get(o.shopId)?.slug}/order/${o.publicToken}`,
    })),
  });
}
