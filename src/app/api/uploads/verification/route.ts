import { NextResponse } from "next/server";
import { getCurrentSeller } from "@/server/auth/current-seller";
import {
  saveVerificationDoc,
  MAX_UPLOAD_BYTES,
  ALLOWED_TYPES,
} from "@/server/services/upload-service";
import { sniffImageType } from "@/server/image";
import { rateLimitDb, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Upload a CNIC photo or selfie into the PRIVATE bucket. Seller-auth required.
export async function POST(req: Request) {
  const seller = await getCurrentSeller();
  if (!seller) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!(await rateLimitDb(`vdoc-ip:${clientIp(req)}`, 20, 60 * 60))) {
    return NextResponse.json({ error: "Too many uploads. Please try again later." }, { status: 429 });
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  if (!file) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, WEBP or GIF image." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image must be under 4 MB." }, { status: 400 });
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const realType = sniffImageType(buf);
    if (!realType) {
      return NextResponse.json({ error: "That file isn't a valid image." }, { status: 400 });
    }
    const ref = await saveVerificationDoc(buf, realType, seller.shop.id);
    return NextResponse.json({ url: ref });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed." },
      { status: 500 }
    );
  }
}
