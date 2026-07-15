"use client";

import { useActionState } from "react";
import { addResellerAction, type ResellerState } from "@/server/actions/reseller-actions";
import { Field, inputClass, FormError, FormSuccess } from "./field";
import { SubmitButton } from "./submit-button";

export function ResellerForm() {
  const [state, action] = useActionState<ResellerState, FormData>(addResellerAction, {});
  return (
    <form action={action} className="space-y-3">
      <FormError message={state.error} />
      {state.ok && <FormSuccess message="Reseller added — share their link and every order gets tracked." />}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name" htmlFor="rname">
          <input id="rname" name="name" className={inputClass} placeholder="e.g. Ayesha" required />
        </Field>
        <Field label="WhatsApp number" htmlFor="rphone">
          <input id="rphone" name="phone" inputMode="tel" className={inputClass} placeholder="03XX XXXXXXX" required />
        </Field>
        <Field label="Commission %" htmlFor="rcomm" hint="Of delivered sales">
          <input id="rcomm" name="commissionPercent" type="number" min={0} max={50} defaultValue={10} className={inputClass} required />
        </Field>
      </div>
      <SubmitButton pendingText="Adding…">+ Add reseller</SubmitButton>
    </form>
  );
}
