import Link from "next/link";
import type { Metadata } from "next";
import { listAllShops } from "@/server/services/shop-service";
import { bazaarLandingPages } from "@/lib/bazaar-seo";

export const metadata: Metadata = {
  title: "StoreLink Bazaar — shop from verified Pakistani sellers",
  description:
    "Browse verified online shops across Pakistan — clothing, jewellery, cosmetics, tech and more. Cash on Delivery, tracked delivery, real sellers.",
};

export const revalidate = 600; // refresh the directory every 10 minutes

/**
 * The Bazaar: a public directory of every VERIFIED shop on StoreLink. Sellers
 * keep their own store and customers — the Bazaar just sends them free buyers.
 * This is what turns StoreLink from a tool into a traffic source.
 */
export default async function BazaarPage({ searchParams: _sp }: { searchParams: Promise<{ q?: string; cat?: string }> }) {
  const sp = await _sp;
  const q = (sp.q ?? "").toLowerCase().trim();
  const cat = (sp.cat ?? "").toLowerCase().trim();

  const shops = (await listAllShops())
    .filter((s) => s.isActive && s.verificationStatus === "verified")
    .sort((a, b) => Number(b.featured) - Number(a.featured));
  const industries = [...new Set(shops.map((s) => s.industry).filter(Boolean))] as string[];

  const visible = shops.filter((s) => {
    const hay = `${s.name} ${s.tagline ?? ""} ${s.industry ?? ""} ${s.address ?? ""}`.toLowerCase();
    if (q && !hay.includes(q)) return false;
    if (cat && (s.industry ?? "").toLowerCase() !== cat) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">StoreLink Bazaar</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
          Real, verified Pakistani sellers — every shop checked by us. Cash on Delivery and tracked parcels on every
          order.
        </p>
      </div>

      <form className="mx-auto mt-6 flex max-w-md gap-2">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search shops — e.g. lawn, jewellery, Karachi"
          className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
        />
        <button type="submit" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
          Search
        </button>
      </form>

      {industries.length > 1 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link
            href="/bazaar"
            className={
              "rounded-full px-3 py-1.5 text-xs font-medium " +
              (!cat ? "bg-primary text-primary-foreground" : "border border-line text-ink hover:border-primary")
            }
          >
            All
          </Link>
          {industries.map((ind) => (
            <Link
              key={ind}
              href={`/bazaar?cat=${encodeURIComponent(ind.toLowerCase())}`}
              className={
                "rounded-full px-3 py-1.5 text-xs font-medium " +
                (cat === ind.toLowerCase()
                  ? "bg-primary text-primary-foreground"
                  : "border border-line text-ink hover:border-primary")
              }
            >
              {ind}
            </Link>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted">No shops match that search yet — try something broader.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((s) => (
            <Link
              key={s.id}
              href={`/${s.slug}`}
              className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-primary hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                {s.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- seller logo, sized at upload
                  <img src={s.logoUrl} alt="" className="h-12 w-12 rounded-full border border-line object-contain" />
                ) : (
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-base font-semibold text-white"
                    style={{ backgroundColor: s.themeColor ?? "#43705F" }}
                  >
                    {(s.logoText ?? s.name.slice(0, 2)).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink group-hover:text-primary">{s.name}</p>
                  <p className="truncate text-xs text-muted">{s.tagline || s.industry || "Online shop"}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                {s.featured && <span className="rounded-full bg-[#FBF3DC] px-2 py-0.5 font-medium text-[#8a6d1f]">⭐ Featured</span>}
                <span className="rounded-full bg-[#E7F2EC] px-2 py-0.5 font-medium text-[#2C6B57]">Verified ✓</span>
                {s.industry && <span className="rounded-full bg-[#f1f4f2] px-2 py-0.5 text-muted">{s.industry}</span>}
                {s.address && <span className="truncate rounded-full bg-[#f1f4f2] px-2 py-0.5 text-muted">📍 {s.address}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {bazaarLandingPages(shops).length > 0 && (
        <div className="mt-10 rounded-2xl border border-line bg-surface p-5">
          <p className="mb-2 text-sm font-semibold text-ink">Browse by category &amp; city</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
            {bazaarLandingPages(shops).map((pg) => (
              <Link key={pg.href} href={pg.href} className="text-muted hover:text-primary">
                {pg.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="mt-10 text-center text-xs text-muted">
        Have a shop?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Open your store on StoreLink
        </Link>{" "}
        — get verified and you&apos;re listed here for free.
      </p>
    </div>
  );
}
