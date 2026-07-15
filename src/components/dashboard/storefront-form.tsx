"use client";

import { useState, useActionState } from "react";
import { updateStorefrontAction, type StorefrontState } from "@/server/actions/storefront-actions";
import { Field, inputClass, FormError, FormSuccess } from "./field";
import { SubmitButton } from "./submit-button";
import { ImageUploader } from "./image-uploader";
import { TEMPLATES } from "@/server/storefront-templates";
import { TemplateMockup } from "./template-mockup";
import { StorefrontLivePreview } from "./storefront-live-preview";
import type { Shop } from "@/server/types";

export function StorefrontForm({ shop }: { shop: Shop }) {
  const [state, action] = useActionState<StorefrontState, FormData>(updateStorefrontAction, {});
  const [template, setTemplate] = useState(shop.template || "classic");
  const accent = shop.themeColor || "#43705F";

  return (
    <form action={action} className="space-y-5">
      <FormError message={state.error} />
      {state.ok && <FormSuccess message="Storefront saved. Open your store to see it live." />}

      {/* Desktop: settings on the left, live preview pinned on the right.
          Mobile: preview stacks under the template picker. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-5">
          {/* ---------- Template picker ---------- */}
          <section className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-ink">Template</p>
              <p className="text-xs text-muted">Tap a design — the preview updates instantly</p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {TEMPLATES.map((t) => {
                const on = template === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    aria-pressed={on}
                    aria-label={`Select ${t.label} template`}
                    className={
                      "group relative rounded-xl border p-2 text-center transition " +
                      (on
                        ? "border-primary bg-[#F3F8F5] ring-2 ring-primary/40"
                        : "border-line hover:border-primary hover:bg-[#fafbfa]")
                    }
                  >
                    {on && (
                      <span className="absolute -right-1.5 -top-1.5 z-10 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow">
                        ✓
                      </span>
                    )}
                    <span className="pointer-events-none block overflow-hidden rounded-lg">
                      <TemplateMockup id={t.id} accent={accent} />
                    </span>
                    <span className={"mt-1.5 block truncate text-xs font-medium " + (on ? "text-primary" : "text-ink")}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* carries the chosen template into the form submit */}
            <input type="hidden" name="template" value={template} />
          </section>

          {/* ---------- Branding & banner ---------- */}
          <section className="rounded-2xl border border-line bg-surface p-5">
            <p className="mb-4 text-sm font-semibold text-ink">Branding &amp; banner</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Brand logo"
                  htmlFor="logoUrl"
                  hint="Square works best (e.g. 500×500). We centre it automatically and show the full logo. Leave empty to use your shop initials."
                >
                  <ImageUploader name="logoUrl" initial={shop.logoUrl ? [shop.logoUrl] : []} />
                </Field>
              </div>
              <Field label="Brand colour" htmlFor="themeColor" hint="Used for your banner and accents">
                <input
                  id="themeColor"
                  name="themeColor"
                  type="color"
                  defaultValue={shop.themeColor ?? "#43705F"}
                  className="h-10 w-16 cursor-pointer rounded-lg border border-line bg-surface p-1"
                />
              </Field>
              <Field label="Banner" htmlFor="bannerStyle" hint="Shown at the top of your shop">
                <select id="bannerStyle" name="bannerStyle" defaultValue={shop.bannerStyle} className={inputClass}>
                  <option value="none">No banner</option>
                  <option value="color">Colour banner</option>
                  <option value="image">Image banner</option>
                </select>
              </Field>
              <Field label="Banner heading" htmlFor="bannerHeading">
                <input
                  id="bannerHeading"
                  name="bannerHeading"
                  defaultValue={shop.bannerHeading ?? ""}
                  className={inputClass}
                  placeholder="e.g. Eid Edit — new arrivals"
                />
              </Field>
              <Field label="Banner text" htmlFor="bannerSubtext">
                <input
                  id="bannerSubtext"
                  name="bannerSubtext"
                  defaultValue={shop.bannerSubtext ?? ""}
                  className={inputClass}
                  placeholder="Short line under the heading"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Banner image" htmlFor="bannerImage" hint="Used when banner is set to Image (first photo)">
                  <ImageUploader name="bannerImage" initial={shop.bannerImage ? [shop.bannerImage] : []} />
                </Field>
              </div>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <SubmitButton pendingText="Saving…">Save storefront</SubmitButton>
            {state.ok && <span className="text-sm font-medium text-primary">Saved ✓</span>}
          </div>
        </div>

        {/* ---------- Live preview (sticky on desktop) ---------- */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <StorefrontLivePreview slug={shop.slug} template={template} />
        </aside>
      </div>
    </form>
  );
}
