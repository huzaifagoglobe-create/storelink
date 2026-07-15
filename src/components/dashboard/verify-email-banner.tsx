"use client";

import { useState, useTransition } from "react";
import { resendVerificationAction } from "@/server/actions/auth-actions";

export function VerifyEmailBanner({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E7D9A8] bg-[#FBF7EC] px-4 py-2.5 text-sm text-[#7a5a16]">
      <span>Please verify your email (<b>{email}</b>) to secure your account.</span>
      {sent ? (
        <span className="font-medium text-primary">Sent ✓ Check your inbox.</span>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => { await resendVerificationAction(); setSent(true); })}
          className="font-semibold text-primary hover:underline disabled:opacity-60"
        >
          {pending ? "Sending…" : "Resend email"}
        </button>
      )}
    </div>
  );
}
