"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { updateOrderDetailsAction, type OrderEditState } from "@/server/actions/order-actions";
import { formatCurrency } from "@/lib/format";

interface Item { id: string; name: string; price: number; quantity: number; variant: string | null }
interface Props {
  orderNumber: string;
  currency: string;
  deliveryFee: number;
  discount: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string;
  city: string;
  items: Item[];
}

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

const input = "w-full rounded-lg border border-line px-3 py-2 text-sm";

export function OrderEditForm(p: Props) {
  const [state, action] = useActionState<OrderEditState, FormData>(updateOrderDetailsAction, {});
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(p.items.map((i) => [i.id, i.quantity]))
  );

  const subtotal = p.items.reduce((s, i) => s + i.price * (qty[i.id] ?? 0), 0);
  const discount = Math.max(0, Math.min(p.discount, subtotal));
  const total = subtotal + p.deliveryFee - discount;

  return (
    <details className="rounded-2xl border border-line bg-surface p-4 text-sm">
      <summary className="cursor-pointer font-medium text-ink">Edit order</summary>
      <form action={action} className="mt-3 space-y-3">
        <input type="hidden" name="orderNumber" value={p.orderNumber} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-1 block text-xs text-muted">Customer name</span>
            <input name="customerName" defaultValue={p.customerName} className={input} /></label>
          <label className="block"><span className="mb-1 block text-xs text-muted">Phone</span>
            <input name="customerPhone" defaultValue={p.customerPhone} className={input} /></label>
          <label className="block"><span className="mb-1 block text-xs text-muted">Email (optional)</span>
            <input name="customerEmail" defaultValue={p.customerEmail ?? ""} className={input} /></label>
          <label className="block"><span className="mb-1 block text-xs text-muted">City</span>
            <input name="city" defaultValue={p.city} className={input} /></label>
          <label className="block sm:col-span-2"><span className="mb-1 block text-xs text-muted">Address</span>
            <input name="address" defaultValue={p.address} className={input} /></label>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted">Items (set quantity to 0 to remove)</p>
          {p.items.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-3">
              <span className="min-w-0 flex-1 truncate text-ink">{i.name}{i.variant ? ` · ${i.variant}` : ""}</span>
              <span className="text-muted">{formatCurrency(i.price, p.currency)}</span>
              <input type="hidden" name="itemId" value={i.id} />
              <input
                name="itemQty"
                type="number"
                min={0}
                max={100}
                value={qty[i.id] ?? 0}
                onChange={(e) => setQty((q) => ({ ...q, [i.id]: Math.max(0, Math.min(100, Number(e.target.value) || 0)) }))}
                className="w-16 rounded-lg border border-line px-2 py-1.5 text-center text-sm"
              />
            </div>
          ))}
        </div>

        <div className="space-y-1 border-t border-line pt-2 text-sm">
          <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="text-ink">{formatCurrency(subtotal, p.currency)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Delivery</span><span className="text-ink">{formatCurrency(p.deliveryFee, p.currency)}</span></div>
          {discount > 0 && <div className="flex justify-between"><span className="text-muted">Discount</span><span className="text-primary">− {formatCurrency(discount, p.currency)}</span></div>}
          <div className="flex justify-between pt-1 font-medium text-ink"><span>New total</span><span>{formatCurrency(total, p.currency)}</span></div>
        </div>

        <div className="flex items-center gap-3">
          <SaveBtn />
          {state.ok && <span className="text-sm font-medium text-primary">Saved ✓</span>}
          {state.error && <span className="text-sm text-[#C0362C]">{state.error}</span>}
        </div>
      </form>
    </details>
  );
}
