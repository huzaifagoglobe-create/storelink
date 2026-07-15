"use client";

import { useCart } from "@/lib/cart-context";

export function CartCount() {
  const { count } = useCart();
  if (count <= 0) return null;
  return (
    <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
      {count}
    </span>
  );
}
