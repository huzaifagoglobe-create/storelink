import type { Metadata } from "next";
import Link from "next/link";
import { FAQS } from "@/content/site-content";

export const metadata: Metadata = {
  title: "FAQ — every question, answered honestly",
  description: "What is StoreLink? How much does it cost? Does it support Cash on Delivery? How does fake-order protection work? Every answer, in plain words.",
  alternates: { canonical: "/faq" },
};

/** The FAQ page doubles as our AEO surface: schema.org FAQPage markup lets
 *  Google and AI answer engines quote these answers directly. */
export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="text-center">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">Questions, answered honestly</h1>
        <p className="mt-3 text-sm text-muted">No marketing fog. If an answer here feels incomplete, ask us on WhatsApp.</p>
      </div>
      <div className="mt-10 space-y-3">
        {FAQS.map((f, i) => (
          <details key={f.q} className="reveal group rounded-2xl border border-line bg-surface p-5" style={{ transitionDelay: `${(i % 4) * 70}ms` }} open={i === 0}>
            <summary className="cursor-pointer list-none text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {f.q} <span className="float-right text-muted transition group-open:rotate-45">＋</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
      <div className="reveal mt-10 text-center">
        <p className="text-sm text-muted">Still unsure?</p>
        <div className="mt-3 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/demo" className="rounded-xl border border-line px-6 py-3 text-sm font-semibold text-ink transition hover:border-primary">▶ Try the live demo</Link>
          <Link href="/contact" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Ask a human →</Link>
        </div>
      </div>
    </main>
  );
}
