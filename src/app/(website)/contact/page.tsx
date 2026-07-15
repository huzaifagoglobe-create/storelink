import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT } from "@/content/site-content";
import { LeadForm } from "@/components/marketing/lead-form";

export const metadata: Metadata = {
  title: "Contact — talk to a human",
  description: "Message StoreLink on WhatsApp and a founder replies, usually within the hour. Help getting started, support, or partnerships.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">{CONTACT.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">{CONTACT.sub}</p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {CONTACT.reasons.map((r, i) => (
          <div key={r.title} className="reveal rounded-2xl border border-line bg-surface p-5 text-center" style={{ transitionDelay: `${i * 90}ms` }}>
            <p className="text-3xl">{r.emoji}</p>
            <p className="mt-2 text-sm font-bold text-ink">{r.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{r.text}</p>
          </div>
        ))}
      </div>
      <div className="reveal mt-10">
        <LeadForm />
      </div>
      <p className="reveal mt-8 text-center text-sm text-muted">
        Prefer browsing first? <Link href="/faq" className="font-medium text-primary hover:underline">Read the FAQ</Link> or{" "}
        <Link href="/demo" className="font-medium text-primary hover:underline">open the live demo</Link>.
      </p>
    </main>
  );
}
