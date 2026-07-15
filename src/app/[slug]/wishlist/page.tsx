"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/wishlist-context";
import { useClientLang } from "@/lib/use-lang";
import { tr } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { ImagePlaceholder } from "@/components/storefront/image-placeholder";

export default function WishlistPage() {
  const { ready, items, remove } = useWishlist();
  const lang = useClientLang();

  return (
    <div className="space-y-4 py-2">
      <h1 className="text-lg font-semibold text-ink">{tr(lang, "wishlist")}</h1>

      {!ready ? null : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
          <p className="text-sm font-medium text-ink">{tr(lang, "wishlistEmpty")}</p>
          <p className="mt-1 text-xs text-muted">{tr(lang, "wishlistEmptyHint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.productId} className="group relative overflow-hidden rounded-2xl border border-line bg-surface">
              <button
                onClick={() => remove(it.productId)}
                aria-label="Remove"
                className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
              <Link href={`/${it.slug}/product/${it.productId}`} className="block">
                <div className="aspect-square w-full">
                  {it.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img loading="lazy" decoding="async" src={it.image} alt={it.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlaceholder className="h-full w-full" />
                  )}
                </div>
                <div className="space-y-0.5 p-3">
                  <p className="line-clamp-2 text-sm font-medium text-ink">{it.name}</p>
                  <p className="text-sm font-medium text-ink">{formatCurrency(it.price)}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
