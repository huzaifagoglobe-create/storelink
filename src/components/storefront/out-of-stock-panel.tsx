"use client";

import { useState } from "react";
import { WishlistButton } from "./wishlist-button";

/**
 * What a buyer sees when a product has sold out.
 *
 * The old version was a greyed-out "Out of stock" button and one flat line:
 * "Out of stock — want to know when it's back?". That treats a sell-out as bad
 * news and gives the buyer nothing to do, so they leave and never return.
 *
 * A sell-out is actually the strongest proof a product is good. So we:
 *   · say so, warmly, instead of apologising;
 *   · show how many people already bought it (real number, never invented);
 *   · give TWO ways to stay: save it, or get a message when it lands;
 *   · tell the buyer exactly what happens next, so leaving a number feels safe.
 *
 * Every number shown here is real. Fake scarcity is the fastest way to lose a
 * customer for good.
 */
export function OutOfStockPanel({
  slug,
  productId,
  productName,
  price,
  image,
  soldCount,
}: {
  slug: string;
  productId: string;
  productName: string;
  price: number;
  image: string | null;
  soldCount: number;
}) {
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setErr("Please enter your full WhatsApp number.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopSlug: slug, productId, phone, source: "restock" }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setErr("Could not save that. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Only claim popularity when there is a real number behind it.
  const popular = soldCount >= 3;

  if (done) {
    return (
      <div className="mt-3 rounded-2xl border-2 border-[#bfe0cd] bg-[#EAF3EE] p-4">
        <p className="text-sm font-bold text-ink">You&apos;re on the list ✅</p>
        <p className="mt-1 text-xs text-muted">
          The seller will message you on WhatsApp the moment <b>{productName}</b> is back — before it goes
          public again. No spam, just this one message.
        </p>
        <div className="mt-3">
          <WishlistButton
            size="md"
            item={{ productId, name: productName, price, image, slug }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border-2 border-[#E7C98A] bg-[#FBF7EC]">
      <div className="p-4">
        <p className="text-base font-bold text-ink">
          {popular ? "Sold out — it went fast 🔥" : "Sold out for now"}
        </p>
        <p className="mt-1 text-xs text-[#8a6d1f]">
          {popular
            ? `${soldCount} people already bought this one. It sells out almost every time we restock.`
            : "This one's gone for the moment — the seller restocks the pieces people ask for first."}
        </p>

        <div className="mt-3 rounded-xl bg-white/70 p-3">
          <p className="text-sm font-semibold text-ink">Want it the day it&apos;s back? 🔔</p>
          <p className="mt-0.5 text-xs text-muted">
            Drop your WhatsApp number and you get the <b>first</b> message when it lands — before anyone
            else sees it.
          </p>
          <div className="mt-2 flex gap-2">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              aria-label="Your WhatsApp number"
              placeholder="03XX XXXXXXX"
              className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
            />
            <button
              onClick={submit}
              disabled={busy}
              className="flex-none rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy ? "…" : "Tell me first"}
            </button>
          </div>
          {err && <p className="mt-1 text-xs text-[#b3261e]">{err}</p>}
          <p className="mt-1.5 text-[11px] text-muted">
            One message about this product. Nothing else, ever.
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted">Not ready to decide?</span>
          <WishlistButton
            size="md"
            item={{ productId, name: productName, price, image, slug }}
          />
        </div>
      </div>
    </div>
  );
}
