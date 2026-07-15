"use client";

import { useActionState } from "react";
import { requestPasswordResetAction, type AuthState } from "@/server/actions/auth-actions";
import { Field, inputClass, FormError } from "./field";
import { SubmitButton } from "./submit-button";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(requestPasswordResetAction, {});

  if (state.sent) {
    return (
      <div className="rounded-xl bg-[#EAF3EE] p-4 text-sm">
        <p className="font-medium text-ink">Check your email</p>
        <p className="mt-1 text-muted">
          If an account exists for that email, we’ve sent a link to reset your PIN. It’s valid for 30
          minutes. Don’t see it? Check your spam folder.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />
      <Field label="Email" htmlFor="email" hint="The email you signed up with">
        <input id="email" name="email" type="email" autoComplete="email" className={inputClass} placeholder="you@example.com" />
      </Field>
      <SubmitButton className="w-full" pendingText="Sending…">Send reset link</SubmitButton>
    </form>
  );
}
