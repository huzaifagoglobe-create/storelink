"use client";

import { useState } from "react";

interface BroadcastCustomer {
  name: string;
  phone: string;
}

/**
 * "Message all customers" tool. WhatsApp has no true bulk-send API for free
 * wa.me links, so this opens each customer's chat one at a time with the
 * message pre-filled — the seller taps send, then "Next". Simple, free, and
 * uses the personal touch that WhatsApp selling is built on.
 */
export function BroadcastTool({ customers, shopName }: { customers: BroadcastCustomer[]; shopName: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<Set<string>>(new Set());

  const withPhone = customers.filter((c) => c.phone);
  const remaining = withPhone.filter((c) => !sent.has(c.phone));

  function openChat(phone: string) {
    const text = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
    setSent((prev) => new Set(prev).add(phone));
  }

  if (withPhone.length === 0) return null;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      {!open ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">Message your customers</p>
            <p className="text-xs text-muted">
              Send a WhatsApp update to all {withPhone.length} customers — new stock, a sale, or a thank-you.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl bg-whatsapp px-4 py-2 text-sm font-medium text-whatsapp-foreground"
          >
            Start broadcast
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-ink">Your message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={600}
              placeholder={`Hi! New arrivals just dropped at ${shopName}. Check them out 👇`}
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
            <p className="mt-1 text-xs text-muted">
              Tip: keep it short and friendly. You&apos;ll tap send for each customer (WhatsApp doesn&apos;t allow true
              bulk-send).
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-muted">
            <span>
              {sent.size} sent · {remaining.length} left
            </span>
            <button onClick={() => setSent(new Set())} className="underline hover:text-ink">
              Reset
            </button>
          </div>

          <div className="max-h-56 space-y-1.5 overflow-y-auto">
            {withPhone.map((c) => {
              const done = sent.has(c.phone);
              return (
                <div key={c.phone} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{c.name}</p>
                    <p className="text-xs text-muted">{c.phone}</p>
                  </div>
                  <button
                    onClick={() => openChat(c.phone)}
                    disabled={!message.trim()}
                    className={
                      done
                        ? "rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted"
                        : "rounded-lg bg-whatsapp px-3 py-1.5 text-xs font-medium text-whatsapp-foreground disabled:opacity-40"
                    }
                  >
                    {done ? "Sent ✓ — resend" : "Send"}
                  </button>
                </div>
              );
            })}
          </div>

          <button onClick={() => setOpen(false)} className="text-xs text-muted underline hover:text-ink">
            Close
          </button>
        </div>
      )}
    </div>
  );
}
