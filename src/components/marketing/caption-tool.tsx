"use client";

import { useState } from "react";
import Link from "next/link";

export function CaptionTool() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  const tags = [
    "#OnlineShoppingPakistan",
    "#CashOnDelivery",
    name ? "#" + name.split(/\s+/).slice(0, 2).join("").replace(/[^A-Za-z0-9]/g, "") : "",
    "#PakistanShopping",
    "#SmallBusinessPK",
  ].filter((t) => t.length > 2).join(" ");
  const caption = name
    ? `${name} ✨\n${price ? `Rs ${Number(price).toLocaleString()} — ` : ""}Cash on Delivery all over Pakistan 🚚\n${link ? `Order here 👉 ${link}` : "DM to order 📩"}\n\n${tags}`
    : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-line bg-surface p-5">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name — e.g. Lawn Suit 3pc" className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary" />
        <div className="grid grid-cols-2 gap-3">
          <input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Price (Rs)" className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary" />
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Your shop link (optional)" className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary" />
        </div>
      </div>
      {caption && (
        <div className="rounded-2xl border border-line bg-[#f7f9f7] p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">Your caption</p>
            <button onClick={copy} className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink">
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">{caption}</p>
        </div>
      )}
      <div className="rounded-2xl border border-line bg-surface p-5 text-center">
        <p className="text-sm font-semibold text-ink">Want captions written automatically for every product?</p>
        <p className="mt-1 text-xs text-muted">StoreLink makes a share image + caption for each product in one tap — plus a full shop with COD orders and tracking.</p>
        <Link href="/signup?src=caption-tool" className="mt-3 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">
          Start your shop free →
        </Link>
      </div>
    </div>
  );
}
