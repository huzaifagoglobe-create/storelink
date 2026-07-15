import type { Metadata } from "next";
import Link from "next/link";
import { ABOUT } from "@/content/site-content";

export const metadata: Metadata = {
  title: "About — why StoreLink exists",
  description: "StoreLink is built for Pakistan's Instagram and WhatsApp sellers: COD-first, phone-first, honest. Here's why we built it and what we believe.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-ink sm:text-4xl">{ABOUT.title}</h1>
      <div className="mt-8 space-y-5">
        {ABOUT.paragraphs.map((p, i) => (
          <p key={i} className="reveal text-[15px] leading-relaxed text-ink">{p}</p>
        ))}
      </div>
      <h2 className="reveal mt-14 text-xl font-bold text-ink">{ABOUT.valuesTitle}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {ABOUT.values.map((v, i) => (
          <div key={v.title} className="reveal lift rounded-2xl border border-line bg-surface p-5" style={{ transitionDelay: `${i * 90}ms` }}>
            <p className="text-sm font-bold text-ink">{v.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{v.text}</p>
          </div>
        ))}
      </div>
      <div className="reveal mt-12 rounded-3xl bg-[#0B1F17] p-8 text-center text-white">
        <p className="text-lg font-bold">Come build your shop with us</p>
        <p className="mt-1 text-sm text-white/60">Every new seller gets a personal welcome from a founder. Really.</p>
        <Link href="/signup?src=about" className="mt-5 inline-block rounded-xl bg-[#2EAF7D] px-7 py-3 text-sm font-semibold text-white">Start free →</Link>
      </div>
    </main>
  );
}
