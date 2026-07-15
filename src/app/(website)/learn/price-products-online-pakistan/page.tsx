import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to price your products for online selling in Pakistan | StoreLink",
  description: "Costing, delivery charges, discounts and festival pricing — without accidentally selling at a loss.",
};

export default function GuidePage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/learn" className="text-xs text-muted hover:text-primary">← All guides</Link>
      <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">How to price your products for online selling in Pakistan</h1>
      <div className="mt-8 space-y-7">
        <section>
          <h2 className="text-lg font-semibold text-ink">Know your REAL cost first</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">Product cost + packaging + your delivery subsidy + a share of refused parcels. If a parcel costs Rs 250 to ship and 1 in 10 gets refused, every delivered order silently carries ~Rs 50 of refusal cost. Most sellers who &apos;can&apos;t figure out where the money goes&apos; skipped this step.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Price for profit, not for busy</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">Rs 200 profit per order × 100 orders is worse than Rs 500 × 60 — less packing, fewer parcels to chase, fewer refusals. Aim for margin you can defend; being the cheapest is a race someone else always wins.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Use compare-at prices honestly</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">&apos;Rs 3,499 ~~Rs 4,200~~&apos; works because it anchors value — but only if the old price was real. Fake discounts get noticed in comments and destroy the trust you&apos;re building.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Festival pricing goes UP in value, not always down in price</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">Eid and shaadi season buyers pay for certainty: gift-ready packaging, guaranteed delivery before the date, bundles. A &apos;Chand Raat delivery guaranteed&apos; badge is worth more than a 10% discount.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Track profit per month, not per order</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">Sales minus product costs minus expenses (packaging, courier, ads) — monthly. A simple khata tells you if the business actually made money; feelings will lie to you either way.</p>
        </section>
      </div>
      <div className="mt-12 rounded-2xl border border-line bg-surface p-6 text-center">
        <p className="text-base font-semibold text-ink">Ready to put this into practice?</p>
        <p className="mt-1 text-sm text-muted">StoreLink gives you the shop, COD orders, fake-order protection and profit books — free to start.</p>
        <Link href="/signup?src=learn" className="mt-4 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
          Start your shop free →
        </Link>
      </div>
    </article>
  );
}
