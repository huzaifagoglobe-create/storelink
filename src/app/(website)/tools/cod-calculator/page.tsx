import type { Metadata } from "next";
import { CodCalculator } from "@/components/marketing/cod-calculator";

export const metadata: Metadata = {
  title: "COD Loss Calculator — how much are fake orders costing you? | StoreLink",
  description:
    "Free calculator for Pakistani online sellers: see how much money refused Cash-on-Delivery parcels cost you every year — and how to stop it.",
};

export default function CodCalculatorPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">The COD Loss Calculator</h1>
      <p className="mt-2 text-sm text-muted">
        Every refused parcel costs you twice — courier charges both ways, plus your cash stuck in a returning box.
        See what fake orders really cost your business per year.
      </p>
      <div className="mt-6">
        <CodCalculator />
      </div>
    </div>
  );
}
