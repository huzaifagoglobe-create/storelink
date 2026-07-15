"use client";
// Captures acquisition params (?src, ?promo, ?rf) so signups are attributable.

import { useEffect, useState, useActionState } from "react";
import { signUpAction, type AuthState } from "@/server/actions/auth-actions";
import { Field, inputClass, FormError } from "./field";
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

  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [status, setStatus] = useState<SlugStatus>("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [industry, setIndustry] = useState("");
  const [attr, setAttr] = useState({ src: "", promo: "", rf: "" });
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      setAttr({
        src: q.get("src") || localStorage.getItem("wsb-src") || "",
        promo: q.get("promo") || "",
        rf: q.get("rf") || localStorage.getItem("wsb-rf") || "",
      });
    } catch {
      /* ignore */
    }
  }, []);

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
          <input name="industryOther" className={`${inputClass} mt-2`} placeholder="Type your industry" autoFocus />
        )}
      </div>

      <div className="h-px bg-line" />

      <Field label="Your name" htmlFor="fullName" hint="Optional">
        <input id="fullName" name="fullName" className={inputClass} placeholder="Your name" autoComplete="name" />
      </Field>
      <Field label="Email" htmlFor="email">
        <input id="email" name="email" type="email" autoComplete="email" className={inputClass} placeholder="you@example.com" />
      </Field>
      <Field label="WhatsApp number" htmlFor="whatsapp" hint="Where you'll receive orders">
        <input id="whatsapp" name="whatsapp" inputMode="tel" autoComplete="tel" className={inputClass} placeholder="03001234567" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Create a PIN" htmlFor="pin" hint="4–6 digits">
          <input id="pin" name="pin" type="password" inputMode="numeric" pattern="\d*" maxLength={6} autoComplete="new-password" className={inputClass} placeholder="••••" />
        </Field>
        <Field label="Confirm PIN" htmlFor="confirmPin">
          <input id="confirmPin" name="confirmPin" type="password" inputMode="numeric" pattern="\d*" maxLength={6} autoComplete="new-password" className={inputClass} placeholder="••••" />
        </Field>
      </div>

      <input type="hidden" name="src" value={attr.src} />
      <input type="hidden" name="rf" value={attr.rf} />
      <div>
        <label htmlFor="promo" className="block text-sm font-medium text-ink">Promo code (optional)</label>
        <input
          id="promo"
          name="promo"
          defaultValue={attr.promo}
          className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
          placeholder="Have a code? Longer free trial"
        />
      </div>

      <SubmitButton className="w-full" pendingText="Creating your shop…">Create my shop</SubmitButton>
    </form>
  );
}
