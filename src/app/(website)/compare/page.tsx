import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "StoreLink vs Dukan vs Instagram-only — honest comparison for Pakistani sellers",
  description:
    "Choosing how to sell online in Pakistan? An honest side-by-side of StoreLink, Dukan, and selling from Instagram DMs only — features, pricing approach, and who each is right for.",
};

const ROWS: { label: string; ig: string; dukan: string; sl: string }[] = [
  { label: "Your own shop link & storefront", ig: "✗", dukan: "✓", sl: "✓ (10 designs)" },
  { label: "Cash on Delivery orders with tracking", ig: "manual", dukan: "✓", sl: "✓" },
  { label: "Protection from fake COD orders", ig: "✗", dukan: "✗", sl: "✓ buyer history across all shops" },
  { label: "Brings you buyers (directory + Google pages)", ig: "✗", dukan: "✗", sl: "✓ Bazaar + landing pages" },
  { label: "Referral rewards (buyers bring buyers)", ig: "✗", dukan: "✗", sl: "✓ built in" },
  { label: "Reseller network with commission tracking", ig: "✗", dukan: "✗", sl: "✓" },
  { label: "Real profit books (khata)", ig: "✗", dukan: "basic ledger", sl: "✓ sales − costs − expenses" },
  { label: "Paste a WhatsApp order → done", ig: "—", dukan: "manual form", sl: "✓ auto-reads details" },
  { label: "Share cards + ready captions", ig: "✗", dukan: "✗", sl: "✓ one tap" },
  { label: "Wallet / card payments infrastructure", ig: "✗", dukan: "✓ (their strength)", sl: "gateway-ready, COD-first" },
  { label: "Staff logins without sharing your password", ig: "✗", dukan: "✓", sl: "✓" },
];

/**
 * Honest by design: we say plainly where each option is fine. Prospects trust
 * a comparison that concedes points — and this page targets exactly what they
 * Google before choosing.
 */
export default function ComparePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">StoreLink vs Dukan vs Instagram-only</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        The honest version. Instagram DMs are free and fine for your first orders. Dukan is strong on payments
        infrastructure. StoreLink is built to <b>bring you buyers and protect your cash</b>. Here&apos;s the
        side-by-side:
      </p>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[640px] bg-surface text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-medium text-muted">What you get</th>
              <th className="px-4 py-3 font-medium text-muted">Instagram only</th>
              <th className="px-4 py-3 font-medium text-muted">Dukan</th>
              <th className="px-4 py-3 font-semibold text-primary">StoreLink</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-ink">{r.label}</td>
                <td className="px-4 py-3 text-muted">{r.ig}</td>
                <td className="px-4 py-3 text-muted">{r.dukan}</td>
                <td className="px-4 py-3 font-medium text-ink">{r.sl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-sm font-semibold text-ink">Stay on Instagram if…</p>
          <p className="mt-1 text-sm text-muted">You get a handful of orders a month and DMs are manageable. Genuinely — you may not need a tool yet.</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-sm font-semibold text-ink">Consider Dukan if…</p>
          <p className="mt-1 text-sm text-muted">Card payments, wallets and QR settlements are your main need — payments infrastructure is their strength.</p>
        </div>
        <div className="rounded-2xl border-2 border-primary/40 bg-surface p-5">
          <p className="text-sm font-semibold text-ink">Choose StoreLink if…</p>
          <p className="mt-1 text-sm text-muted">You want more orders (Bazaar, referrals, resellers, Google), protection from fake COD, and real profit books — in a dashboard your khala could use.</p>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link href="/signup?src=compare" className="inline-block rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground">
          Try StoreLink free →
        </Link>
        <p className="mt-2 text-xs text-muted">14-day free trial · no card needed · your data stays yours</p>
      </div>
    </div>
  );
}
