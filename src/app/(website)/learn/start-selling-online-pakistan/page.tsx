import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to start selling online in Pakistan (2026 guide) | StoreLink",
  description: "The complete beginner's guide: what to sell, how to take COD orders, couriers, pricing, and your first 10 customers.",
};

export default function GuidePage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/learn" className="text-xs text-muted hover:text-primary">← All guides</Link>
      <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">How to start selling online in Pakistan (2026 guide)</h1>
      <div className="mt-8 space-y-7">
        <section>
          <h2 className="text-lg font-semibold text-ink">Start with what you can actually get</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">Don&apos;t hunt for a &apos;winning product&apos; on YouTube. Start with what you can source reliably this week — your own stitching, a wholesaler you know in your city&apos;s market, or a family recipe. Reliability beats novelty: the seller who can restock wins over the seller with one viral item they can&apos;t get again.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Price it honestly, with delivery in mind</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">Take your cost, add your profit, then remember delivery. Most Pakistani buyers expect delivery charges under Rs 300 or free delivery above a certain amount. Many successful sellers set &apos;free delivery over Rs 3,000&apos; — it pushes people to add one more item.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Cash on Delivery is not optional</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">Around 90% of Pakistani online orders are COD. Buyers simply don&apos;t trust prepayment from a new shop — and they&apos;re right to be careful. Accept COD from day one, and protect yourself: confirm every order on WhatsApp before booking the courier. One confirmation message cuts refused parcels dramatically.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Pick a courier that covers your cities</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">PostEx, Trax, Leopards, and TCS all serve small sellers. Compare per-parcel rates for YOUR main cities, ask about return charges (that&apos;s where money leaks), and start with one courier — you can add more later.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Your first 10 customers are people you know</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">Post in your family and friends WhatsApp groups first. Their orders give you practice runs, your first reviews, and honest feedback while the stakes are low. Then move to Instagram and Facebook groups for your niche.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Get a real shop link early</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">Selling only from DMs works until it doesn&apos;t — orders in screenshots, no records, no trust signal. A proper shop link (with your products, prices and a return policy written down) makes buyers noticeably more comfortable ordering from someone new.</p>
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
