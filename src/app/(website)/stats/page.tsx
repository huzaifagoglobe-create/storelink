import type { Metadata } from "next";
import Link from "next/link";
import { listAllShops } from "@/server/services/shop-service";
import { listShopOrders } from "@/server/services/order-service";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = {
  title: "StoreLink in numbers — live platform stats",
  description: "Live numbers from StoreLink: shops running, orders delivered, and sales made by Pakistani sellers.",
};
export const revalidate = 600;

/** Public proof, auto-updating. Screenshot it, link it, pitch with it. */
export default async function StatsPage() {
  const shops = (await listAllShops()).filter((s) => s.isActive);
  let delivered = 0;
  let gmv = 0;
  let totalOrders = 0;
  for (const s of shops) {
    const orders = await listShopOrders(s.id);
    totalOrders += orders.length;
    for (const o of orders) {
      if (o.status === "delivered") {
        delivered++;
        gmv += o.total;
      }
    }
  }
  const big = [
    { n: String(shops.length), label: "shops running on StoreLink" },
    { n: String(totalOrders), label: "orders placed" },
    { n: String(delivered), label: "parcels delivered" },
    { n: formatCurrency(gmv), label: "earned by Pakistani sellers" },
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">StoreLink, live</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Real numbers, straight from the platform — updated automatically.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {big.map((b) => (
          <div key={b.label} className="rounded-2xl border border-line bg-surface p-8">
            <p className="text-3xl font-bold text-primary">{b.n}</p>
            <p className="mt-1 text-sm text-muted">{b.label}</p>
          </div>
        ))}
      </div>
      <Link href="/signup" className="mt-10 inline-block rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground">
        Add your shop to these numbers — free →
      </Link>
    </div>
  );
}
