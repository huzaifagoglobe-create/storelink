import Link from "next/link";
import { signOutAction } from "@/server/actions/auth-actions";
import { supportLink } from "@/lib/site";
import { effectiveSubscriptionStatus } from "@/server/billing";
import type { Shop } from "@/server/types";

export function SubscriptionGate({ shop }: { shop: Shop }) {
  const status = effectiveSubscriptionStatus(shop);
  const paused = status === "paused";

  const heading = paused ? "Your subscription has ended" : "One step left — activate your shop";
  const body = paused
    ? "Your plan period is over, so your shop is paused. Your products and orders are all safe. Send your renewal payment to switch it back on."
    : "Your shop is ready. To go live, message us on WhatsApp to complete your payment — we'll activate your dashboard as soon as it's received.";

  const waMessage = `Hi StoreLink team, I'd like to ${paused ? "renew" : "activate"} my shop "${shop.name}". Please share the payment details.`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-7 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
          </svg>
        </span>
        <h1 className="mt-4 text-lg font-semibold text-ink">{heading}</h1>
        <p className="mt-2 text-sm text-muted">{body}</p>
        <p className="mt-3 text-xs text-muted">Shop: <span className="font-medium text-ink">{shop.name}</span></p>

        <a
          href={supportLink(waMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2Zm5.1 14.2c-.2.6-1.2 1.1-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.5-2.6-1.1-4.3-3.8-4.5-4-.1-.2-1-1.4-1-2.6s.6-1.9.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.7 1.8c.1.2.1.3 0 .5l-.3.5-.3.3c-.1.1-.2.3-.1.5.1.2.5.9 1.1 1.4.8.7 1.4.9 1.6 1 .2.1.3.1.5-.1l.6-.7c.2-.2.3-.2.5-.1l1.7.8c.2.1.4.2.5.3.1.3.1.7-.1 1.3Z" /></svg>
          Message us on WhatsApp
        </a>

        <Link href="/dashboard" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
          I&apos;ve paid — refresh
        </Link>

        <form action={signOutAction} className="mt-6 border-t border-line pt-4">
          <button type="submit" className="text-xs text-muted hover:text-ink">Sign out</button>
        </form>
      </div>
    </div>
  );
}
