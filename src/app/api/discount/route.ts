import { NextResponse } from "next/server";
import { getShopBySlug } from "@/server/services/shop-service";
import { getActiveDiscountByCode, discountAmount } from "@/server/services/discount-service";
import { rateLimitDb, clientIp } from "@/lib/rate-limit";

export async function GET(req: Request) {
  if (!(await rateLimitDb(`disc-ip:${clientIp(req)}`, 20, 60))) {
    return NextResponse.json({ valid: false, message: "Please slow down and try again." }, { status: 429 });
  }
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") ?? "";
  const code = searchParams.get("code") ?? "";
  const subtotal = Math.max(0, Math.floor(Number(searchParams.get("subtotal")) || 0));
  if (!slug || !code) return NextResponse.json({ valid: false });
  const shop = await getShopBySlug(slug);
  if (!shop) return NextResponse.json({ valid: false });
  const d = await getActiveDiscountByCode(shop.id, code);
  if (!d) return NextResponse.json({ valid: false, message: "Invalid or expired code." });
  const discount = discountAmount(subtotal, d);
  return NextResponse.json({
    valid: discount > 0,
    code: d.code,
    type: d.type,
    value: d.value,
    discount,
    message: discount > 0 ? "Code applied." : "This code doesn’t apply to your cart.",
  });
}
