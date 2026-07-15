import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn — free guides for Pakistani online sellers | StoreLink",
  description: "Honest, practical guides: starting out, COD refusals, Instagram selling, and pricing — written for Pakistani sellers.",
};

const GUIDES = [
  { slug: "start-selling-online-pakistan", title: "How to start selling online in Pakistan", blurb: "What to sell, COD, couriers, and your first 10 customers." },
  { slug: "reduce-cod-parcel-refusals", title: "How to reduce COD parcel refusals", blurb: "Refused parcels cost you twice — field-tested fixes." },
  { slug: "instagram-selling-tips-pakistan", title: "Selling on Instagram: what actually works", blurb: "Posting, captions, reels, and turning DMs into orders." },
  { slug: "price-products-online-pakistan", title: "How to price your products", blurb: "Costing, delivery, discounts — without selling at a loss." },
];

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">Learn to sell online</h1>
      <p className="mt-1 text-sm text-muted">Free, honest guides for Pakistani sellers — no fluff, no fake gurus.</p>
      <div className="mt-8 space-y-4">
        {GUIDES.map((g) => (
          <Link key={g.slug} href={`/learn/${g.slug}`} className="block rounded-2xl border border-line bg-surface p-5 transition hover:border-primary">
            <p className="text-base font-semibold text-ink">{g.title}</p>
            <p className="mt-1 text-sm text-muted">{g.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
