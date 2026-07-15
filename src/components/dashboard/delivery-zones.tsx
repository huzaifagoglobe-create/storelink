"use client";

import { useState } from "react";
import type { DeliveryZone } from "@/server/types";
import { inputClass } from "./field";

type Row = { city: string; fee: string };

export function DeliveryZones({ initial }: { initial: DeliveryZone[] }) {
  const [rows, setRows] = useState<Row[]>(
    (Array.isArray(initial) ? initial : []).map((z) => ({
      city: String(z?.city ?? ""),
      fee: String(z?.fee ?? 0),
    }))
  );

  const setCity = (i: number, value: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, city: value } : r)));
  const setFee = (i: number, value: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, fee: value.replace(/[^\d]/g, "") } : r)));
  const add = () => setRows((rs) => [...rs, { city: "", fee: "" }]);
  const remove = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const clean = rows
    .map((r) => ({ city: r.city.trim(), fee: Math.max(0, Math.round(Number(r.fee) || 0)) }))
    .filter((z) => z.city);

  return (
    <div>
      <input type="hidden" name="deliveryZones" value={JSON.stringify(clean)} />
      <div className="space-y-2">
        {rows.length === 0 && (
          <p className="text-xs text-muted">
            No city rates yet. Your flat delivery fee applies everywhere.
          </p>
        )}
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              className={inputClass + " flex-1"}
              placeholder="City (e.g. Karachi)"
              value={r.city}
              onChange={(e) => setCity(i, e.target.value)}
            />
            <input
              type="text"
              inputMode="numeric"
              className={inputClass + " w-28"}
              placeholder="Fee (Rs)"
              value={r.fee}
              onChange={(e) => setFee(i, e.target.value)}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="flex-none rounded-lg px-2.5 py-2 text-sm text-[#C0362C] transition hover:bg-[#FBECEA]"
              aria-label="Remove city"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-primary"
      >
        + Add city rate
      </button>
    </div>
  );
}
