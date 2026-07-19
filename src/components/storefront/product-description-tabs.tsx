"use client";

import { useState } from "react";

/**
 * Shows the short pitch and, when the seller wrote one, a longer write-up in a
 * second tab.
 *
 * Both bodies are rendered into the page (the inactive one is just hidden with
 * CSS) for two reasons: Google reads the full text either way, and if the
 * seller's long description is the thing that ranks, hiding it behind a click
 * would waste it.
 */
export function ProductDescriptionTabs({
  description,
  longDescription,
  detailsLabel = "Details",
  fullLabel = "Full description",
}: {
  description: string | null;
  longDescription: string | null;
  detailsLabel?: string;
  fullLabel?: string;
}) {
  const [tab, setTab] = useState<"short" | "long">("short");
  const hasShort = Boolean(description?.trim());
  const hasLong = Boolean(longDescription?.trim());
  if (!hasShort && !hasLong) return null;

  // Only one body? No tabs — a single tab is just noise.
  if (!hasLong) {
    return (
      <div
        className="prose-storefront text-sm leading-relaxed text-ink"
        dangerouslySetInnerHTML={{ __html: description ?? "" }}
      />
    );
  }
  if (!hasShort) {
    return (
      <div
        className="prose-storefront text-sm leading-relaxed text-ink"
        dangerouslySetInnerHTML={{ __html: longDescription ?? "" }}
      />
    );
  }

  const tabClass = (active: boolean) =>
    "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition " +
    (active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink");

  return (
    <div>
      <div className="flex gap-1 rounded-xl bg-[#f1efeb] p-1" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "short"} onClick={() => setTab("short")} className={tabClass(tab === "short")}>
          {detailsLabel}
        </button>
        <button type="button" role="tab" aria-selected={tab === "long"} onClick={() => setTab("long")} className={tabClass(tab === "long")}>
          {fullLabel}
        </button>
      </div>
      <div
        role="tabpanel"
        hidden={tab !== "short"}
        className="prose-storefront mt-3 text-sm leading-relaxed text-ink"
        dangerouslySetInnerHTML={{ __html: description ?? "" }}
      />
      <div
        role="tabpanel"
        hidden={tab !== "long"}
        className="prose-storefront mt-3 text-sm leading-relaxed text-ink"
        dangerouslySetInnerHTML={{ __html: longDescription ?? "" }}
      />
    </div>
  );
}
