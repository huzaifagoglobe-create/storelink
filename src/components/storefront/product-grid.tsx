"use client";

import { useEffect, useState, type ReactNode } from "react";

const GRID: Record<string, string> = {
  g2: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5",
  g2gap: "grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-5",
  list: "grid grid-cols-1 gap-2.5 lg:grid-cols-2 lg:gap-x-4 lg:gap-y-3",
};

export function ProductGrid({
  cards,
  layout,
}: {
  cards: ReactNode[];
  layout: "g2" | "g2gap" | "list";
}) {
  // Mobile-first default; bumped on the client once we know the viewport.
  const [batch, setBatch] = useState(6);
  const [visible, setVisible] = useState(6);

  useEffect(() => {
    const n = window.matchMedia("(min-width: 1024px)").matches
      ? 10
      : window.matchMedia("(min-width: 640px)").matches
        ? 9
        : 6;
    setBatch(n);
    setVisible((v) => Math.max(v, n));
  }, []);

  const shown = cards.slice(0, visible);
  const remaining = cards.length - visible;

  return (
    <div>
      <div className={GRID[layout]}>{shown}</div>
      {remaining > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + batch)}
            className="rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-primary"
          >
            Load more ({remaining} more)
          </button>
        </div>
      )}
    </div>
  );
}
