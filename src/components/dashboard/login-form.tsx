"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type AuthState } from "@/server/actions/auth-actions";
import { Field, inputClass, FormError } from "./field";
import { SubmitButton } from "./submit-button";

export function LoginForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(signInAction, {});
  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />
      <Field label="Email" htmlFor="email">
        <input id="email" name="email" type="email" autoComplete="email" className={inputClass} placeholder="you@example.com" />
      </Field>
      <Field label="PIN" htmlFor="pin" hint="4–6 digits">
        <input id="pin" name="pin" type="password" inputMode="numeric" pattern="\d*" maxLength={6} autoComplete="current-password" className={inputClass} placeholder="••••" />
      </Field>
      <div className="-mt-1 text-right">
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">Forgot PIN?</Link>
      </div>
      <SubmitButton className="w-full" pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
