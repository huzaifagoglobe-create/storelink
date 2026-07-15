"use client";

import { useState } from "react";

/**
 * Shown on a DELIVERED order's tracking page when the shop runs a referral
 * program: the buyer gets a personal link — their friend gets Rs off, and the
 * buyer earns Rs off their own next order. Word of mouth, made tappable.
 */
export function ReferralCard({
  shopName,
  shopSlug,
  token,
  amount,
}: {
  shopName: string;
  shopSlug: string;
  token: string;
  amount: number;
}) {
  const [copied, setCopied] = useState(false);
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/${shopSlug}?ref=${token}`;
  const message = `I ordered from ${shopName} and loved it! 💚 Use my link and get Rs ${amount} off your first order: ${link}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="rounded-2xl border-2 border-primary/40 bg-[#F3F8F5] p-4">
      <p className="text-sm font-semibold text-ink">💚 Loved it? Share &amp; you BOTH save</p>
      <p className="mt-1 text-xs text-muted">
        Send your personal link to friends. They get <b>Rs {amount} off</b> their first order here — and you get{" "}
        <b>Rs {amount} off</b> your next one, automatically, once their order is delivered.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-xl bg-whatsapp px-4 py-2.5 text-center text-sm font-medium text-whatsapp-foreground"
        >
          💬 Share on WhatsApp
        </a>
        <button
          type="button"
          onClick={copy}
          className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:border-primary"
        >
          {copied ? "Copied ✓" : "Copy my link"}
        </button>
      </div>
    </div>
  );
}
