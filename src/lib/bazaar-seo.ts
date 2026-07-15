import type { Shop } from "@/server/types";

/**
 * Bazaar SEO landing pages: category and category×city pages built from REAL
 * verified shops, targeting exactly what Pakistanis type into Google
 * ("online clothing shops in Lahore cash on delivery"). Pages only exist where
 * shops exist — no thin/empty pages that hurt SEO.
 */

export const BAZAAR_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Hyderabad",
  "Quetta",
  "Sialkot",
  "Gujranwala",
] as const;

export function catSlug(industry: string): string {
  return industry.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function citySlug(city: string): string {
  return city.toLowerCase();
}

/** Verified+active shops in a category (by slug). */
export function shopsInCategory(shops: Shop[], categorySlug: string): { industry: string; shops: Shop[] } | null {
  const match = shops.filter((s) => s.industry && catSlug(s.industry) === categorySlug);
  if (match.length === 0) return null;
  return { industry: match[0].industry as string, shops: match };
}

/** Shops in a category whose address mentions the city. */
export function shopsInCategoryCity(shops: Shop[], categorySlug: string, cSlug: string): { industry: string; city: string; shops: Shop[] } | null {
  const city = BAZAAR_CITIES.find((c) => citySlug(c) === cSlug);
  if (!city) return null;
  const cat = shopsInCategory(shops, categorySlug);
  if (!cat) return null;
  const inCity = cat.shops.filter((s) => (s.address ?? "").toLowerCase().includes(city.toLowerCase()));
  if (inCity.length === 0) return null;
  return { industry: cat.industry, city, shops: inCity };
}

/** All non-empty landing-page combos — used by the sitemap and Bazaar footer links. */
export function bazaarLandingPages(shops: Shop[]): { href: string; label: string }[] {
  const verified = shops.filter((s) => s.isActive && s.verificationStatus === "verified");
  const out: { href: string; label: string }[] = [];
  const cats = new Map<string, Shop[]>();
  for (const s of verified) {
    if (!s.industry) continue;
    const key = catSlug(s.industry);
    cats.set(key, [...(cats.get(key) ?? []), s]);
  }
  for (const [slug, list] of cats) {
    out.push({ href: `/bazaar/${slug}`, label: `${list[0].industry} shops in Pakistan` });
    for (const city of BAZAAR_CITIES) {
      if (list.some((s) => (s.address ?? "").toLowerCase().includes(city.toLowerCase()))) {
        out.push({ href: `/bazaar/${slug}/${citySlug(city)}`, label: `${list[0].industry} shops in ${city}` });
      }
    }
  }
  return out;
}
