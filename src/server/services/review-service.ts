import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";
import { isOwnUploadRef } from "./upload-service";
import { mockReviews } from "../mock-data";
import type { Review } from "../types";

function rowToReview(r: any): Review {
  return {
    id: r.id,
    shopId: r.shop_id,
    productId: r.product_id,
    rating: Number(r.rating),
    author: r.author,
    comment: r.comment,
    photos: Array.isArray(r.photos) ? r.photos : [],
    createdAt: r.created_at,
  };
}

export async function listReviewsForProduct(shopId: string, productId: string): Promise<Review[]> {
  if (!isSupabaseConfigured()) {
    return mockReviews
      .filter((r) => r.shopId === shopId && r.productId === productId)
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("shop_id", shopId)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToReview);
}

export async function createReview(input: {
  shopId: string;
  productId: string;
  rating: number;
  author: string;
  comment: string;
  photos?: string[];
}): Promise<Review> {
  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
  const author = input.author.trim().slice(0, 60) || "Anonymous";
  const comment = input.comment.trim().slice(0, 1000);
  // Only keep valid-looking upload refs, max 3.
  const photos = (input.photos ?? [])
    .filter((u) => typeof u === "string" && isOwnUploadRef(u))
    .slice(0, 3);
  if (!isSupabaseConfigured()) {
    const review: Review = {
      id: `rev-${Date.now()}`,
      shopId: input.shopId,
      productId: input.productId,
      rating,
      author,
      comment,
      photos,
      createdAt: new Date().toISOString(),
    };
    mockReviews.push(review);
    return review;
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("reviews")
    .insert({ shop_id: input.shopId, product_id: input.productId, rating, author, comment, photos })
    .select("*")
    .single();
  if (error || !data) {
    console.error("createReview:", error);
    throw new Error("Could not save your review. Please try again.");
  }
  return rowToReview(data);
}

export function reviewSummary(reviews: Review[]): { count: number; average: number } {
  if (reviews.length === 0) return { count: 0, average: 0 };
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return { count: reviews.length, average: Math.round((sum / reviews.length) * 10) / 10 };
}

export async function listReviewsForShop(shopId: string): Promise<Review[]> {
  if (!isSupabaseConfigured()) {
    return mockReviews
      .filter((r) => r.shopId === shopId)
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToReview);
}

export async function deleteReview(shopId: string, id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const i = mockReviews.findIndex((r) => r.id === id && r.shopId === shopId);
    if (i >= 0) mockReviews.splice(i, 1);
    return;
  }
  const supabase = getServerSupabase();
  await supabase.from("reviews").delete().eq("id", id).eq("shop_id", shopId);
}

export function summarizeByProduct(
  reviews: Review[]
): Map<string, { count: number; average: number }> {
  const groups = new Map<string, Review[]>();
  for (const r of reviews) {
    const arr = groups.get(r.productId) ?? [];
    arr.push(r);
    groups.set(r.productId, arr);
  }
  const out = new Map<string, { count: number; average: number }>();
  for (const [pid, list] of groups) out.set(pid, reviewSummary(list));
  return out;
}
