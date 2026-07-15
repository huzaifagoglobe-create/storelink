"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/wishlist-context";

// Heart icon in the shop header. Only shows once the buyer has saved something,
// so it stays out of the way for first-time visitors.
export function WishlistLink({ slug, label }: { slug: string; label: string }) {
  const { count, ready } = useWishlist();
  if (!ready || count <= 0) return null;
  return (
    <Link
      href={`/${slug}/wishlist`}
      aria-label={label}
      className="relative inline-flex items-center rounded-xl border border-line px-2.5 py-2 text-ink"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
      </svg>
      <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
        {count}
      </span>
    </Link>
  );
}
