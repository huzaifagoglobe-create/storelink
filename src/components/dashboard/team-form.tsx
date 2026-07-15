"use client";

import { useActionState } from "react";
import { addStaffAction, type TeamState } from "@/server/actions/team-actions";
import { Field, inputClass, FormError, FormSuccess } from "./field";
import { SubmitButton } from "./submit-button";

export function TeamForm() {
  const [state, action] = useActionState<TeamState, FormData>(addStaffAction, {});
  return (
    <form action={action} className="space-y-3">
      <FormError message={state.error} />
      {state.ok && <FormSuccess message="Staff login created — share the email + PIN with them. They log in at the normal login page." />}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name" htmlFor="tname">
          <input id="tname" name="fullName" className={inputClass} placeholder="e.g. Bilal" required />
        </Field>
        <Field label="Login email" htmlFor="temail">
          <input id="temail" name="email" type="email" className={inputClass} placeholder="their@email.com" required />
        </Field>
        <Field label="Login PIN" htmlFor="tpin" hint="4–8 digits">
          <input id="tpin" name="pin" inputMode="numeric" className={inputClass} placeholder="e.g. 5566" required />
        </Field>
      </div>
      <SubmitButton pendingText="Creating…">+ Add staff login</SubmitButton>
    </form>
  );
}
