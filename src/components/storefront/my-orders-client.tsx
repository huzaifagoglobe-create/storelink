"use client";

import { useState } from "react";

interface Row {
  id: string;
  shop: string;
  status: string;
  total: number;
  createdAt: string;
  trackUrl: string;
}

const STATUS_STYLE: Record<string, string> = {
  new: "bg-[#FBF7EC] text-[#8a6d1f]",
  confirmed: "bg-[#EAF1FB] text-[#1f4f86]",
  shipped: "bg-[#EAF1FB] text-[#1f4f86]",
  delivered: "bg-[#E7F2EC] text-[#2C6B57]",
  cancelled: "bg-[#FBECEA] text-[#C0362C]",
};

export function MyOrdersClient() {
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function lookup() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/my-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, orderNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not find your orders.");
      setRows(data.orders as Row[]);
    } catch (e) {
      setRows(null);
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5">
      <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <div>
          <label className="text-xs text-muted">Your phone number (the one you order with)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="03XX XXXXXXX"
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs text-muted">Any ONE of your order numbers (from your confirmation)</label>
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. 1054"
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
          />
          <p className="mt-1 text-[11px] text-muted">We ask for this so only YOU can see your orders — a phone number alone isn&apos;t enough.</p>
        </div>
        <button
          onClick={lookup}
          disabled={busy}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Looking…" : "Show my orders"}
        </button>
        {err && <p className="text-xs text-[#C0362C]">{err}</p>}
      </div>

      {rows && (
        <div className="mt-4 space-y-2">
          {rows.length === 0 && <p className="text-center text-sm text-muted">No orders in the last 90 days.</p>}
          {rows.map((r) => (
            <a
              key={r.id}
              href={r.trackUrl}
              className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-primary"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{r.shop}</p>
                <p className="text-xs text-muted">
                  Order #{r.id} · {new Date(r.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })} · Rs{" "}
                  {r.total.toLocaleString()}
                </p>
              </div>
              <span className={"flex-none rounded-full px-2.5 py-1 text-xs font-medium " + (STATUS_STYLE[r.status] ?? "bg-[#f1f4f2] text-muted")}>
                {r.status}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
