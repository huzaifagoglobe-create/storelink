"use client";

import { useState } from "react";

/** Seller-refers-seller: their link, one tap to share. When the friend becomes
 *  a PAYING shop, this seller gets a month free (granted from admin). */
export function ReferSellerCard({ slug, shopName }: { slug: string; shopName: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${typeof window !== "undefined" ? window.location.origin : "https://storelink.pk"}/?rf=${slug}`;
  const msg = `I run my online shop "${shopName}" on StoreLink — COD orders, tracking, everything in one place. If you sell anything, try it (free to start): ${link}`;
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-sm font-semibold text-ink">🤝 Know another seller? Get a month FREE</p>
      <p className="mt-1 text-xs text-muted">
        Share your link. When your friend&apos;s shop becomes a paying member, we add a <b>free month</b> to YOUR plan.
        No limit — refer five friends, get five months.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(msg)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-xl bg-whatsapp px-4 py-2.5 text-center text-sm font-medium text-whatsapp-foreground"
        >
          💬 Share on WhatsApp
        </a>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* ignore */
            }
          }}
          className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:border-primary"
        >
          {copied ? "Copied ✓" : "Copy my link"}
        </button>
      </div>
    </div>
  );
}
