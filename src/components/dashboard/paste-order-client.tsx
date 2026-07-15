"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { createManualOrderAction, type ManualOrderState } from "@/server/actions/manual-order-actions";
import { Field, inputClass, FormError } from "./field";
import { SubmitButton } from "./submit-button";

const CITIES = [
  "Karachi","Lahore","Islamabad","Rawalpindi","Faisalabad","Multan","Peshawar","Hyderabad","Quetta","Sialkot","Gujranwala","Sargodha","Bahawalpur","Sukkur","Abbottabad","Mardan",
];

interface PickProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
}

/**
 * Paste the buyer's WhatsApp message → we read out the phone, city and address
 * automatically; the seller confirms, taps the products, done. Ten seconds
 * instead of retyping everything — and the order counts everywhere (analytics,
 * profit, trust history) like any website order.
 */
export function PasteOrderClient({ products }: { products: PickProduct[] }) {
  const [state, action] = useActionState<ManualOrderState, FormData>(createManualOrderAction, {});
  const [pasted, setPasted] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [readDone, setReadDone] = useState(false);

  function readMessage() {
    const text = pasted.trim();
    // Phone: 03XX-XXXXXXX / +923XXXXXXXXX / spaced variants.
    const pm = text.match(/(\+?92[\s-]?3\d{2}|0?3\d{2})[\s-]?\d{3}[\s-]?\d{4}/);
    if (pm) {
      let p = pm[0].replace(/[\s-]/g, "");
      if (p.startsWith("+92")) p = "0" + p.slice(3);
      else if (p.startsWith("92")) p = "0" + p.slice(2);
      else if (p.startsWith("3")) p = "0" + p;
      setPhone(p);
    }
    // City: first known city mentioned.
    const found = CITIES.find((c) => new RegExp(`\\b${c}\\b`, "i").test(text));
    if (found) setCity(found);
    // Address: the longest line that isn't just the phone number.
    const lines = text
      .split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 8 && !/^(\+?\d[\d\s-]{8,})$/.test(l));
    const addr = lines.sort((a, b) => b.length - a.length)[0];
    if (addr) setAddress(addr.slice(0, 200));
    setReadDone(true);
  }

  const chosen = Object.entries(qty).filter(([, q]) => q > 0);
  const itemsJson = JSON.stringify(chosen.map(([productId, quantity]) => ({ productId, quantity, variant: null })));
  const orderTotal = chosen.reduce((s, [id, q]) => {
    const p = products.find((x) => x.id === id);
    return s + (p ? p.price * q : 0);
  }, 0);

  if (state.ok && state.orderId) {
    return (
      <div className="rounded-2xl border border-[#bfe0cd] bg-[#EAF3EE] p-5 text-center">
        <p className="text-sm font-semibold text-ink">Order #{state.orderId} created ✓</p>
        <p className="mt-1 text-xs text-muted">Stock reserved, counted in your reports — just like a website order.</p>
        <div className="mt-3 flex justify-center gap-2">
          <Link href={`/dashboard/orders/${state.orderId}`} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Open the order
          </Link>
          <button type="button" onClick={() => window.location.reload()} className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-ink">
            Add another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />

      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-sm font-semibold text-ink">1 · Paste the WhatsApp message</p>
        <p className="mb-2 text-xs text-muted">Copy the buyer&apos;s message (with their address and number) and paste it here.</p>
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={4}
          className={inputClass}
          placeholder={"2 lawn suits size M\nHouse 12, Street 4, Johar Town, Lahore\n0300 1234567"}
        />
        <button
          type="button"
          onClick={readMessage}
          disabled={pasted.trim().length < 10}
          className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          ✨ Read the details for me
        </button>
        {readDone && <span className="ml-2 text-xs text-primary">Filled below — please double-check ✓</span>}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="mb-3 text-sm font-semibold text-ink">2 · Confirm the customer</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" htmlFor="mo-name">
            <input id="mo-name" name="customerName" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Customer's name" required />
          </Field>
          <Field label="Phone" htmlFor="mo-phone">
            <input id="mo-phone" name="customerPhone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className={inputClass} placeholder="03XX XXXXXXX" required />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address" htmlFor="mo-addr">
              <input id="mo-addr" name="address" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="Full delivery address" required />
            </Field>
          </div>
          <Field label="City" htmlFor="mo-city">
            <input id="mo-city" name="city" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="e.g. Lahore" />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="mb-1 text-sm font-semibold text-ink">3 · Tap the products they ordered</p>
        <p className="mb-3 text-xs text-muted">Use + / − to set how many of each.</p>
        <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f6f8f6] px-3 py-2">
              <span className="min-w-0 truncate text-sm text-ink">
                {p.name} <span className="text-xs text-muted">· Rs {p.price.toLocaleString()}</span>
              </span>
              <span className="flex flex-none items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQty((q) => ({ ...q, [p.id]: Math.max(0, (q[p.id] ?? 0) - 1) }))}
                  className="h-7 w-7 rounded-lg border border-line bg-white text-sm text-ink"
                  aria-label={`Less ${p.name}`}
                >
                  −
                </button>
                <span className="w-5 text-center text-sm font-semibold text-ink">{qty[p.id] ?? 0}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => ({ ...q, [p.id]: Math.min(20, (q[p.id] ?? 0) + 1) }))}
                  className="h-7 w-7 rounded-lg border border-line bg-white text-sm text-ink"
                  aria-label={`More ${p.name}`}
                >
                  +
                </button>
              </span>
            </li>
          ))}
        </ul>
        <input type="hidden" name="items" value={itemsJson} />
        {chosen.length > 0 && (
          <p className="mt-3 text-sm font-semibold text-ink">
            Order total (before delivery): Rs {orderTotal.toLocaleString()}
          </p>
        )}
      </div>

      <SubmitButton pendingText="Creating…">Create order (COD)</SubmitButton>
      <p className="text-[11px] text-muted">
        The buyer gets a tracking link like any website order; stock, profit and trust history all update automatically.
      </p>
    </form>
  );
}
