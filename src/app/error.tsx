"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-lg font-semibold text-ink">Something went wrong</h1>
      <p className="mt-1 max-w-sm text-sm text-muted">
        An unexpected error occurred. Please try again.
      </p>
      <div className="mt-5 flex gap-2">
        <button onClick={reset} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">
          Try again
        </button>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- intentional:
            a full page reload, not client-side nav, is the safer recovery path from
            a crashed render tree (client nav could re-hit the same broken state). */}
        <a href="/" className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-[#eef3f0]">
          Homepage
        </a>
      </div>
    </main>
  );
}
