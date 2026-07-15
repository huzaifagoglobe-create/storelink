import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Selling on Instagram in Pakistan: what actually works | StoreLink",
  description: "Posting frequency, captions, reels, and turning followers into COD orders — the practical version.",
};

export default function GuidePage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/learn" className="text-xs text-muted hover:text-primary">← All guides</Link>
      <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">Selling on Instagram in Pakistan: what actually works</h1>
      <div className="mt-8 space-y-7">
        <section>
          <h2 className="text-lg font-semibold text-ink">Consistency beats quality</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">One decent post daily beats one perfect post weekly. The algorithm rewards showing up, and buyers need to see a product several times before ordering. Batch your photos on Sunday and you have a week of content.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Captions sell, hashtags find</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">A good caption is: what it is, the price, &apos;Cash on Delivery all over Pakistan&apos;, and how to order. Don&apos;t hide the price — &apos;DM for price&apos; loses more buyers than it creates. Add 4-5 relevant hashtags; thirty tags looks desperate and does nothing.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Reels of the real product</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">A 10-second video of the actual product — fabric moving, the item in hand — outperforms studio photos for trust. Buyers have been burned by pictures that don&apos;t match reality; motion is proof.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Answer DMs fast, then move to WhatsApp</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">Reply within the hour if you can — buying mood evaporates. Then move the conversation to WhatsApp where the order actually happens, and where you can send your shop link with all products and prices.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Stories are for showing you&apos;re real</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">Post packing videos, delivery confirmations, and buyer thank-you messages (with permission) to stories. Nothing converts fence-sitters like watching real parcels go out every day.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Give them one link that does everything</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">Your bio link should show every product, price, and a working order button — not a linktree of dead ends. When someone taps from a reel at midnight, the shop should take the order without you being awake.</p>
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
