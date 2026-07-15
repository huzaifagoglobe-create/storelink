import { NextResponse } from "next/server";
import { getCurrentSeller } from "@/server/auth/current-seller";
import { listShopOrders } from "@/server/services/order-service";

export async function GET() {
  const seller = await getCurrentSeller();
  if (!seller) return NextResponse.json({ count: null }, { status: 401 });
  const orders = await listShopOrders(seller.shop.id);
  const count = orders.filter((o) => o.status === "new").length;
  return NextResponse.json({ count });
}
