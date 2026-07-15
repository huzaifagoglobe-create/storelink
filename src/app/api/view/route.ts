import { NextResponse } from "next/server";
import { getShopBySlug } from "@/server/services/shop-service";
import { recordView } from "@/server/services/analytics-service";
import { rateLimitDb, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Turn a raw referrer / ?src tag into a friendly source name for sellers. */
function classifySource(raw?: string): string | null {
  const r = (raw ?? "").toLowerCase();
  if (!r) return null;
  if (r.includes("instagram")) return "Instagram";
  if (r.includes("facebook") || r.includes("fb.")) return "Facebook";
  if (r.includes("tiktok")) return "TikTok";
  if (r.includes("wa.me") || r.includes("whatsapp")) return "WhatsApp";
  if (r.includes("google")) return "Google";
  if (r.includes("youtube") || r.includes("youtu.be")) return "YouTube";
  if (r.includes("t.co") || r.includes("twitter") || r.includes("x.com")) return "X (Twitter)";
  if (r.includes("snapchat")) return "Snapchat";
  if (r.startsWith("http")) return "Other websites";
  // bare ?src= tags like "insta-bio"
  return raw ? raw.slice(0, 40) : null;
}

/**
 * Lightweight view beacon. Called on storefront/product page load to record a
 * visit for the seller's analytics. No PII, best-effort, never blocks.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  // Generous cap — real visitors trigger this once per page; blocks floods.
  if (!(await rateLimitDb(`view:${ip}`, 120, 60))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  let body: { slug?: string; kind?: string; productId?: string; ref?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const slug = (body.slug ?? "").toString();
  const kind = body.kind === "product" ? "product" : "shop";
  const productId = body.productId ? body.productId.toString().slice(0, 60) : null;
  if (!slug) return NextResponse.json({ ok: false }, { status: 400 });

  const shop = await getShopBySlug(slug);
  if (!shop) return NextResponse.json({ ok: false }, { status: 404 });

  await recordView(shop.id, kind, kind === "product" ? productId : null, classifySource(body.ref));
  return NextResponse.json({ ok: true });
}
