import { NextResponse } from "next/server";
import { requireSeller } from "@/server/auth/current-seller";
import { rewriteDescription } from "@/server/services/description-service";
import { rateLimitDb, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Seller-only: rewrite a product description to make it unique. */
export async function POST(req: Request) {
  let shop;
  try {
    ({ shop } = await requireSeller());
  } catch {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  // Cap usage so it can't be spammed (AI calls cost money).
  const ip = clientIp(req);
  if (!(await rateLimitDb(`rewrite:${shop.id}:${ip}`, 20, 300))) {
    return NextResponse.json({ error: "You've done that a lot — please wait a few minutes." }, { status: 429 });
  }

  let body: { name?: string; description?: string; category?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const name = (body.name ?? "").toString().slice(0, 200).trim();
  const description = (body.description ?? "").toString().slice(0, 6000);
  const category = body.category ? body.category.toString().slice(0, 80) : null;
  if (!name && !description) {
    return NextResponse.json({ error: "Add a product name or description first." }, { status: 400 });
  }

  try {
    const rewritten = await rewriteDescription({ name, description, category });
    return NextResponse.json({ description: rewritten });
  } catch (e) {
    console.error("rewrite route:", e);
    return NextResponse.json({ error: "Could not rewrite right now. Please try again." }, { status: 500 });
  }
}
