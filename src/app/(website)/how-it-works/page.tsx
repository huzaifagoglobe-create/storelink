import type { Metadata } from "next";
import Link from "next/link";
import { HOW } from "@/content/site-content";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "How it works — from zero to first order",
  description: "How StoreLink works: sign up in 2 minutes, add products, share your link, and take Cash-on-Delivery orders — even while you sleep. No developer needed.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to open your online shop on StoreLink",
    description: HOW.sub,
    step: HOW.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.text, url: `${SITE_URL}/how-it-works` })),
  };
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="text-center">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">{HOW.title}</h1>
        <p className="mt-3 text-sm text-muted">{HOW.sub}</p>
      </div>
      <ol className="mt-12 space-y-6">
        {HOW.steps.map((s) => (
          <li key={s.n} className="reveal flex gap-5 rounded-3xl border border-line bg-surface p-6">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-[#2EAF7D] to-[#1D7A9C] text-lg font-bold text-white">
              {s.n}
            </span>
            <div>
              <h2 className="text-base font-bold text-ink">{s.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="reveal mt-12 rounded-3xl bg-[#EAF3EE] p-7 text-center">
        <h2 className="text-lg font-bold text-ink">{HOW.afterTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{HOW.afterText}</p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/demo" className="rounded-xl border border-line bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-primary">▶ See a real dashboard first</Link>
          <Link href="/signup?src=how" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Start my 2 minutes →</Link>
        </div>
      </div>
    </main>
  );
}
