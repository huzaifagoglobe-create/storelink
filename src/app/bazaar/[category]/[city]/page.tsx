import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { listAllShops } from "@/server/services/shop-service";
import { shopsInCategoryCity } from "@/lib/bazaar-seo";

export const revalidate = 3600;

async function load(categorySlug: string, city: string) {
  const all = (await listAllShops())
    .filter((s) => s.isActive && s.verificationStatus === "verified")
    .sort((a, b) => Number(b.featured) - Number(a.featured));
  return shopsInCategoryCity(all, categorySlug, city);
}

export async function generateMetadata({ params: _p }: { params: Promise<{ category: string; city: string }> }): Promise<Metadata> {
  const { category, city } = await _p;
  const data = await load(category, city);
  if (!data) return {};
  return {
    title: `Online ${data.industry} shops in ${data.city} — Cash on Delivery | StoreLink Bazaar`,
    description: `${data.shops.length} verified online ${data.industry.toLowerCase()} shop${data.shops.length > 1 ? "s" : ""} in ${data.city}. Real local sellers, Cash on Delivery, tracked delivery.`,
  };
}

export default async function BazaarCityPage({ params: _p }: { params: Promise<{ category: string; city: string }> }) {
  const { category, city } = await _p;
  const data = await load(category, city);
  if (!data) notFound();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav className="text-xs text-muted">
        <Link href="/bazaar" className="hover:text-primary">Bazaar</Link> /{" "}
        <Link href={`/bazaar/${category}`} className="hover:text-primary">{data.industry}</Link> / {data.city}
      </nav>
      <h1 className="mt-2 text-2xl font-bold text-ink">Online {data.industry} shops in {data.city}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        {data.shops.length} verified {data.industry.toLowerCase()} seller{data.shops.length > 1 ? "s" : ""} based in{" "}
        {data.city} — Cash on Delivery all over Pakistan.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.shops.map((s) => (
          <Link key={s.id} href={`/${s.slug}`} className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-primary hover:shadow-sm">
            <p className="text-sm font-semibold text-ink group-hover:text-primary">{s.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted">{s.tagline || "Online shop"}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
              {s.featured && <span className="rounded-full bg-[#FBF3DC] px-2 py-0.5 font-medium text-[#8a6d1f]">⭐ Featured</span>}
              <span className="rounded-full bg-[#E7F2EC] px-2 py-0.5 font-medium text-[#2C6B57]">Verified ✓</span>
              <span className="rounded-full bg-[#f1f4f2] px-2 py-0.5 text-muted">📍 {data.city}</span>
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-muted">
        Sell in {data.city}? <Link href="/signup" className="font-medium text-primary hover:underline">Open your shop free</Link>.
      </p>
    </div>
  );
}
