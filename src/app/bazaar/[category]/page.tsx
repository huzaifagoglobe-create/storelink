import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { listAllShops } from "@/server/services/shop-service";
import { shopsInCategory, BAZAAR_CITIES, citySlug, catSlug } from "@/lib/bazaar-seo";

export const revalidate = 3600;

async function load(categorySlug: string) {
  const all = (await listAllShops())
    .filter((s) => s.isActive && s.verificationStatus === "verified")
    .sort((a, b) => Number(b.featured) - Number(a.featured));
  return shopsInCategory(all, categorySlug);
}

export async function generateMetadata({ params: _p }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await _p;
  const data = await load(category);
  if (!data) return {};
  return {
    title: `Online ${data.industry} shops in Pakistan — Cash on Delivery | StoreLink Bazaar`,
    description: `Browse ${data.shops.length} verified online ${data.industry.toLowerCase()} shop${data.shops.length > 1 ? "s" : ""} in Pakistan. Real sellers, Cash on Delivery, tracked parcels.`,
  };
}

export default async function BazaarCategoryPage({ params: _p }: { params: Promise<{ category: string }> }) {
  const { category } = await _p;
  const data = await load(category);
  if (!data) notFound();
  const cities = BAZAAR_CITIES.filter((c) =>
    data.shops.some((s) => (s.address ?? "").toLowerCase().includes(c.toLowerCase()))
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav className="text-xs text-muted">
        <Link href="/bazaar" className="hover:text-primary">Bazaar</Link> / {data.industry}
      </nav>
      <h1 className="mt-2 text-2xl font-bold text-ink">Online {data.industry} shops in Pakistan</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        {data.shops.length} verified {data.industry.toLowerCase()} seller{data.shops.length > 1 ? "s" : ""} — every
        shop checked by StoreLink. Cash on Delivery and tracked parcels on every order.
      </p>
      {cities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {cities.map((c) => (
            <Link key={c} href={`/bazaar/${catSlug(data.industry)}/${citySlug(c)}`} className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-primary">
              In {c}
            </Link>
          ))}
        </div>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.shops.map((s) => (
          <Link key={s.id} href={`/${s.slug}`} className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-primary hover:shadow-sm">
            <p className="text-sm font-semibold text-ink group-hover:text-primary">{s.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted">{s.tagline || "Online shop"}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
              {s.featured && <span className="rounded-full bg-[#FBF3DC] px-2 py-0.5 font-medium text-[#8a6d1f]">⭐ Featured</span>}
              <span className="rounded-full bg-[#E7F2EC] px-2 py-0.5 font-medium text-[#2C6B57]">Verified ✓</span>
              {s.address && <span className="truncate rounded-full bg-[#f1f4f2] px-2 py-0.5 text-muted">📍 {s.address}</span>}
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-muted">
        Sell {data.industry.toLowerCase()}? <Link href="/signup" className="font-medium text-primary hover:underline">Open your shop free</Link> — get verified and be listed here.
      </p>
    </div>
  );
}
