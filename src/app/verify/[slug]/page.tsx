import Link from "next/link";
import type { Metadata } from "next";
import { getShopBySlug } from "@/server/services/shop-service";

export async function generateMetadata({ params: _p }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await _p;
  const shop = await getShopBySlug(slug);
  if (!shop) return {};
  return {
    title: `Is ${shop.name} legit? — StoreLink verification`,
    description: `Check the verification status of ${shop.name} on StoreLink.`,
  };
}

/** Public verify page: sellers send this to doubtful buyers. Every doubtful
 *  buyer who checks it also learns StoreLink exists. */
export default async function VerifyPage({ params: _p }: { params: Promise<{ slug: string }> }) {
  const { slug } = await _p;
  const shop = await getShopBySlug(slug);
  const verified = !!shop && shop.isActive && shop.verificationStatus === "verified";
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      {verified ? (
        <>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E7F2EC] text-4xl">✓</div>
          <h1 className="mt-4 text-2xl font-bold text-ink">{shop.name} is verified</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            This seller&apos;s identity was checked and approved by StoreLink. Orders come with tracked delivery and a
            written return policy.
          </p>
          <Link href={`/${shop.slug}`} className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
            Visit {shop.name} →
          </Link>
        </>
      ) : (
        <>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FBF7EC] text-4xl">?</div>
          <h1 className="mt-4 text-2xl font-bold text-ink">Not verified (yet)</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            {shop
              ? `${shop.name} exists on StoreLink but hasn't completed verification. That doesn't mean it's fake — just that we haven't checked its documents yet.`
              : "We couldn't find a shop at this address."}
          </p>
        </>
      )}
      <p className="mt-10 text-xs text-muted">
        Verification by <Link href="/?src=verify" className="font-medium text-primary hover:underline">StoreLink</Link> — Pakistan&apos;s
        shop platform. <Link href="/bazaar" className="text-primary hover:underline">Browse all verified shops →</Link>
      </p>
    </div>
  );
}
