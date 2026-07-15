"use client";

import { useState } from "react";

/** "📏 Size chart" button → full-screen popup with the seller's chart image. */
export function SizeChartButton({ url, productName }: { url: string; productName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:border-primary"
      >
        📏 Size chart
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Size chart for ${productName}`}
        >
          <div className="relative max-h-[85vh] max-w-lg overflow-auto rounded-2xl bg-white p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">Size chart — {productName}</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-full px-2 py-0.5 text-lg text-muted hover:text-ink">
                ×
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- seller-uploaded chart, natural size */}
            <img src={url} alt={`Size chart for ${productName}`} className="w-full rounded-lg" />
          </div>
        </div>
      )}
    </>
  );
}
