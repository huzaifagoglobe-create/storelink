"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const PRESETS: [string, string][] = [
  ["1", "1 day"],
  ["3", "3 days"],
  ["7", "7 days"],
  ["10", "10 days"],
  ["30", "30 days"],
  ["all", "All time"],
];

export function ReportRange({ activeKey }: { activeKey: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [from, setFrom] = useState(sp.get("from") ?? "");
  const [to, setTo] = useState(sp.get("to") ?? "");

  const go = (range: string) =>
    router.push(range === "all" ? "/dashboard/reports" : `/dashboard/reports?range=${range}`);
  const goCustom = () => {
    if (from || to) router.push(`/dashboard/reports?from=${from}&to=${to}`);
  };
  const qs = sp.toString();

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => go(k)}
            className={
              "rounded-lg px-3 py-1.5 text-xs font-medium transition " +
              (activeKey === k
                ? "bg-primary text-primary-foreground"
                : "border border-line bg-surface text-muted hover:border-primary")
            }
          >
            {l}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-muted">
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-line px-2 py-1 text-xs text-ink" />
        </label>
        <label className="flex items-center gap-1 text-xs text-muted">
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-line px-2 py-1 text-xs text-ink" />
        </label>
        <button type="button" onClick={goCustom} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-primary">
          Apply
        </button>
        <a
          href={`/dashboard/reports/export${qs ? `?${qs}` : ""}`}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
        >
          ↓ Download CSV
        </a>
      </div>
    </div>
  );
}
