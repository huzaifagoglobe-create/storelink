import { NextRequest, NextResponse } from "next/server";
import { activeGateway } from "@/server/payments/gateway";
import { markOrderPayment, getOrderById } from "@/server/services/order-service";
import { getShopById } from "@/server/services/shop-service";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";

// Extract the order id from our gateway reference (format: PREFIX-<orderId>-<rand>).
function orderIdFromRef(ref: string): string | null {
  const parts = ref.split("-");
  return parts.length >= 3 ? parts[1] : null;
}

async function handle(params: Record<string, string>): Promise<NextResponse> {
  const gateway = activeGateway();
  const result = await gateway.verify(params);
  const orderId = orderIdFromRef(result.gatewayRef);
  if (!orderId) {
    return NextResponse.redirect(`${SITE_URL}/`);
  }

  const updated = await markOrderPayment(
    orderId,
    result.status === "paid" ? "paid" : "failed",
    gateway.name,
    result.gatewayRef
  );
  const order = updated ?? (await getOrderById(orderId));
  if (!order) return NextResponse.redirect(`${SITE_URL}/`);

  const shop = await getShopById(order.shopId);
  const slug = shop?.slug ?? "";
  const status = result.status === "paid" ? "paid" : "failed";
  return NextResponse.redirect(`${SITE_URL}/${slug}/order/${order.publicToken}?payment=${status}`);
}

// Buyers return via GET (redirect from the gateway/mock page).
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  return handle(params);
}

// Some gateways POST the result server-to-server.
export async function POST(req: NextRequest) {
  let params: Record<string, string> = {};
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      params = await req.json();
    } else {
      const form = await req.formData();
      params = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
    }
  } catch {
    params = Object.fromEntries(req.nextUrl.searchParams.entries());
  }
  return handle(params);
}
