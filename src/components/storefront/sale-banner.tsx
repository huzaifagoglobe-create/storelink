"use client";

import { useEffect, useState } from "react";

function remaining(endsAt: string): string | null {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** Storefront flash-sale strip with a live countdown. Hides itself at zero. */
export function SaleBanner({ percent, endsAt }: { percent: number; endsAt: string }) {
  const [left, setLeft] = useState<string | null>(() => remaining(endsAt));
  useEffect(() => {
    const t = setInterval(() => setLeft(remaining(endsAt)), 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  if (!left) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl bg-ink px-4 py-2.5 text-center text-sm font-medium text-white">
      <span>🔥 FLASH SALE — {percent}% OFF everything</span>
      <span className="rounded-lg bg-white/15 px-2 py-0.5 font-mono text-xs tabular-nums">ends in {left}</span>
    </div>
  );
}
