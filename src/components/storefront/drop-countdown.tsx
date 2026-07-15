"use client";

import { useEffect, useState } from "react";

function remaining(at: string): string | null {
  const ms = new Date(at).getTime() - Date.now();
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/**
 * Live-drop countdown. Ticks every second; when it hits zero it prompts a
 * refresh so the buyer can order the moment the product unlocks.
 */
export function DropCountdown({ dropAt, big = false }: { dropAt: string; big?: boolean }) {
  const [left, setLeft] = useState<string | null>(() => remaining(dropAt));
  useEffect(() => {
    const t = setInterval(() => setLeft(remaining(dropAt)), 1000);
    return () => clearInterval(t);
  }, [dropAt]);
  if (!left)
    return (
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        It&apos;s live — tap to shop 🎉
      </button>
    );
  return (
    <span
      className={
        "inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-1.5 font-mono tabular-nums text-white " +
        (big ? "text-lg" : "text-sm")
      }
    >
      ⏳ {left}
    </span>
  );
}
