import { NextResponse } from "next/server";
import { getShopBySlug } from "@/server/services/shop-service";
import { getProductById } from "@/server/services/product-service";
import { createReview } from "@/server/services/review-service";
import { rateLimitDb, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const shopSlug = String(body.shopSlug ?? "");
    const productId = String(body.productId ?? "");
    const rating = Number(body.rating);
    const author = String(body.author ?? "");
    const comment = String(body.comment ?? "");
    const photos = Array.isArray(body.photos) ? body.photos.map((p: unknown) => String(p)).slice(0, 3) : [];
    if (!shopSlug || !productId) return NextResponse.json({ error: "Missing details." }, { status: 400 });
    if (!Number.isFinite(rating) || rating < 1 || rating > 5)
      return NextResponse.json({ error: "Please choose a rating." }, { status: 400 });
    const shop = await getShopBySlug(shopSlug);
    if (!shop) return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    const product = await getProductById(shop.id, productId);
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    const ip = clientIp(req);
    if (!(await rateLimitDb(`rev-prod:${ip}:${productId}`, 1, 24 * 60 * 60)))
      return NextResponse.json({ error: "You've already reviewed this product." }, { status: 429 });
    if (!(await rateLimitDb(`rev-ip:${ip}`, 5, 60 * 60)))
      return NextResponse.json({ error: "Too many reviews from this device. Please try again later." }, { status: 429 });
    const review = await createReview({ shopId: shop.id, productId, rating, author, comment, photos });
    return NextResponse.json({ review });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not save your review." },
      { status: 400 }
    );
  }
}
