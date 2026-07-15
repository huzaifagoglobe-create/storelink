import { NextResponse } from "next/server";
import { createOrder, getOrderById } from "@/server/services/order-service";
import { activeGateway, onlinePaymentEnabled } from "@/server/payments/gateway";
import { rateLimitDb, clientIp } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/site";
import type { CreateOrderInput } from "@/server/types";

export const runtime = "nodejs";

/**
 * Start an online payment. Creates the order in a "pending" payment state, then
 * asks the active gateway for a redirect URL to send the buyer to. The order
 * only becomes "paid" once the callback verifies it.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await rateLimitDb(`pay-init:${ip}`, 8, 60))) {
    return NextResponse.json({ error: "Too many attempts. Please wait a moment." }, { status: 429 });
  }
  if (!onlinePaymentEnabled()) {
    return NextResponse.json({ error: "Online payment is not available right now." }, { status: 400 });
  }

  let order;
  try {
    const body = (await req.json()) as CreateOrderInput;
    // Force online — this endpoint is only for gateway payments.
    order = await createOrder({ ...body, paymentMethod: "online" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const gateway = activeGateway();
    const base = SITE_URL || "";
    const { redirectUrl, gatewayRef } = await gateway.initiate({
      orderId: order.id,
      amount: order.total,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      returnUrl: `${base}/api/pay/callback`,
      callbackUrl: `${base}/api/pay/callback`,
    });
    // Re-fetch to confirm the order still exists (defensive).
    const fresh = await getOrderById(order.id);
    return NextResponse.json({
      redirectUrl,
      gatewayRef,
      orderId: order.id,
      token: fresh?.publicToken ?? order.publicToken,
    });
  } catch (err) {
    console.error("pay/init:", err);
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 500 });
  }
}
