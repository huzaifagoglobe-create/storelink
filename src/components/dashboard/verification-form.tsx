"use client";

import { useActionState } from "react";
import { submitVerificationAction, type VerifyState } from "@/server/actions/verification-actions";
import { Field, inputClass, FormError } from "./field";
import { SubmitButton } from "./submit-button";
import { ImageUploader } from "./image-uploader";

const METHODS = [
  { v: "easypaisa", l: "Easypaisa" },
  { v: "jazzcash", l: "JazzCash" },
  { v: "sadapay", l: "SadaPay" },
  { v: "nayapay", l: "NayaPay" },
  { v: "bank", l: "Bank account" },
];

export function VerificationForm({
  defaults,
}: {
  defaults: {
    payoutMethod: string | null;
    payoutAccountName: string | null;
    payoutAccountNumber: string | null;
    cnicNumber: string | null;
    cnicImageUrl: string | null;
    selfieImageUrl: string | null;
    instagramUrl: string | null;
    tiktokUrl: string | null;
  };
}) {
  const [state, formAction] = useActionState<VerifyState, FormData>(submitVerificationAction, {});

  if (state.done) {
    return (
      <div className="rounded-xl bg-[#FBF1DD] p-4 text-sm">
        <p className="font-medium text-ink">Submitted for review</p>
        <p className="mt-1 text-muted">
          We&apos;ll check that your selfie matches your CNIC and send you a confirmation on WhatsApp.
          You can keep taking Cash-on-Delivery orders in the meantime.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />

      <Field label="Where should customers send online payments?" htmlFor="payoutMethod">
        <select id="payoutMethod" name="payoutMethod" defaultValue={defaults.payoutMethod ?? ""} className={inputClass}>
          <option value="">Choose a method…</option>
          {METHODS.map((m) => (
            <option key={m.v} value={m.v}>{m.l}</option>
          ))}
        </select>
      </Field>
      <Field label="Account holder name" htmlFor="payoutAccountName" hint="Must match the name on your CNIC">
        <input id="payoutAccountName" name="payoutAccountName" defaultValue={defaults.payoutAccountName ?? ""} className={inputClass} placeholder="e.g. Zara Ahmed" />
      </Field>
      <Field label="Account / mobile number" htmlFor="payoutAccountNumber">
        <input id="payoutAccountNumber" name="payoutAccountNumber" defaultValue={defaults.payoutAccountNumber ?? ""} className={inputClass} placeholder="e.g. 03001234567" />
      </Field>
      <Field label="CNIC number" htmlFor="cnicNumber" hint="13 digits">
        <input id="cnicNumber" name="cnicNumber" defaultValue={defaults.cnicNumber ?? ""} inputMode="numeric" className={inputClass} placeholder="42101-1234567-8" />
      </Field>

      <Field label="Photo of your CNIC (front)" hint="Clear, readable photo">
        <ImageUploader name="cnicUrls" endpoint="/api/uploads/verification" initial={[]} />
      </Field>
      <Field label="Your selfie (face photo)" hint="We check your face matches the CNIC photo">
        <ImageUploader name="selfieUrls" endpoint="/api/uploads/verification" initial={[]} />
      </Field>

      <div className="rounded-xl border border-line bg-[#F7FAF8] p-3">
        <p className="text-sm font-medium text-ink">
          Link your socials <span className="font-normal text-muted">· at least one required</span>
        </p>
        <p className="mt-0.5 text-xs text-muted">A linked Instagram or TikTok proves your shop is real and builds buyer trust.</p>
        <div className="mt-2 space-y-2">
          <input name="instagramUrl" defaultValue={defaults.instagramUrl ?? ""} className={inputClass} placeholder="instagram.com/yourshop" />
          <input name="tiktokUrl" defaultValue={defaults.tiktokUrl ?? ""} className={inputClass} placeholder="tiktok.com/@yourshop" />
        </div>
      </div>

      <SubmitButton className="w-full" pendingText="Submitting…">Submit for verification</SubmitButton>
    </form>
  );
}
