import { latestAnnouncement } from "@/server/services/announcement-service";
import { AnnouncementBanner } from "@/components/dashboard/announcement-banner";
import Link from "next/link";
import { requireSeller } from "@/server/auth/current-seller";
import { signOutAction } from "@/server/actions/auth-actions";
import { DashboardNav } from "@/components/dashboard/nav";
import { NewOrderPing } from "@/components/dashboard/new-order-ping";
import { trialDaysLeft } from "@/server/plans";
import { VerifyEmailBanner } from "@/components/dashboard/verify-email-banner";
import { SubscriptionGate } from "@/components/dashboard/subscription-gate";
import { shopHasAccess } from "@/server/billing";

function BagMark() {
  return (
    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    </span>
  );
}

import type { Metadata } from "next";

// Private area: robots.txt already blocks crawling — this makes sure the page
// can never be indexed even if a URL is linked from somewhere else.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, shop, isOwner } = await requireSeller();
  const announcement = await latestAnnouncement();

  // Manual-billing gate (off by default). Shows only when enabled AND the shop
  // is pending/paused — otherwise the dashboard renders exactly as before.
  if (!shopHasAccess(shop)) {
    return <SubscriptionGate shop={shop} />;
  }

  const daysLeft = trialDaysLeft(shop.plan, shop.trialEndsAt);

  const shopChip = (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-primary text-sm font-semibold uppercase text-primary-foreground">
        {shop.name.slice(0, 1)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold leading-tight text-ink">{shop.name}</p>
        {!isOwner && <p className="text-[10px] font-medium text-muted">Staff account</p>}
        <p className="flex items-center gap-1 text-xs text-muted">
          <span className={`h-1.5 w-1.5 rounded-full ${shop.isActive ? "bg-primary" : "bg-muted"}`} />
          {shop.isActive ? "Live" : "Paused"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur md:hidden print:!hidden">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          {shopChip}
          <div className="flex flex-none items-center gap-2">
            <Link href={`/${shop.slug}`} target="_blank" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary">
              View ↗
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="rounded-lg border border-line px-2.5 py-1.5 text-sm text-ink">Sign out</button>
            </form>
          </div>
        </div>
        <div className="px-3 pb-2.5">
          <DashboardNav variant="horizontal" isOwner={isOwner} />
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line bg-surface md:flex print:!hidden">
        <div className="flex h-16 flex-none items-center gap-2 border-b border-line px-5">
          <BagMark />
          <span className="font-semibold text-ink">StoreLink</span>
        </div>
        <div className="flex-none border-b border-line px-4 py-4">{shopChip}</div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <DashboardNav variant="vertical" isOwner={isOwner} />
        </div>
        <div className="flex-none border-t border-line p-3">
          <Link
            href={`/${shop.slug}`}
            target="_blank"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-primary transition hover:bg-[#eef3f0]"
          >
            View your store <span aria-hidden>↗</span>
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink transition hover:bg-[#eef3f0]"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Content */}
      <div className="md:pl-60 print:!pl-0">
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:px-8 md:py-8 print:!p-0 print:!pl-0">
          {announcement && <AnnouncementBanner id={announcement.id} message={announcement.message} />}
          {!user.emailVerifiedAt && <VerifyEmailBanner email={user.email} />}
          {isOwner && daysLeft !== null && (
            daysLeft > 0 ? (
              <Link href="/dashboard/plan" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#E7D9A8] bg-[#FBF7EC] px-4 py-2.5 text-sm text-[#7a5a16] hover:bg-[#f7efdd]">
                <span>Free trial — <b>{daysLeft} day{daysLeft === 1 ? "" : "s"} left</b>. Upgrade to keep your shop running.</span>
                <span className="font-semibold text-primary">Upgrade →</span>
              </Link>
            ) : (
              <Link href="/dashboard/plan" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#E7B8B2] bg-[#FBECEA] px-4 py-2.5 text-sm text-[#8a2c22] hover:bg-[#f7e0dd]">
                <span>Your free trial has <b>ended</b>. Upgrade to add products and unlock features.</span>
                <span className="font-semibold text-primary">Upgrade →</span>
              </Link>
            )
          )}
          {children}
        </main>
      </div>
      <NewOrderPing />
    </div>
  );
}
