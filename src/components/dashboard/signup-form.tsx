"use client";
// Captures acquisition params (?src, ?promo, ?rf) so signups are attributable.

import { useEffect, useState, useActionState } from "react";
import { signUpAction, type AuthState } from "@/server/actions/auth-actions";
import { Field, inputClass, FormError } from "./field";
import { CredentialFields } from "./credential-fields";
import { SubmitButton } from "./submit-button";

const INDUSTRIES = [
  "Pharmacy",
  "Fashion",
  "Retail",
  "Food / Home Kitchen",
  "Electronics",
  "Baby & Toys",
  "Arts",
  "Home & Lifestyle",
  "Other",
];

// light mirror of the server's normalizeSlug (for live typing)
function toSlug(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+/, "").slice(0, 40);
}

type SlugStatus = "idle" | "short" | "checking" | "available" | "taken";

export function SignupForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(signUpAction, {});

  // React resets uncontrolled inputs after a failed form action, so a single
  // weak PIN used to wipe the whole form — name, email, WhatsApp, everything.
  // Every field is controlled, and seeded from what the server handed back, so
  // nothing the seller typed is ever lost.
  const v = state.values;
  const [shopName, setShopName] = useState(v?.shopName ?? "");
  const [slug, setSlug] = useState(v?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(false);
  const [status, setStatus] = useState<SlugStatus>("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [industry, setIndustry] = useState(v?.industry ?? "");
  const [industryOther, setIndustryOther] = useState(v?.industryOther ?? "");
  const [fullName, setFullName] = useState(v?.fullName ?? "");
  const [email, setEmail] = useState(v?.email ?? "");
  const [whatsapp, setWhatsapp] = useState(v?.whatsapp ?? "");
  const [promo, setPromo] = useState(v?.promo ?? "");
  const [attr, setAttr] = useState({ src: "", promo: "", rf: "" });
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const p = q.get("promo") || "";
      setAttr({
        src: q.get("src") || localStorage.getItem("wsb-src") || "",
        promo: p,
        rf: q.get("rf") || localStorage.getItem("wsb-rf") || "",
      });
      if (p) setPromo((cur) => cur || p);
    } catch {
      /* ignore */
    }
  }, []);

  // React resets the form's DOM after a form action. Controlled text inputs get
  // re-synced, but a <select> does not — React's virtual DOM thinks the value
  // never changed, so the DOM stays blank while state still says "Fashion".
  // Pushing the server's echoed values back into state after every failed
  // submit re-applies all of them for certain.
  useEffect(() => {
    const vv = state.values;
    if (!vv) return;
    setShopName(vv.shopName ?? "");
    setSlug(vv.slug ?? "");
    setSlugEdited(true); // it came back from the server; don't auto-overwrite it
    setIndustry(vv.industry ?? "");
    setIndustryOther(vv.industryOther ?? "");
    setFullName(vv.fullName ?? "");
    setEmail(vv.email ?? "");
    setWhatsapp(vv.whatsapp ?? "");
    setPromo(vv.promo ?? "");
  }, [state]);

  function onShopName(v: string) {
    setShopName(v);
    if (!slugEdited) setSlug(toSlug(v)); // auto-fill link until user edits it
  }
  function onSlug(v: string) {
    setSlugEdited(true);
    setSlug(toSlug(v));
  }

  // debounced live availability check
  useEffect(() => {
    if (slug.length < 3) {
      setStatus(slug.length === 0 ? "idle" : "short");
      setSuggestions([]);
      return;
    }
    setStatus("checking");
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(slug)}`, { signal: ctrl.signal });
        const data = await res.json();
        if (data.available) {
          setStatus("available");
          setSuggestions([]);
        } else {
          setStatus("taken");
          setSuggestions(data.suggestions ?? []);
        }
      } catch {
        /* aborted / offline — leave as is */
      }
    }, 400);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [slug]);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />

      <Field label="Shop / brand name" htmlFor="shopName">
        <input
          id="shopName"
          name="shopName"
          value={shopName}
          onChange={(e) => onShopName(e.target.value)}
          className={inputClass}
          placeholder="e.g. Rafique Cloths"
          autoComplete="organization"
        />
      </Field>

      {/* shop link with live availability + suggestions */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-ink">Your shop link</label>
        <div className="mt-1 flex items-stretch overflow-hidden rounded-xl border border-line bg-surface focus-within:border-primary">
          <span className="flex items-center bg-[#EAF3EE] px-3 text-sm text-muted">yourshop.pk/</span>
          <input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => onSlug(e.target.value)}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted"
            placeholder="rafique-cloths"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <span className="flex items-center whitespace-nowrap pr-3 text-sm">
            {status === "checking" && <span className="text-muted">checking…</span>}
            {status === "available" && <span className="font-medium text-primary">✓ free</span>}
            {status === "taken" && <span className="font-medium text-[#B42318]">✕ taken</span>}
          </span>
        </div>
        {status === "available" && (
          <p className="mt-1 text-xs text-primary">Nice — this link is yours if you sign up now.</p>
        )}
        {status === "short" && <p className="mt-1 text-xs text-muted">Use at least 3 letters or numbers.</p>}
        {status === "taken" && (
          <div className="mt-1.5">
            <p className="text-xs text-muted">That link is taken. Try one of these:</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSlugEdited(true); setSlug(s); }}
                  className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-primary hover:bg-[#EAF3EE]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* industry */}
      <div>
        <label htmlFor="industry" className="block text-sm font-medium text-ink">What do you sell?</label>
        <select
          id="industry"
          name="industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className={`${inputClass} mt-1`}
        >
          <option value="">Select your industry</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        {industry === "Other" && (
          <input
            name="industryOther"
            value={industryOther}
            onChange={(e) => setIndustryOther(e.target.value)}
            className={`${inputClass} mt-2`}
            placeholder="Type your industry"
            autoFocus
          />
        )}
      </div>

      <div className="h-px bg-line" />

      <Field label="Your name" htmlFor="fullName" hint="Optional">
        <input id="fullName" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Your name" autoComplete="name" />
      </Field>
      <Field label="Email" htmlFor="email">
        <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={inputClass} placeholder="you@example.com" />
      </Field>
      <Field label="WhatsApp number" htmlFor="whatsapp" hint="Where you'll receive orders">
        <input id="whatsapp" name="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" autoComplete="tel" className={inputClass} placeholder="03001234567" />
      </Field>

      <CredentialFields defaultKind={v?.credentialKind ?? "pin"} labelNew="Create a PIN" />

      <input type="hidden" name="src" value={attr.src} />
      <input type="hidden" name="rf" value={attr.rf} />
      <div>
        <label htmlFor="promo" className="block text-sm font-medium text-ink">Promo code (optional)</label>
        <input
          id="promo"
          name="promo"
          value={promo}
          onChange={(e) => setPromo(e.target.value)}
          className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
          placeholder="Have a code? Longer free trial"
        />
      </div>

      <SubmitButton className="w-full" pendingText="Creating your shop…">Create my shop</SubmitButton>
    </form>
  );
}
