import { NextResponse } from "next/server";
import { getCurrentSeller } from "@/server/auth/current-seller";
import {
  saveProductImage,
  MAX_UPLOAD_BYTES,
  ALLOWED_TYPES,
} from "@/server/services/upload-service";
import { sniffImageType } from "@/server/image";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const seller = await getCurrentSeller();
  if (!seller) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
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
  // Fast reject on the declared type…
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, WEBP or GIF image." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image must be under 4 MB." }, { status: 400 });
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    // …but TRUST the magic bytes, not the client-sent MIME type.
    const realType = sniffImageType(buf);
    if (!realType) {
      return NextResponse.json(
        { error: "That file isn't a valid image (JPG, PNG, WEBP or GIF)." },
        { status: 400 }
      );
    }
    const url = await saveProductImage(buf, realType, seller.shop.id);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed." },
      { status: 500 }
    );
  }
}
