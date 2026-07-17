"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signInAction, type AuthState } from "@/server/actions/auth-actions";
import { Field, inputClass, FormError } from "./field";
import { PASSWORD_MAX } from "@/server/auth/credential-policy";
import { SubmitButton } from "./submit-button";

export function LoginForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(signInAction, {});
  const [show, setShow] = useState(false);
  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />
      <Field label="Email" htmlFor="email">
        <input id="email" name="email" type="email" autoComplete="email" className={inputClass} placeholder="you@example.com" />
      </Field>
      {/* Accepts a PIN or a password — sellers pick either at signup, so this
          field must not be numeric-only or capped at 6 characters. */}
      <Field label="PIN or password" htmlFor="pin">
        <div className="relative">
          <input
            id="pin"
            name="pin"
            type={show ? "text" : "password"}
            maxLength={PASSWORD_MAX}
            autoComplete="current-password"
            className={`${inputClass} pr-16`}
            placeholder="••••"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-muted hover:text-ink"
            aria-label={show ? "Hide" : "Show"}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
      </Field>
      <div className="-mt-1 text-right">
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">Forgot PIN or password?</Link>
      </div>
      <SubmitButton className="w-full" pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
