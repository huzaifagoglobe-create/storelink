import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopBySlug } from "@/server/services/shop-service";
import { searchActiveProducts } from "@/server/services/product-service";
import { listReviewsForShop, summarizeByProduct } from "@/server/services/review-service";
import { getTemplate } from "@/server/storefront-templates";
import { ProductCard } from "@/components/storefront/product-card";

export async function generateMetadata({ params: _p }: { params: Promise<{ slug: string }> }) {
  const params = await _p;
  const shop = await getShopBySlug(params.slug);
  return { title: shop ? `Search · ${shop.name}` : "Search" };
}

export default async function SearchPage({
  params: _p,
  searchParams: _sp,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await _p;
  const searchParams = await _sp;
  const shop = await getShopBySlug(params.slug);
  if (!shop) notFound();
  const q = (searchParams.q ?? "").toString().trim();
  const [results, reviews] = await Promise.all([
    q ? searchActiveProducts(shop.id, q) : Promise.resolve([]),
    listReviewsForShop(shop.id),
  ]);
  const ratings = summarizeByProduct(reviews);
  const config = getTemplate(shop.template);

  return (
    <div className="space-y-4">
      <form action={`/${shop.slug}/search`} className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search products…"
          className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm"
          autoFocus
        />
        <button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">Search</button>
      </form>

      {q && (
        <p className="text-sm text-muted">
          {results.length} result{results.length === 1 ? "" : "s"} for “{q}”
        </p>
      )}

      {q && results.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
          No products found. Try a different word.
          <div className="mt-3">
            <Link href={`/${shop.slug}`} className="text-primary">Browse all products</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} shop={shop} product={p} rating={ratings.get(p.id)} config={config} />
          ))}
        </div>
      )}
    </div>
  );
}
