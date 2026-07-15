"use client";

import { useState, useActionState } from "react";
import { addExpenseAction, type ExpenseState } from "@/server/actions/expense-actions";
import { inputClass, FormError } from "./field";
import { SubmitButton } from "./submit-button";

const CATEGORIES = ["Stock purchase", "Packaging", "Courier", "Ads / marketing", "Rent & bills", "Other"];

export function ExpenseForm() {
  const [state, action] = useActionState<ExpenseState, FormData>(addExpenseAction, {});
  const [cat, setCat] = useState("Stock purchase");
  return (
    <form action={action} className="space-y-3">
      <FormError message={state.error} />
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={
              "rounded-full px-3 py-1.5 text-xs font-medium transition " +
              (cat === c ? "bg-primary text-primary-foreground" : "border border-line text-ink hover:border-primary")
            }
          >
            {c}
          </button>
        ))}
      </div>
      <input type="hidden" name="category" value={cat} />
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="amount" type="number" min={1} inputMode="numeric" className={inputClass} placeholder="Amount (Rs)" required />
        <input name="note" className={inputClass} placeholder="Note (optional) — e.g. flyers" maxLength={120} />
        <input name="spentOn" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
      </div>
      <SubmitButton pendingText="Saving…">+ Add expense</SubmitButton>
    </form>
  );
}
