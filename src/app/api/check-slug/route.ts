import { NextResponse } from "next/server";
import { isSlugTaken } from "@/server/services/shop-service";
import { normalizeSlug } from "@/server/validate";
import { rateLimitDb, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// GET /api/check-slug?slug=rafique-cloths
// -> { slug, available, tooShort?, suggestions: string[] }
export async function GET(req: Request) {
  if (!(await rateLimitDb(`slug-ip:${clientIp(req)}`, 40, 60))) {
    return NextResponse.json({ slug: "", available: false, suggestions: [] }, { status: 429 });
  }
  const raw = new URL(req.url).searchParams.get("slug") ?? "";
  const slug = normalizeSlug(raw);

  if (slug.length < 3) {
    return NextResponse.json({ slug, available: false, tooShort: true, suggestions: [] });
  }

  if (!(await isSlugTaken(slug))) {
    return NextResponse.json({ slug, available: true, suggestions: [] });
  }

  // Taken — offer up to 3 brandable, available alternatives.
  const seeds = ["-store", "-official", "-pk", "-shop", "-2", "-3"];
  const suggestions: string[] = [];
  for (const suf of seeds) {
    if (suggestions.length >= 3) break;
    const cand = normalizeSlug(slug + suf);
    if (cand.length >= 3 && !(await isSlugTaken(cand))) suggestions.push(cand);
  }
  return NextResponse.json({ slug, available: false, suggestions });
}
