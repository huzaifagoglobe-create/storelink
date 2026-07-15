"use client";

import { createContext, useContext, useState } from "react";

const RevenueCtx = createContext<{ show: boolean; toggle: () => void }>({
  show: false,
  toggle: () => {},
});

/** Wrap admin content so one toggle controls every revenue figure. Hidden by default. */
export function RevenueProvider({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <RevenueCtx.Provider value={{ show, toggle: () => setShow((s) => !s) }}>{children}</RevenueCtx.Provider>
  );
}

function Eye() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOff() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 5c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68M6.6 6.6A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 1 0 4.2 4.2" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

/** The Show / Hide button for the revenue section. */
export function RevenueToggle() {
  const { show, toggle } = useContext(RevenueCtx);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={show}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition hover:border-primary"
    >
      {show ? <EyeOff /> : <Eye />}
      {show ? "Hide" : "Show"}
    </button>
  );
}

/** A money value that stays masked until the admin reveals revenue. */
export function SecretMoney({ value, className }: { value: string; className?: string }) {
  const { show } = useContext(RevenueCtx);
  return <span className={className}>{show ? value : "••••••"}</span>;
}
