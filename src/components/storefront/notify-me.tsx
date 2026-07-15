"use client";

import { useState } from "react";

function isValidPhone(p: string) {
  return p.replace(/\D/g, "").length >= 10;
}

async function submitLead(payload: object): Promise<boolean> {
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return !!data.ok;
  } catch {
    return false;
  }
}

/** Out-of-stock capture: buyer leaves their number to hear when it's back. */
export function NotifyMe({ slug, productId }: { slug: string; productId: string }) {
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    if (!isValidPhone(phone)) {
      setErr("Enter a valid phone number.");
      return;
    }
    setErr(null);
    setBusy(true);
    const ok = await submitLead({ slug, phone, source: "notify", productId });
    setBusy(false);
    if (ok) setDone(true);
    else setErr("Could not save. Please try again.");
  }

  if (done) {
    return (
      <div className="mt-3 rounded-2xl border border-[#bfe0cd] bg-[#EAF3EE] p-3 text-sm text-ink">
        Done — we&apos;ll message you on WhatsApp when it&apos;s back in stock. 🎉
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-line bg-surface p-3">
      <p className="text-sm font-medium text-ink">Out of stock — want to know when it&apos;s back?</p>
      <p className="mb-2 text-xs text-muted">Leave your WhatsApp number and the seller will let you know.</p>
      <div className="flex gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="03XX XXXXXXX"
          className="flex-1 rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
        <button
          onClick={go}
          disabled={busy}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "…" : "Notify me"}
        </button>
      </div>
      {err && <p className="mt-1 text-xs text-[#b3261e]">{err}</p>}
    </div>
  );
}

/** Storefront newsletter opt-in: grow the seller's audience. */
export function NewsletterOptIn({ slug, shopName }: { slug: string; shopName: string }) {
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    if (!isValidPhone(phone)) {
      setErr("Enter a valid phone number.");
      return;
    }
    setErr(null);
    setBusy(true);
    const ok = await submitLead({ slug, phone, source: "newsletter" });
    setBusy(false);
    if (ok) setDone(true);
    else setErr("Could not save. Please try again.");
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[#bfe0cd] bg-[#EAF3EE] p-4 text-center text-sm text-ink">
        You&apos;re on the list — thanks for following {shopName}! 💚
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-sm font-medium text-ink">Get new arrivals & offers on WhatsApp</p>
      <p className="mb-2 text-xs text-muted">Be first to know when {shopName} drops new stock or a sale.</p>
      <div className="flex gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="03XX XXXXXXX"
          className="flex-1 rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
        <button
          onClick={go}
          disabled={busy}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "…" : "Follow"}
        </button>
      </div>
      {err && <p className="mt-1 text-xs text-[#b3261e]">{err}</p>}
    </div>
  );
}
