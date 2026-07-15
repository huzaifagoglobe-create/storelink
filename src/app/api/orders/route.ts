// Backend endpoint: place an order. Thin wrapper — all logic lives in the
// order-service. Prices and totals are recomputed there on the server.
import { NextResponse } from "next/server";
import { createOrder } from "@/server/services/order-service";
import { rateLimitDb, clientIp } from "@/lib/rate-limit";
import type { CreateOrderInput } from "@/server/types";

export async function POST(req: Request) {
  const ip = clientIp(req);
  // Anti-abuse: cap order creation per IP (burst + hourly) to limit fake-COD floods.
  if (!(await rateLimitDb(`order-ip:${ip}`, 8, 60))) {
    return NextResponse.json({ error: "Too many orders too quickly. Please wait a moment." }, { status: 429 });
  }
  if (!(await rateLimitDb(`order-ip-hr:${ip}`, 40, 60 * 60))) {
    return NextResponse.json({ error: "Too many orders from this connection. Please try later." }, { status: 429 });
  }
  try {
    const body = (await req.json()) as CreateOrderInput;
    const order = await createOrder(body);
    return NextResponse.json({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not place the order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
