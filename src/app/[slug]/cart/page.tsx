"use client";

import Link from "next/link";
import { useCart, cartLineKey } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/storefront/image-placeholder";
import { useClientLang } from "@/lib/use-lang";
import { tr } from "@/lib/i18n";

export default function CartPage() {
  const { shopSlug: slug, ready, items, subtotal, setQuantity, remove } = useCart();
  const lang = useClientLang();

  if (!ready) {
    return <div className="py-16" aria-hidden />; // brief, avoids empty-cart flash
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        {/* Every page needs exactly one h1 — including the empty state, which is
            what a search engine (and a screen reader) lands on. */}
        <h1 className="text-lg font-semibold text-ink">{tr(lang, "yourCart")}</h1>
        <p className="mt-2 text-sm text-muted">{tr(lang, "cartEmpty")}</p>
        <Link
          href={`/${slug}`}
          className="mt-4 inline-flex rounded-xl border border-primary px-4 py-2.5 text-sm font-medium text-primary"
        >
          {tr(lang, "browseProducts")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-lg font-semibold text-ink">{tr(lang, "yourCart")}</h1>

      <div className="divide-y divide-line">
        {items.map((item) => {
          const key = cartLineKey(item.productId, item.variant);
          return (
          <div key={key} className="flex items-center gap-3 py-3">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt={item.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <ImagePlaceholder className="h-12 w-12 rounded-lg" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{item.name}</p>
              {item.variant && <p className="text-xs text-muted">{item.variant}</p>}
              <p className="text-sm text-ink">{formatCurrency(item.price)}</p>
              <button
                type="button"
                onClick={() => remove(key)}
                className="mt-0.5 text-xs text-muted underline"
              >
                {tr(lang, "remove")}
              </button>
            </div>
            <div className="inline-flex items-center rounded-xl border border-line">
              <button
                type="button"
                onClick={() => setQuantity(key, item.quantity - 1)}
                className="px-2.5 py-1 text-lg leading-none text-ink"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="min-w-[1.75rem] text-center text-sm">{item.quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(key, item.quantity + 1)}
                className="px-2.5 py-1 text-lg leading-none text-ink"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-line pt-3 text-sm">
        <span className="text-muted">{tr(lang, "subtotal")}</span>
        <span className="font-medium text-ink">{formatCurrency(subtotal)}</span>
      </div>
      <p className="text-xs text-muted">{tr(lang, "deliveryAtCheckout")}</p>

      <Link href={`/${slug}/checkout`} className="block">
        <Button className="w-full">{tr(lang, "checkout")}</Button>
      </Link>
    </div>
  );
}
