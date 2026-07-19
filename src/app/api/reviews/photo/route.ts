import { NextResponse } from "next/server";
import { getShopBySlug } from "@/server/services/shop-service";
import { saveProductImage } from "@/server/services/upload-service";
import { sniffImageType } from "@/server/image";
import { rateLimitDb, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Public endpoint so BUYERS (not logged in) can attach photos to a review.
// Re-encodes through sharp (same as product images), rate-limited, size-capped.
// Same cap as product photos — buyers shoot on the same phones.
// (Still re-encoded to WebP, so the stored size stays tiny.)
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await rateLimitDb(`revphoto:${ip}`, 12, 60 * 60))) {
    return NextResponse.json({ error: "Too many uploads. Please try again later." }, { status: 429 });
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  const slug = String(form.get("shopSlug") ?? "");
  const file = form.get("file");
  if (!slug || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing details." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 10 MB." }, { status: 400 });
  }
  const shop = await getShopBySlug(slug);
  if (!shop) return NextResponse.json({ error: "Shop not found." }, { status: 404 });

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const realType = sniffImageType(buf);
    if (!realType) {
      return NextResponse.json({ error: "Use a JPG, PNG, WEBP or GIF image." }, { status: 400 });
    }
    const url = await saveProductImage(buf, realType, shop.id);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("review photo upload:", e);
    return NextResponse.json({ error: "Could not upload the image." }, { status: 400 });
  }
}
