import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { activateSubscription } from "@/server/services/shop-service";
import { PLAN_TIERS } from "@/server/plans";
import type { PlanTier } from "@/server/types";

/**
 * Gateway-ready billing webhook. Inert until BILLING_WEBHOOK_SECRET is set.
 *
 * Point your payment gateway (AssanPay/Safepay/etc.) here once you integrate it.
 * Each gateway sends a different payload + signature scheme — BEFORE enabling a
 * real gateway, replace the shared-secret check below with that gateway's HMAC
 * signature verification over the raw request body. For now it accepts a simple
 * shared-secret JSON so you can test end-to-end:
 *
 *   POST /api/billing/webhook
 *   { "secret": "...", "shopId": "...", "plan": "basic", "months": 1, "amount": 2500, "reference": "txn_123" }
 *
 * Replays are safe: a repeated `reference` for the same shop is ignored
 * (idempotency is enforced in activateSubscription).
 */

// Constant-time compare so the shared secret can't be recovered via timing.
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const secret = process.env.BILLING_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Billing webhook not configured." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const provided = req.headers.get("x-billing-secret") || (typeof body.secret === "string" ? body.secret : "");
  if (!provided || !secretMatches(provided, secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const shopId = typeof body.shopId === "string" ? body.shopId : "";
  const plan = typeof body.plan === "string" ? body.plan : "";
  const months = Number(body.months) || 1;
  const amount = Number(body.amount) || 0;
  const reference = typeof body.reference === "string" ? body.reference : undefined;

  if (!shopId || !plan) {
    return NextResponse.json({ error: "Missing shopId or plan." }, { status: 400 });
  }
  // Only accept known plan tiers — never write an arbitrary plan label.
  if (!PLAN_TIERS.includes(plan as PlanTier)) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }

  try {
    await activateSubscription(shopId, { plan, months, amount, method: "gateway", reference, recordedBy: "webhook" });
  } catch (e) {
    console.error("billing webhook:", e);
    return NextResponse.json({ error: "Could not record payment." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
