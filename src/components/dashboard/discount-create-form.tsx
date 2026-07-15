"use client";

import { useActionState } from "react";
import { createDiscountAction, type DiscountState } from "@/server/actions/discount-actions";
import { inputClass, FormError } from "./field";
import { SubmitButton } from "./submit-button";

export function DiscountCreateForm() {
  const [state, action] = useActionState<DiscountState, FormData>(createDiscountAction, {});
  return (
    <form action={action} className="space-y-3">
      <FormError message={state.error} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-muted">Code</label>
          <input name="code" className={inputClass} placeholder="WELCOME10" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Type</label>
          <select name="type" defaultValue="percent" className={inputClass}>
            <option value="percent">Percent (%)</option>
            <option value="fixed">Fixed (Rs)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Amount</label>
          <input name="value" inputMode="numeric" className={inputClass} placeholder="10" />
        </div>
      </div>
      <SubmitButton pendingText="Adding…">Add discount</SubmitButton>
    </form>
  );
}
