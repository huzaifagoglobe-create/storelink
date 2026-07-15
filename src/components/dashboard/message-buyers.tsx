"use client";

import { useState } from "react";

type Buyer = { name: string; phone: string };
type Template = "restock" | "review" | "repeat";

/**
 * Lets a seller message everyone who bought a specific product — restock alert,
 * review request, or a repeat-order nudge. Opens WhatsApp per buyer with a
 * pre-filled message (WhatsApp has no bulk API for personal accounts, so we
 * queue individual chats, which also keeps it personal and avoids spam flags).
 */
export function MessageBuyers({
  buyers,
  productName,
  shopName,
  shopSlug,
}: {
  buyers: Buyer[];
  productName: string;
  shopName: string;
  shopSlug: string;
}) {
  const [template, setTemplate] = useState<Template>("restock");
  const [sent, setSent] = useState<Record<string, boolean>>({});

  if (buyers.length === 0) {
    return (
      <p className="text-xs text-muted">
        No one has bought this product yet. Once you have buyers, you can message them here about restocks, reviews, or repeat orders.
      </p>
    );
  }

  const link = typeof window !== "undefined" ? `${window.location.origin}/${shopSlug}` : `/${shopSlug}`;

  const message = (name: string): string => {
    const hi = `Assalam o Alaikum${name && name !== "Customer" ? " " + name : ""}! 👋`;
    if (template === "restock")
      return `${hi}\n\nGood news — *${productName}* is back in stock at ${shopName}! Order again here before it runs out: ${link}`;
    if (template === "review")
      return `${hi}\n\nThank you for ordering *${productName}* from ${shopName}. How did you like it? A quick review really helps us — and you can shop again here: ${link}`;
    return `${hi}\n\nHope you loved your *${productName}* from ${shopName}! We&apos;ve got new stock and fresh designs — take a look: ${link}`;
  };

  const waLink = (b: Buyer) => `https://wa.me/${b.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message(b.name))}`;

  const templates: { id: Template; label: string }[] = [
    { id: "restock", label: "Back in stock" },
    { id: "review", label: "Ask for review" },
    { id: "repeat", label: "Repeat order" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTemplate(t.id)}
            className={
              "rounded-lg px-3 py-1.5 text-xs font-medium transition " +
              (template === t.id ? "bg-primary text-primary-foreground" : "border border-line text-ink hover:border-primary")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="rounded-xl bg-[#f3f5f2] p-3 text-xs text-muted whitespace-pre-line">{message("").trim()}</p>

      <p className="text-xs text-muted">{buyers.length} buyer{buyers.length > 1 ? "s" : ""} · tap each to open WhatsApp with the message ready:</p>

      <div className="max-h-60 space-y-1.5 overflow-y-auto">
        {buyers.map((b) => (
          <div key={b.phone} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">{b.name || "Customer"}</p>
              <p className="text-xs text-muted">{b.phone}</p>
            </div>
            <a
              href={waLink(b)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setSent((s) => ({ ...s, [b.phone]: true }))}
              className={
                "flex-none rounded-lg px-3 py-1.5 text-xs font-medium " +
                (sent[b.phone] ? "bg-[#eef3f0] text-muted" : "bg-whatsapp text-whatsapp-foreground")
              }
            >
              {sent[b.phone] ? "Opened ✓" : "Message"}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
