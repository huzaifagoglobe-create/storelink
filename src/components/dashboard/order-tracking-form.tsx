"use client";

import { useActionState } from "react";
import { setOrderTrackingAction, type TrackingState } from "@/server/actions/order-actions";

const COURIERS = ["TCS", "Leopards", "M&P", "PostEx", "Trax", "Swyft", "BlueEx", "Callcourier", "Daewoo", "Other"];

/**
 * Lets the seller attach a courier + tracking number to an order. Once saved,
 * the buyer sees it on their order page (with a "Track" link when we recognise
 * the courier). Keeps StoreLink out of holding shipments — the seller books
 * with their own courier and just records the number here.
 */
export function OrderTrackingForm({
  orderNumber,
  courier,
  trackingNumber,
}: {
  orderNumber: string;
  courier: string | null;
  trackingNumber: string | null;
}) {
  const [state, action, pending] = useActionState<TrackingState, FormData>(setOrderTrackingAction, {});

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="orderNumber" value={orderNumber} />
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          name="courier"
          defaultValue={courier ?? ""}
          className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        >
          <option value="">Select courier</option>
          {COURIERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          name="trackingNumber"
          defaultValue={trackingNumber ?? ""}
          placeholder="Tracking number"
          maxLength={80}
          className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save tracking"}
        </button>
        {state.ok && <span className="text-xs text-primary">Saved ✓ — the buyer can see it now.</span>}
        {state.error && <span className="text-xs text-[#b3261e]">{state.error}</span>}
      </div>
    </form>
  );
}
