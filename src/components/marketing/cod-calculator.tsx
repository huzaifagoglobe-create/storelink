"use client";

import { useState } from "react";
import Link from "next/link";

/** The lead magnet: turns the market's #1 pain into a number they can't unsee. */
export function CodCalculator() {
  const [orders, setOrders] = useState(150);
  const [refusal, setRefusal] = useState(15);
  const [courier, setCourier] = useState(250);

  const refusedPerMonth = Math.round((orders * refusal) / 100);
  // Honest math: refused parcel ≈ courier fee both ways (most couriers charge
  // return shipping) + packaging. We count 2× courier only — conservative.
  const monthlyLoss = refusedPerMonth * courier * 2;
  const yearlyLoss = monthlyLoss * 12;

  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        {[
          { label: "Orders per month", value: orders, set: setOrders, min: 10, max: 2000, step: 10, suffix: "orders" },
          { label: "How many get refused at the door? (%)", value: refusal, set: setRefusal, min: 0, max: 50, step: 1, suffix: "%" },
          { label: "Courier fee per parcel (Rs)", value: courier, set: setCourier, min: 100, max: 600, step: 10, suffix: "Rs" },
        ].map((f) => (
          <div key={f.label}>
            <div className="flex items-center justify-between text-sm">
              <label className="text-ink">{f.label}</label>
              <span className="font-semibold text-ink">
                {f.value.toLocaleString()} {f.suffix === "%" ? "%" : ""}
              </span>
            </div>
            <input
              type="range"
              min={f.min}
              max={f.max}
              step={f.step}
              value={f.value}
              onChange={(e) => f.set(Number(e.target.value))}
              className="mt-2 w-full accent-[#43705F]"
            />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-[#C0362C]/30 bg-[#FBECEA] p-6 text-center">
        <p className="text-sm text-muted">Fake & refused orders are costing you about</p>
        <p className="mt-1 text-3xl font-bold text-[#C0362C]">Rs {yearlyLoss.toLocaleString()} / year</p>
        <p className="mt-1 text-xs text-muted">
          {refusedPerMonth} refused parcels a month × Rs {(courier * 2).toLocaleString()} courier both ways — before
          counting damaged returns and cash stuck in transit.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 text-center">
        <p className="text-base font-semibold text-ink">StoreLink flags repeat parcel-refusers BEFORE you ship</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          Every order shows the buyer&apos;s delivery history across all StoreLink shops — serial refusers get a
          warning on the order, so you confirm on WhatsApp first instead of burning courier fees.
        </p>
        <Link href="/signup?src=cod-calculator" className="mt-4 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
          Protect my orders — free →
        </Link>
      </div>
    </div>
  );
}
