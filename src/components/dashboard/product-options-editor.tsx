"use client";

import { useState } from "react";
import type { ProductOption } from "@/server/types";
import { inputClass } from "./field";

type Row = { name: string; values: string };

function buildCombos(options: { name: string; values: string[] }[]): string[] {
  if (options.length === 0) return [];
  let acc: string[][] = [[]];
  for (const o of options) {
    const next: string[][] = [];
    for (const combo of acc) for (const v of o.values) next.push([...combo, `${o.name}: ${v}`]);
    acc = next;
  }
  return acc.map((parts) => parts.join(" / "));
}

export function ProductOptionsEditor({
  initial,
  initialVariantStock,
}: {
  initial: ProductOption[];
  initialVariantStock?: Record<string, number> | null;
}) {
  const [rows, setRows] = useState<Row[]>(
    (initial ?? []).map((o) => ({ name: o.name, values: o.values.join(", ") }))
  );
  const [stockMap, setStockMap] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(initialVariantStock ?? {}).map(([k, v]) => [k, String(v)]))
  );

  const update = (i: number, key: keyof Row, value: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  const addPreset = (name: string, values: string) =>
    setRows((rs) => (rs.some((r) => r.name.toLowerCase() === name.toLowerCase()) ? rs : [...rs, { name, values }]));
  const add = () => setRows((rs) => [...rs, { name: "", values: "" }]);
  const remove = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const options = rows
    .map((r) => ({
      name: r.name.trim(),
      values: r.values.split(",").map((v) => v.trim()).filter(Boolean),
    }))
    .filter((o) => o.name && o.values.length > 0);

  const combos = buildCombos(options);
  const tooMany = combos.length > 60;

  const variantStockOut: Record<string, number> = {};
  if (!tooMany) {
    for (const key of combos) {
      const raw = stockMap[key];
      const n = Math.floor(Number(raw));
      if (raw !== undefined && raw !== "" && Number.isFinite(n) && n >= 0) variantStockOut[key] = n;
    }
  }

  return (
    <div>
      <input type="hidden" name="options" value={JSON.stringify(options)} />
      <input
        type="hidden"
        name="variantStock"
        value={Object.keys(variantStockOut).length ? JSON.stringify(variantStockOut) : ""}
      />

      {rows.length === 0 && (
        <div className="rounded-xl bg-[#f3f7f4] p-3">
          <p className="text-sm font-medium text-ink">Does this product come in sizes or colours?</p>
          <p className="mb-2 text-xs text-muted">
            Tap a button and we&apos;ll set it up — buyers will pick from these on the product page. You can edit
            everything after.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => addPreset("Size", "S, M, L, XL")} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink transition hover:border-primary">
              + Sizes (S, M, L, XL)
            </button>
            <button type="button" onClick={() => addPreset("Colour", "Black, White")} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink transition hover:border-primary">
              + Colours
            </button>
            <button type="button" onClick={add} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink transition hover:border-primary">
              + Something else
            </button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="rounded-xl border border-line p-3">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted">What is it? (e.g. Size, Colour)</label>
                <input className={inputClass + " mt-0.5"} placeholder="Size" value={r.name} onChange={(e) => update(i, "name", e.target.value)} />
              </div>
              <button type="button" onClick={() => remove(i)} className="mt-4 rounded-lg px-2.5 py-2 text-sm text-[#C0362C] transition hover:bg-[#FBECEA]" aria-label="Remove option">✕</button>
            </div>
            <div className="mt-2">
              <label className="text-xs text-muted">The choices, separated by commas</label>
              <input className={inputClass + " mt-0.5"} placeholder="S, M, L, XL" value={r.values} onChange={(e) => update(i, "values", e.target.value)} />
            </div>
          </div>
        ))}
      </div>
      {rows.length > 0 && (
        <button type="button" onClick={add} className="mt-2 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-primary">
          + Add another (e.g. Colour)
        </button>
      )}

      {combos.length > 0 && !tooMany && (
        <div className="mt-4 rounded-xl border border-line p-3">
          <p className="text-sm font-medium text-ink">How many pieces do you have of each?</p>
          <p className="mb-2 text-xs text-muted">
            Fill these in and StoreLink handles the rest: a choice automatically shows <b>“out of stock”</b> when it
            hits 0, and buyers see <b>“only X left”</b> when it drops under 10. Leave blank to just use the total
            stock above.
          </p>
          <div className="space-y-1.5">
            {combos.map((key) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{key}</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="—"
                  value={stockMap[key] ?? ""}
                  onChange={(e) => setStockMap((m) => ({ ...m, [key]: e.target.value }))}
                  className="w-20 rounded-lg border border-line px-2 py-1.5 text-center text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {tooMany && (
        <p className="mt-3 text-xs text-muted">Too many variant combinations for per-variant stock. Using the total stock above.</p>
      )}
    </div>
  );
}
