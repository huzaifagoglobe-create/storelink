"use client";

import { useWishlist, type WishlistItem } from "@/lib/wishlist-context";

/**
 * Heart button to save/unsave a product. Works on product cards and the
 * product page. Two sizes: "sm" (overlay on cards) and "md" (product page).
 */
export function WishlistButton({ item, size = "sm", label }: { item: WishlistItem; size?: "sm" | "md"; label?: string }) {
  const { has, toggle, ready } = useWishlist();
  const saved = ready && has(item.productId);

  if (size === "md") {
    return (
      <button
        type="button"
        onClick={() => toggle(item)}
        aria-pressed={saved}
        className={
          "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition " +
          (saved ? "border-primary bg-[#EAF3EE] text-primary" : "border-line bg-surface text-ink hover:border-primary")
        }
      >
        <Heart filled={saved} />
        {label ?? (saved ? "Saved" : "Save")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(item);
      }}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      className={
        "absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition " +
        (saved ? "bg-white text-primary shadow-sm" : "bg-white/80 text-ink hover:bg-white")
      }
    >
      <Heart filled={saved} />
    </button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}
