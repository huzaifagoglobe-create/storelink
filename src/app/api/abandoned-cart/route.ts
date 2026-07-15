import { NextRequest, NextResponse } from "next/server";
import { getShopBySlug } from "@/server/services/shop-service";
import { saveAbandonedCart } from "@/server/services/abandoned-cart-service";
import { rateLimitDb, ipFromForwarded } from "@/lib/rate-limit";
import type { AbandonedCartItem } from "@/server/types";

export const runtime = "nodejs";

/**
 * Called from the checkout page when a buyer has entered a valid phone but
 * hasn't placed the order yet. Stores the cart so the seller can follow up.
 * Best-effort — never blocks checkout, always returns quickly.
 */
export async function POST(req: NextRequest) {
  const ip = ipFromForwarded(req.headers.get("x-forwarded-for"), req.headers.get("x-real-ip"));
  if (!(await rateLimitDb(`abandon:${ip}`, 30, 60))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const slug = typeof body.shopSlug === "string" ? body.shopSlug : "";
  const phone = typeof body.customerPhone === "string" ? body.customerPhone : "";
  const name = typeof body.customerName === "string" ? body.customerName.slice(0, 120) : null;
  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (!slug || !phone || rawItems.length === 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const shop = await getShopBySlug(slug);
  if (!shop) return NextResponse.json({ ok: false }, { status: 404 });

  const items: AbandonedCartItem[] = rawItems.slice(0, 50).map((it: Record<string, unknown>) => ({
    productId: String(it.productId ?? "").slice(0, 60),
    name: String(it.name ?? "").slice(0, 160),
    price: Number(it.price) || 0,
    quantity: Math.max(1, Math.min(999, Number(it.quantity) || 1)),
    variant: it.variant ? String(it.variant).slice(0, 120) : null,
  }));
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  try {
    await saveAbandonedCart({ shopId: shop.id, customerName: name, customerPhone: phone, items, subtotal });
  } catch (e) {
    console.error("abandon capture:", e);
  }
  return NextResponse.json({ ok: true });
}
