"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction, type AuthState } from "@/server/actions/auth-actions";
import { Field, FormError } from "./field";
import { CredentialFields } from "./credential-fields";
import { SubmitButton } from "./submit-button";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<AuthState, FormData>(resetPasswordAction, {});

  if (state.done) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-[#EAF3EE] p-4 text-sm">
          <p className="font-medium text-ink">Sign-in updated</p>
          <p className="mt-1 text-muted">Your new PIN or password is ready. You can sign in now.</p>
        </div>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />
      <input type="hidden" name="token" value={token} />
      {/* Same chooser as signup — a reset is also a chance to move from a PIN
          to a password. */}
      <CredentialFields labelNew="New PIN" autoComplete="new-password" />
      <SubmitButton className="w-full" pendingText="Updating…">Update sign-in</SubmitButton>
    </form>
  );
}
