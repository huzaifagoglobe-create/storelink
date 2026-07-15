import type { Metadata } from "next";
import Link from "next/link";
import { PLAN_PRICE_PKR, PLAN_LIMITS, limitLabel, PLAN_LABEL, PLAN_TIERS } from "@/server/plans";
import { listAllShops } from "@/server/services/shop-service";

export const metadata: Metadata = {
  title: "Pricing — free to start, honest to grow",
  description:
    "StoreLink pricing: free 14-day trial, then Basic Rs 2,500/month, Pro Rs 5,500, Premium Rs 9,999. Every feature on every plan. First 100 shops lock Basic at Rs 1,999 for life.",
  alternates: { canonical: "/pricing" },
};
export const revalidate = 600;

const BILLING_FAQ = [
  { q: "How do I pay?", a: "Bank transfer or JazzCash/Easypaisa — we message you on WhatsApp before renewal, you pay, and your plan is active within minutes. Human, simple, no card required." },
  { q: "What if I don't upgrade after the trial?", a: "Your shop pauses — nothing is deleted. Come back any month and switch it on." },
  { q: "Are there hidden fees or commissions on my sales?", a: "No. We never take a cut of your orders. The monthly plan is the entire price." },
  { q: "Can I change plans later?", a: "Any time. Upgrade when you need more products; the change applies immediately." },
];

export default async function PricingPage() {
  let foundingLeft = 100;
  try {
    const shops = await listAllShops();
    const paying = shops.filter((s) => s.plan !== "trial" && s.subscriptionStatus === "active" && s.planExpiresAt && new Date(s.planExpiresAt).getTime() > Date.now()).length;
    foundingLeft = Math.max(0, 100 - paying);
  } catch { /* default */ }

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">Pricing that respects your hustle</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
          Free 14-day trial on every plan. No card. No commission on your sales — ever. Every feature is on every plan;
          you only pay for size.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {PLAN_TIERS.filter((t) => t !== "trial").map((t) => (
          <div key={t} className={"reveal lift relative rounded-3xl border bg-surface p-8 " + (t === "pro" ? "border-2 border-primary shadow-xl" : "border-line")}>
            {t === "pro" && (
              <p className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground">MOST POPULAR</p>
            )}
            <p className="text-sm font-semibold text-muted">{PLAN_LABEL[t]}</p>
            <p className="mt-2 text-4xl font-bold text-ink">
              Rs {PLAN_PRICE_PKR[t].toLocaleString()}
              <span className="text-sm font-normal text-muted">/month</span>
            </p>
            <p className="mt-1 text-xs text-muted">
              {t === "basic" ? "For your first serious months" : t === "pro" ? "For shops with steady orders" : "For big catalogs & teams"}
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-ink">
              <li>✓ {limitLabel(PLAN_LIMITS[t].products)} products</li>
              <li>✓ {limitLabel(PLAN_LIMITS[t].categories)} categories</li>
              <li>✓ Unlimited orders — no commission</li>
              <li>✓ Fake-order protection</li>
              <li>✓ Khata profit books</li>
              <li>✓ Bazaar listing (once verified)</li>
              <li>✓ Referrals, resellers, share cards</li>
              <li>✓ Up to 5 staff logins</li>
            </ul>
            <Link
              href={`/signup?src=pricing-${t}`}
              className={"mt-7 block rounded-xl py-3.5 text-center text-sm font-semibold transition " + (t === "pro" ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-line text-ink hover:border-primary")}
            >
              Start 14-day free trial
            </Link>
          </div>
        ))}
      </div>

      {foundingLeft > 0 && (
        <div className="reveal mx-auto mt-10 max-w-2xl rounded-3xl border-2 border-[#E7C98A] bg-[#FBF7EC] p-6 text-center">
          <p className="text-base font-bold text-ink">🏆 Founding members: Basic at Rs 1,999/month — for life</p>
          <p className="mt-1 text-sm text-muted">For the first 100 paying shops. {foundingLeft} spots left.</p>
        </div>
      )}

      <section className="mx-auto mt-16 max-w-2xl">
        <h2 className="reveal text-center text-xl font-bold text-ink">Billing, honestly</h2>
        <div className="mt-6 space-y-3">
          {BILLING_FAQ.map((f) => (
            <details key={f.q} className="reveal group rounded-2xl border border-line bg-surface p-5">
              <summary className="cursor-pointer list-none text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {f.q} <span className="float-right text-muted transition group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="reveal mt-8 text-center text-sm text-muted">
          Not sure which plan? <Link href="/contact" className="font-medium text-primary hover:underline">Ask a human →</Link>
        </p>
      </section>
    </main>
  );
}
