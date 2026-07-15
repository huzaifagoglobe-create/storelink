import { NextResponse } from "next/server";
import { createSellerLead } from "@/server/services/growth-services";
import { rateLimitDb, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** "Get your shop built free" — prospect leads into the founder's pipeline. */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await rateLimitDb(`slead:${ip}`, 5, 3600))) {
    return NextResponse.json({ error: "Too many tries — please wait a bit." }, { status: 429 });
  }
  let body: { name?: string; whatsapp?: string; selling?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const name = (body.name ?? "").toString().trim().slice(0, 60);
  const whatsapp = (body.whatsapp ?? "").toString().trim().slice(0, 20);
  const selling = (body.selling ?? "").toString().trim().slice(0, 80) || null;
  const source = (body.source ?? "").toString().trim().slice(0, 40) || null;
  if (name.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!/^\+?\d[\d\s-]{8,17}$/.test(whatsapp)) return NextResponse.json({ error: "Please enter a valid WhatsApp number." }, { status: 400 });
  await createSellerLead({ name, whatsapp, selling, source });
  return NextResponse.json({ ok: true });
}
