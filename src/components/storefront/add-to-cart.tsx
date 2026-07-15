"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart, cartLineKey } from "@/lib/cart-context";
import type { ProductOption } from "@/server/types";

export function AddToCart({
  shopSlug,
  product,
  options = [],
  variantStock = null,
  shapeClass = "rounded-xl",
  priceLabel,
}: {
  shopSlug: string;
  product: { id: string; name: string; price: number; image: string | null; inStock: boolean };
  options?: ProductOption[];
  variantStock?: Record<string, number> | null;
  /** Template-driven button shape (rounded-xl / rounded-full / rounded-none). */
  shapeClass?: string;
  /** Formatted price text for the sticky mobile order bar (e.g. "Rs 3,375"). */
  priceLabel?: string;
}) {
  const { add, items } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});

  if (!product.inStock) {
    return (
      <Button variant="outline" disabled className="w-full">
        Out of stock
      </Button>
    );
  }

  const allChosen = options.every((o) => selected[o.name]);
  // A value is unavailable when the seller tracks per-option stock and every
  // combination containing that value is at 0 (single-option case = direct).
  const hasVariantStock = !!variantStock && Object.keys(variantStock).length > 0;
  function valueAvailable(optName: string, value: string): boolean {
    if (!hasVariantStock) return true;
    const token = `${optName}: ${value}`;
    const keys = Object.keys(variantStock as Record<string, number>).filter(
      (k) => k === token || k.includes(token + " /") || k.includes("/ " + token) || k.split(" / ").includes(token)
    );
    if (keys.length === 0) return true; // seller didn't fill this one in — don't block
    return keys.some((k) => ((variantStock as Record<string, number>)[k] ?? 0) > 0);
  }
  function valueLeftSingle(optName: string, value: string): number | null {
    if (!hasVariantStock || options.length !== 1) return null;
    const n = (variantStock as Record<string, number>)[`${optName}: ${value}`];
    return typeof n === "number" ? n : null;
  }
  const variant = options.length
    ? options.map((o) => `${o.name}: ${selected[o.name]}`).join(" / ")
    : null;
  const variantLeft =
    allChosen && variant && variantStock && variant in variantStock ? variantStock[variant] : null;
  const variantSoldOut = variantLeft !== null && variantLeft <= 0;
  const item = {
    productId: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    variant,
  };
  const inCart = items.some(
    (i) => cartLineKey(i.productId, i.variant) === cartLineKey(product.id, variant)
  );
  const blocked = (options.length > 0 && !allChosen) || variantSoldOut;

  function handleAdd() {
    if (blocked) return;
    add(item, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }
  function handleBuyNow() {
    if (blocked) return;
    if (!inCart) add(item, qty);
    router.push(`/${shopSlug}/cart`);
  }

  return (
    <div className="space-y-3">
      {options.map((o) => (
        <div key={o.name}>
          <p className="mb-1 text-sm text-muted">{o.name}</p>
          <div className="flex flex-wrap gap-2">
            {o.values.map((v) => {
              const avail = valueAvailable(o.name, v);
              const left = valueLeftSingle(o.name, v);
              return (
                <button
                  key={v}
                  type="button"
                  disabled={!avail}
                  onClick={() => avail && setSelected((s) => ({ ...s, [o.name]: v }))}
                  className={
                    "rounded-lg border px-3 py-1.5 text-sm transition " +
                    (!avail
                      ? "cursor-not-allowed border-line bg-[#f3f4f3] text-muted line-through opacity-70"
                      : selected[o.name] === v
                        ? "border-primary bg-[#EAF3EE] text-primary"
                        : "border-line text-ink hover:border-primary")
                  }
                >
                  {v}
                  {!avail ? <span className="ml-1 text-[10px] no-underline">(out)</span> : null}
                  {avail && left !== null && left > 0 && left < 10 ? (
                    <span className="ml-1 text-[10px] font-semibold text-[#B5651D]">· {left} left</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">Quantity</span>
        <div className="inline-flex items-center rounded-xl border border-line">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-3 py-1.5 text-lg leading-none text-ink disabled:opacity-40"
            aria-label="Decrease quantity"
            disabled={qty <= 1}
          >
            −
          </button>
          <span className="min-w-[2.5rem] text-center text-sm font-medium tabular-nums">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(variantLeft != null ? Math.max(1, variantLeft) : 99, q + 1))}
            className="px-3 py-1.5 text-lg leading-none text-ink"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className={"flex-1 " + shapeClass} onClick={handleAdd} disabled={blocked}>
          {added ? "Added ✓" : inCart ? "Add more" : "🛒 Add to cart"}
        </Button>
        <Button className={"flex-1 " + shapeClass} onClick={handleBuyNow} disabled={blocked}>
          {inCart ? "Go to cart →" : "Order Now — Cash on Delivery"}
        </Button>
      </div>

      {/* Sticky order bar on mobile — the CTA is always one thumb-tap away. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          {priceLabel && (
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-wide text-muted">Price</p>
              <p className="text-base font-bold text-ink">{priceLabel}</p>
            </div>
          )}
          <Button className={"flex-1 " + shapeClass} onClick={handleBuyNow} disabled={blocked}>
            {blocked && options.length > 0 && !allChosen
              ? "Choose options above"
              : inCart
                ? "Go to cart →"
                : "Order Now — Cash on Delivery"}
          </Button>
        </div>
      </div>
      <div className="h-16 lg:hidden" aria-hidden />

      {variantSoldOut ? (
        <p className="text-xs text-[#C0362C]">This option is sold out. Please choose another.</p>
      ) : variantLeft !== null && variantLeft <= 5 ? (
        <p className="text-xs text-muted">Only {variantLeft} left in this option.</p>
      ) : options.length > 0 && !allChosen ? (
        <p className="text-xs text-muted">
          Please choose {options.map((o) => o.name.toLowerCase()).join(" and ")}.
        </p>
      ) : null}
    </div>
  );
}
