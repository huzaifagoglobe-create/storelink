"use client";

import { useEffect, useState } from "react";

/** Platform announcement banner — dismiss remembered per announcement. */
export function AnnouncementBanner({ id, message }: { id: string; message: string }) {
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    try {
      setHidden(localStorage.getItem(`wsb-ann-${id}`) === "1");
    } catch {
      setHidden(false);
    }
  }, [id]);
  if (hidden) return null;
  return (
    <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-[#bfd7ea] bg-[#EAF3FB] px-4 py-2.5 text-sm text-[#1f4f86]">
      <p className="min-w-0">{message}</p>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          try {
            localStorage.setItem(`wsb-ann-${id}`, "1");
          } catch {
            /* ignore */
          }
          setHidden(true);
        }}
        className="flex-none text-lg leading-none opacity-60 hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}
