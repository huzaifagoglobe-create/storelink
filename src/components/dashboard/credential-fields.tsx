"use client";

import { useState, useId } from "react";
import { strengthOf, PASSWORD_MAX, type CredentialKind, type StrengthLevel } from "@/server/auth/credential-policy";
import { Field, inputClass } from "./field";

/**
 * Lets the seller choose a PIN or a password, and tells them honestly how
 * strong their choice is — as they type, before they hit submit.
 *
 * It calls the SAME strengthOf() the server uses, so the meter can never
 * promise something the server then rejects.
 */

const BAR: Record<StrengthLevel, { w: string; bg: string; text: string; word: string }> = {
  weak:   { w: "25%",  bg: "bg-[#D92D20]", text: "text-[#B42318]", word: "Weak" },
  fair:   { w: "50%",  bg: "bg-[#F79009]", text: "text-[#B54708]", word: "Fair" },
  good:   { w: "75%",  bg: "bg-[#3B9A6B]", text: "text-[#276749]", word: "Good" },
  strong: { w: "100%", bg: "bg-[#12805C]", text: "text-[#0B5B41]", word: "Strong" },
};

export function CredentialFields({
  defaultKind = "pin",
  labelNew = "Create a PIN",
  autoComplete = "new-password",
}: {
  defaultKind?: CredentialKind;
  labelNew?: string;
  autoComplete?: string;
}) {
  const [kind, setKind] = useState<CredentialKind>(defaultKind);
  const [value, setValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const meterId = useId();

  const isPin = kind === "pin";
  const s = strengthOf(value, kind);
  const bar = BAR[s.level];
  const mismatch = confirm.length > 0 && value !== confirm;

  function switchTo(next: CredentialKind) {
    setKind(next);
    setValue("");
    setConfirm("");
  }

  const label = isPin ? "PIN" : "password";

  return (
    <div className="space-y-3">
      <input type="hidden" name="credentialKind" value={kind} />

      {/* chooser */}
      <div>
        <span className="block text-sm font-medium text-ink">How do you want to sign in?</span>
        <div className="mt-1.5 grid grid-cols-2 gap-2" role="group" aria-label="Sign-in method">
          {(["pin", "password"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => switchTo(k)}
              aria-pressed={kind === k}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                kind === k
                  ? "border-primary bg-[#EAF3EE] text-primary"
                  : "border-line bg-surface text-muted hover:border-primary/40"
              }`}
            >
              {k === "pin" ? "PIN" : "Password"}
              <span className="mt-0.5 block text-[11px] font-normal text-muted">
                {k === "pin" ? "4–6 digits, quick" : "8+ characters, safer"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* the credential */}
      <Field
        label={isPin ? labelNew : labelNew.replace("PIN", "password")}
        htmlFor="pin"
        hint={isPin ? "4–6 digits" : "At least 8 characters"}
      >
        <div className="relative">
          <input
            id="pin"
            name="pin"
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode={isPin ? "numeric" : "text"}
            maxLength={isPin ? 6 : PASSWORD_MAX}
            autoComplete={autoComplete}
            aria-describedby={meterId}
            className={`${inputClass} pr-16`}
            placeholder={isPin ? "••••" : "••••••••"}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-muted hover:text-ink"
            aria-label={show ? `Hide ${label}` : `Show ${label}`}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
      </Field>

      {/* live strength meter */}
      {value.length > 0 && (
        <div id={meterId} aria-live="polite">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div className={`h-full rounded-full transition-all duration-300 ${bar.bg}`} style={{ width: bar.w }} />
          </div>
          <p className="mt-1 text-xs">
            <span className={`font-semibold ${bar.text}`}>{bar.word}</span>
            {s.hint && <span className="text-muted"> — {s.hint}</span>}
          </p>
        </div>
      )}

      <Field label={isPin ? "Confirm PIN" : "Confirm password"} htmlFor="confirmPin">
        <input
          id="confirmPin"
          name="confirmPin"
          type={show ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          inputMode={isPin ? "numeric" : "text"}
          maxLength={isPin ? 6 : PASSWORD_MAX}
          autoComplete={autoComplete}
          className={inputClass}
          placeholder={isPin ? "••••" : "••••••••"}
        />
      </Field>
      {mismatch && (
        <p className="text-xs font-medium text-[#B42318]">
          The two {isPin ? "PINs" : "passwords"} don&apos;t match yet.
        </p>
      )}
    </div>
  );
}
