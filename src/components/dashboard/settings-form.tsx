"use client";

import { useActionState } from "react";
import { updateShopAction, type ShopState } from "@/server/actions/shop-actions";
import { Field, inputClass, FormError, FormSuccess } from "./field";
import { SubmitButton } from "./submit-button";
import { DeliveryZones } from "./delivery-zones";
import type { Shop } from "@/server/types";

export function SettingsForm({ shop }: { shop: Shop }) {
  const [state, formAction] = useActionState<ShopState, FormData>(updateShopAction, {});
  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <FormError message={state.error} /> : null}
      {state.ok ? <FormSuccess message="Saved." /> : null}

      <Field label="Shop name" htmlFor="name">
        <input id="name" name="name" defaultValue={shop.name} className={inputClass} />
      </Field>
      <Field label="Shop link" htmlFor="slug" hint={`Your storefront: /${shop.slug}`}>
        <input id="slug" name="slug" defaultValue={shop.slug} className={inputClass} />
      </Field>
      <Field label="Tagline" htmlFor="tagline" hint="Optional — shown under your shop name">
        <input id="tagline" name="tagline" defaultValue={shop.tagline ?? ""} className={inputClass} />
      </Field>
      <Field label="Business address" htmlFor="address" hint="Optional — shown on your storefront">
        <input id="address" name="address" defaultValue={shop.address ?? ""} className={inputClass} placeholder="e.g. Shop 14, Tariq Road, Karachi" />
      </Field>
      <Field label="Logo initials" htmlFor="logoText" hint="A few letters shown in the logo circle">
        <input
          id="logoText"
          name="logoText"
          maxLength={8}
          defaultValue={shop.logoText ?? ""}
          className={inputClass}
        />
      </Field>
      <Field label="WhatsApp number" htmlFor="whatsapp" hint="Orders open a chat to this number">
        <input
          id="whatsapp"
          name="whatsapp"
          inputMode="tel"
          defaultValue={shop.whatsapp}
          className={inputClass}
        />
      </Field>
      <Field
        label="Online payment note"
        htmlFor="paymentNote"
        hint="Shown to buyers who choose 'Pay online' (JazzCash / Easypaisa / Raast)"
      >
        <textarea
          id="paymentNote"
          name="paymentNote"
          rows={2}
          defaultValue={shop.paymentNote ?? ""}
          className={inputClass}
        />
      </Field>

      <div className="space-y-3 rounded-xl border border-line p-3">
        <div>
          <p className="text-sm font-medium text-ink">Social links</p>
          <p className="text-xs text-muted">Optional — shown in your storefront footer.</p>
        </div>
        <Field label="Instagram" htmlFor="instagramUrl">
          <input id="instagramUrl" name="instagramUrl" defaultValue={shop.instagramUrl ?? ""} className={inputClass} placeholder="instagram.com/yourshop" />
        </Field>
        <Field label="Facebook" htmlFor="facebookUrl">
          <input id="facebookUrl" name="facebookUrl" defaultValue={shop.facebookUrl ?? ""} className={inputClass} placeholder="facebook.com/yourshop" />
        </Field>
        <Field label="TikTok" htmlFor="tiktokUrl">
          <input id="tiktokUrl" name="tiktokUrl" defaultValue={shop.tiktokUrl ?? ""} className={inputClass} placeholder="tiktok.com/@yourshop" />
        </Field>
        <Field label="YouTube" htmlFor="youtubeUrl">
          <input id="youtubeUrl" name="youtubeUrl" defaultValue={shop.youtubeUrl ?? ""} className={inputClass} placeholder="youtube.com/@yourshop" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Delivery fee (Rs)" htmlFor="deliveryFee">
          <input
            id="deliveryFee"
            name="deliveryFee"
            inputMode="numeric"
            defaultValue={String(shop.deliveryFee)}
            className={inputClass}
          />
        </Field>
        <Field label="Free delivery over (Rs)" htmlFor="freeDeliveryOver" hint="Blank = none">
          <input
            id="freeDeliveryOver"
            name="freeDeliveryOver"
            inputMode="numeric"
            defaultValue={shop.freeDeliveryOver != null ? String(shop.freeDeliveryOver) : ""}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Delivery rates by city" htmlFor="deliveryZones" hint="Optional — overrides the flat fee for these cities">
        <DeliveryZones initial={shop.deliveryZones} />
      </Field>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={shop.isActive}
          className="h-4 w-4 rounded border-line"
        />
        Shop is open (storefront visible to buyers)
      </label>

      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-line bg-[#f7f9f7] p-4">
        <p className="text-sm font-semibold text-ink">📈 Marketing tracking (optional)</p>
        <p className="mb-3 mt-1 text-xs text-muted">
          Running Facebook/Instagram or Google ads? Paste your IDs and every visit and order on your shop is measured —
          so you can retarget visitors and see which ads actually sell. Just the ID, nothing else to set up.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Facebook Pixel ID" htmlFor="fbPixelId" hint="Meta Events Manager → your pixel → the number">
            <input id="fbPixelId" name="fbPixelId" inputMode="numeric" defaultValue={shop.fbPixelId ?? ""} className={inputClass} placeholder="e.g. 123456789012345" />
          </Field>
          <Field label="Google Analytics ID" htmlFor="gaMeasurementId" hint="GA4 → Admin → Data streams → Measurement ID">
            <input id="gaMeasurementId" name="gaMeasurementId" defaultValue={shop.gaMeasurementId ?? ""} className={inputClass} placeholder="e.g. G-AB12CD34EF" />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-[#f7f9f7] p-4">
        <p className="text-sm font-semibold text-ink">🔎 Google search appearance (optional)</p>
        <p className="mb-3 mt-1 text-xs text-muted">
          How your shop shows up in Google results. Leave empty and we write good ones automatically — only fill these
          if you want exact control.
        </p>
        <div className="space-y-3">
          <Field label="Search title" htmlFor="seoTitle" hint="Up to 70 characters">
            <input id="seoTitle" name="seoTitle" maxLength={70} defaultValue={shop.seoTitle ?? ""} className={inputClass} placeholder={`e.g. ${shop.name} — Lawn & Kurtis, Cash on Delivery`} />
          </Field>
          <Field label="Search description" htmlFor="seoDescription" hint="Up to 170 characters">
            <textarea id="seoDescription" name="seoDescription" maxLength={170} rows={2} defaultValue={shop.seoDescription ?? ""} className={inputClass} placeholder="One or two sentences that make people click." />
          </Field>
        </div>
      </div>

      <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
        {state.ok && <span className="text-sm font-medium text-primary">Saved ✓</span>}
      </div>
    </form>
  );
}
