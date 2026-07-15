import type { Metadata } from "next";
import Link from "next/link";
import { FEATURE_GROUPS } from "@/content/site-content";

export const metadata: Metadata = {
  title: "All features — everything a Pakistani seller needs",
  description:
    "Every StoreLink feature: your own shop link, 30-second COD checkout, fake-order protection, khata profit books, referrals, resellers, share cards, staff logins and more.",
  alternates: { canonical: "/features" },
};

export default function FeaturesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">Every feature, one honest list</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
          No feature exists for a slide deck. Each one is here because it gets you more orders, saves you time, or
          protects your money.
        </p>
      </div>
      <div className="mt-12 space-y-12">
        {FEATURE_GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="reveal text-xl font-bold text-ink">
              {g.emoji} {g.title}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.features.map((f, i) => (
                <div key={f.name} className="reveal lift rounded-2xl border border-line bg-surface p-5" style={{ transitionDelay: `${(i % 3) * 90}ms` }}>
                  <p className="text-sm font-bold text-ink">{f.name}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.text}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="reveal mt-14 rounded-3xl bg-[#0B1F17] p-10 text-center text-white">
        <h2 className="text-2xl font-bold">See them working, not listed</h2>
        <p className="mt-2 text-sm text-white/60">Open the live demo dashboard — every feature above, with real data inside.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/demo" className="glass rounded-xl px-6 py-3 text-sm font-semibold">▶ Open live demo</Link>
          <Link href="/signup?src=features" className="rounded-xl bg-[#2EAF7D] px-6 py-3 text-sm font-semibold">Start free →</Link>
        </div>
      </div>
    </main>
  );
}
