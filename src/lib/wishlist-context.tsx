"use client";

// Client-side wishlist, scoped to one shop and saved in localStorage so it
// survives refreshes. Provided per-shop in src/app/[slug]/layout.tsx alongside
// the cart. No login needed — it lives on the buyer's own device.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image: string | null;
  slug: string; // shop slug, so links work from the wishlist page
}

interface WishlistContextValue {
  ready: boolean;
  items: WishlistItem[];
  count: number;
  has: (productId: string) => boolean;
  toggle: (item: WishlistItem) => void;
  remove: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const storageKey = (slug: string) => `wsb-wishlist:${slug}`;

export function WishlistProvider({ shopSlug, children }: { shopSlug: string; children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(shopSlug));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.items)) setItems(parsed.items);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [shopSlug]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey(shopSlug), JSON.stringify({ items }));
    } catch {
      /* ignore */
    }
  }, [items, ready, shopSlug]);

  function has(productId: string) {
    return items.some((i) => i.productId === productId);
  }

  function toggle(item: WishlistItem) {
    setItems((prev) =>
      prev.some((i) => i.productId === item.productId)
        ? prev.filter((i) => i.productId !== item.productId)
        : [item, ...prev]
    );
  }

  function remove(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  return (
    <WishlistContext.Provider value={{ ready, items, count: items.length, has, toggle, remove }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
