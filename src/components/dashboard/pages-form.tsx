"use client";

import { useActionState } from "react";
import { updatePagesAction, type PagesState } from "@/server/actions/pages-actions";
import { Field, inputClass, FormError, FormSuccess } from "./field";
import { SubmitButton } from "./submit-button";
import { RETURN_POLICIES } from "@/lib/shop-pages";
import type { Shop } from "@/server/types";

export function PagesForm({ shop }: { shop: Shop }) {
  const [state, action] = useActionState<PagesState, FormData>(updatePagesAction, {});
  return (
    <form action={action} className="space-y-5">
      <FormError message={state.error} />
      {state.ok && <FormSuccess message="Pages saved — they're live on your store now." />}

      <section className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm font-semibold text-ink">About us</p>
        <p className="mb-3 text-xs text-muted">
          Write 2–4 lines in your own words: who you are, what you sell, and since when. We turn it into a clean
          &quot;About us&quot; page. Leave empty to hide the page.
        </p>
        <textarea
          name="aboutText"
          rows={5}
          maxLength={2000}
          defaultValue={shop.aboutText ?? ""}
          className={inputClass}
          placeholder={`Example: ${shop.name} started in 2022 from home. We hand-pick every piece ourselves and ship all over Pakistan with Cash on Delivery.`}
        />
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm font-semibold text-ink">Return policy</p>
        <p className="mb-3 text-xs text-muted">
          Pick one and we write the whole policy page for you. Buyers trust shops with a clear policy.
        </p>
        <Field label="What do you offer?" htmlFor="returnPolicy">
          <select id="returnPolicy" name="returnPolicy" defaultValue={shop.returnPolicy ?? ""} className={inputClass}>
            <option value="">No returns page (hide it)</option>
            {Object.entries(RETURN_POLICIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="mt-3">
          <Field label="Anything to add? (optional)" htmlFor="returnPolicyNote" hint="e.g. Sale items are exchange-only">
            <input
              id="returnPolicyNote"
              name="returnPolicyNote"
              maxLength={600}
              defaultValue={shop.returnPolicyNote ?? ""}
              className={inputClass}
              placeholder="One extra line, in your words"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-[#bfe0cd] bg-[#EAF3EE] p-5">
        <p className="text-sm font-semibold text-ink">Terms &amp; Privacy — already done for you ✓</p>
        <p className="mt-1 text-xs text-muted">
          We generate professional Terms of Service and Privacy Policy pages automatically using your shop name,
          location and WhatsApp number. Nothing to write — they&apos;re live right now and update themselves when your
          details change.
        </p>
      </section>

      <SubmitButton pendingText="Saving…">Save pages</SubmitButton>
    </form>
  );
}
