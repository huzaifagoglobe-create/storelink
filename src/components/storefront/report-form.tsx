"use client";

import { useActionState } from "react";
import { submitReportAction, type ReportState } from "@/server/actions/report-actions";
import { Field, inputClass, FormError } from "@/components/dashboard/field";
import { SubmitButton } from "@/components/dashboard/submit-button";

const REASONS = [
  { v: "didnt_deliver", l: "Paid but didn't receive my order" },
  { v: "fake_products", l: "Fake or wrong products" },
  { v: "fraud", l: "Fraud or scam" },
  { v: "other", l: "Something else" },
];

export function ReportForm({ slug }: { slug: string }) {
  const [state, formAction] = useActionState<ReportState, FormData>(submitReportAction, {});

  if (state.done) {
    return (
      <div className="rounded-xl bg-[#EAF3EE] p-4 text-sm">
        <p className="font-medium text-ink">Thank you</p>
        <p className="mt-1 text-muted">
          We&apos;ve received your report and our team will review it. Reports like yours help keep
          buyers safe.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />
      <input type="hidden" name="slug" value={slug} />
      <Field label="What went wrong?" htmlFor="reason">
        <select id="reason" name="reason" defaultValue="" className={inputClass}>
          <option value="">Choose a reason…</option>
          {REASONS.map((r) => (
            <option key={r.v} value={r.v}>{r.l}</option>
          ))}
        </select>
      </Field>
      <Field label="Details (optional)" htmlFor="details">
        <textarea id="details" name="details" rows={4} maxLength={600} className={inputClass} placeholder="Tell us what happened…" />
      </Field>
      <SubmitButton className="w-full" pendingText="Sending…">Submit report</SubmitButton>
    </form>
  );
}
