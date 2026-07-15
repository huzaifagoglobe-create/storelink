"use client";

import { updateOrderStatusAction } from "@/server/actions/order-actions";
import { SubmitButton } from "./submit-button";
import type { OrderStatus } from "@/server/types";

const options: { value: OrderStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "confirmed", label: "Confirmed" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrderStatusControl({
  orderNumber,
  current,
}: {
  orderNumber: string;
  current: OrderStatus;
}) {
  return (
    <form action={updateOrderStatusAction} className="flex items-end gap-2">
      <input type="hidden" name="orderNumber" value={orderNumber} />
      <label className="flex-1">
        <span className="mb-1 block text-xs font-medium text-ink">Order status</span>
        <select
          name="status"
          defaultValue={current}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <SubmitButton variant="outline" pendingText="Saving…">
        Update
      </SubmitButton>
    </form>
  );
}
