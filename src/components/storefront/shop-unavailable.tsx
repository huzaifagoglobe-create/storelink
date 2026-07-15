import type { Shop } from "@/server/types";

/** Friendly stand-in shown when a shop is paused/pending under the billing gate.
 *  Deliberately NOT a 404 — the link stays valid and the shop returns instantly
 *  once payment is recorded. */
export function ShopUnavailable({ shop, paused }: { shop: Shop; paused: boolean }) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-background px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold uppercase text-primary-foreground">
        {shop.name.slice(0, 1)}
      </span>
      <h1 className="mt-5 text-xl font-semibold text-ink">{shop.name}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        {paused
          ? "This shop is temporarily closed. Please check back soon."
          : "This shop is coming soon. Please check back shortly."}
      </p>
    </div>
  );
}
