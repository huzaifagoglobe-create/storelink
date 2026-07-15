"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/demo", label: "Live demo" },
  { href: "/bazaar", label: "Bazaar" },
  { href: "/learn", label: "Learn" },
  { href: "/stories", label: "Stories" },
];

/** Website header: logo, full-site nav, mobile menu, always-visible CTA. */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="StoreLink home" className="flex-none">
          <Image src="/logo.svg" alt="StoreLink" width={158} height={34} priority />
        </Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-ink/80 transition hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden rounded-xl px-3 py-2 text-sm font-medium text-ink/80 hover:text-ink sm:block">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Start free
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 text-ink lg:hidden"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-line bg-background px-4 py-3 lg:hidden" aria-label="Mobile">
          <div className="grid grid-cols-2 gap-1">
            {[...NAV, { href: "/how-it-works", label: "How it works" }, { href: "/compare", label: "Compare" }, { href: "/faq", label: "FAQ" }, { href: "/about", label: "About" }, { href: "/contact", label: "Contact" }, { href: "/login", label: "Log in" }].map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface">
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
