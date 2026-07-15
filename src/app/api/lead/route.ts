import { NextResponse } from "next/server";
import { getShopBySlug } from "@/server/services/shop-service";
import { saveLead } from "@/server/services/lead-service";
import { rateLimitDb, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Public: a visitor opts in (notify-me / newsletter). Feeds seller broadcast. */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await rateLimitDb(`lead:${ip}`, 15, 60))) {
    return NextResponse.json({ ok: false, error: "Please wait a moment." }, { status: 429 });
  }
  let body: { slug?: string; phone?: string; name?: string; source?: string; productId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const slug = (body.slug ?? "").toString();
  const phone = (body.phone ?? "").toString();
  if (!slug || phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ ok: false, error: "Enter a valid phone number." }, { status: 400 });
  }
  const shop = await getShopBySlug(slug);
  if (!shop) return NextResponse.json({ ok: false }, { status: 404 });

  const ok = await saveLead({
    shopId: shop.id,
    phone,
    name: body.name ? body.name.toString().slice(0, 120) : null,
    source: body.source === "newsletter" ? "newsletter" : "notify",
    productId: body.productId ? body.productId.toString().slice(0, 60) : null,
  });
  return NextResponse.json({ ok });
}
