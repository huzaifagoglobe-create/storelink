import { requireAdmin } from "@/server/auth/current-admin";
import { signOutAction } from "@/server/actions/auth-actions";
import { AdminNav } from "@/components/admin/nav";

import type { Metadata } from "next";

// Private area: robots.txt already blocks crawling — this makes sure the page
// can never be indexed even if a URL is linked from somewhere else.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-ink text-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Admin · Platform</p>
            <p className="truncate text-xs text-[#9DB0A8]">{admin.email}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-[#3a4742] px-3 py-1.5 text-sm text-white hover:bg-[#2c3833]"
            >
              Sign out
            </button>
          </form>
        </div>
        <div className="mx-auto min-w-0 max-w-5xl overflow-hidden px-4 pb-3">
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
