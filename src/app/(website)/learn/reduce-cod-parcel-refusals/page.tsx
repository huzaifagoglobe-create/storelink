import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to reduce COD parcel refusals (Pakistani seller&apos;s guide) | StoreLink",
  description: "Refused parcels cost you courier fees both ways. Field-tested ways Pakistani sellers cut refusal rates.",
};

export default function GuidePage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/learn" className="text-xs text-muted hover:text-primary">← All guides</Link>
      <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">How to reduce COD parcel refusals (Pakistani seller&apos;s guide)</h1>
      <div className="mt-8 space-y-7">
        <section>
          <h2 className="text-lg font-semibold text-ink">Know what a refusal really costs</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">When a buyer refuses at the door, you pay courier charges both directions, your product travels for two weeks, and sometimes it comes back damaged. At a 15% refusal rate with 150 orders a month, that&apos;s easily Rs 40,000+ a year in pure courier losses — before counting damaged stock.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Confirm on WhatsApp before booking</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">The single biggest fix. A short message — &apos;Assalam o Alaikum! Confirming your order #123, total Rs 2,500 cash on delivery, delivering to [address]. Reply YES to confirm&apos; — filters out the impulse orders and prank orders before you spend a rupee on shipping.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Send the tracking link</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">Buyers refuse parcels they forgot they ordered. A tracking link at booking plus a &apos;your parcel is arriving today&apos; message keeps the order alive in their mind and someone at home to receive it.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Watch for repeat refusers</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">Some phone numbers refuse parcels again and again across many shops. Keep your own record of refusals — or use a platform that tracks buyer delivery history across all its shops and warns you on the order before you ship.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Call for big orders</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">For anything above your average order value, a 30-second phone call beats a text. It confirms the order AND the address, and buyers who answer a call almost never refuse.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Make your address field work harder</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">Half of &apos;refusals&apos; are actually failed deliveries: wrong sector, missing house number. Ask for landmark + phone number of an alternate person for areas your courier finds tricky.</p>
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
