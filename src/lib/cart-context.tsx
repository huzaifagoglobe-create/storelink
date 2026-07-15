"use client";

// Client-side cart, scoped to one shop and saved in localStorage so it
// survives refreshes. Provided per-shop in src/app/[slug]/layout.tsx.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string | null;
  variant: string | null;
  quantity: number;
}

interface CartContextValue {
  shopSlug: string;
  ready: boolean; // true once localStorage has been read
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = (slug: string) => `wsb-cart:${slug}`;

export function cartLineKey(productId: string, variant: string | null | undefined): string {
  return `${productId}::${variant ?? ""}`;
}

export function CartProvider({
  shopSlug,
  children,
}: {
  shopSlug: string;
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(shopSlug));
      if (raw) {
        const parsed = JSON.parse(raw) as { shopSlug: string; items: CartItem[] };
        if (parsed.shopSlug === shopSlug && Array.isArray(parsed.items)) {
          setItems(parsed.items);
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, [shopSlug]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey(shopSlug), JSON.stringify({ shopSlug, items }));
    } catch {
      /* ignore quota errors */
    }
  }, [items, ready, shopSlug]);

  const add: CartContextValue["add"] = (item, quantity = 1) => {
    const key = cartLineKey(item.productId, item.variant);
    setItems((prev) => {
      const existing = prev.find((i) => cartLineKey(i.productId, i.variant) === key);
      if (existing) {
        return prev.map((i) =>
          cartLineKey(i.productId, i.variant) === key ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const setQuantity: CartContextValue["setQuantity"] = (key, quantity) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => cartLineKey(i.productId, i.variant) !== key)
        : prev.map((i) => (cartLineKey(i.productId, i.variant) === key ? { ...i, quantity } : i))
    );
  };

  const remove: CartContextValue["remove"] = (key) =>
    setItems((prev) => prev.filter((i) => cartLineKey(i.productId, i.variant) !== key));

  const clear = () => setItems([]);

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ shopSlug, ready, items, count, subtotal, add, setQuantity, remove, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>.");
  return ctx;
}
