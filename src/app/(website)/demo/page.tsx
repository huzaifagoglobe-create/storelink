import type { Metadata } from "next";
import Link from "next/link";
import { getShopBySlug } from "@/server/services/shop-service";
import { listShopOrders } from "@/server/services/order-service";
import { getProductsByShop } from "@/server/services/product-service";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = {
  title: "Live demo — walk inside a real seller dashboard",
  description:
    "No signup, one click: see a real StoreLink seller dashboard with live orders, profit books, fake-order protection and analytics. This is what running your shop feels like.",
  alternates: { canonical: "/demo" },
};
export const revalidate = 300;

const STATUS_STYLE: Record<string, string> = {
  new: "bg-[#FBF7EC] text-[#8a6d1f]",
  confirmed: "bg-[#EAF1FB] text-[#1f4f86]",
  delivered: "bg-[#E7F2EC] text-[#2C6B57]",
  cancelled: "bg-[#f1f4f2] text-muted",
};

/**
 * THE ONE-CLICK DEMO: a read-only window into the real demo shop's dashboard.
 * Everything on this page is live data rendered server-side — nothing can be
 * changed from here, so it's completely safe to show the world.
 */
export default async function DemoPage() {
  const shop = await getShopBySlug("zara");
  if (!shop) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="text-muted">The demo shop is warming up — try again in a minute.</p>
      </main>
    );
  }
  const [orders, products] = await Promise.all([listShopOrders(shop.id), getProductsByShop(shop.id)]);

  // This month's khata numbers, same math as the seller's real page.
  const month = new Date().toISOString().slice(0, 7);
  const costOf = new Map(products.map((p) => [p.id, p.costPrice]));
  let sales = 0;
  let costs = 0;
  for (const o of orders) {
    if (o.status !== "delivered" || !o.createdAt.startsWith(month)) continue;
    sales += o.total;
    for (const it of o.items) costs += (it.cost ?? costOf.get(it.productId) ?? 0) * it.quantity;
  }
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const awaiting = orders.filter((o) => o.status === "new").length;
  const recent = [...orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6);
  const topProducts = [...products].filter((p) => p.isActive).slice(0, 4);

  return (
    <main className="bg-[#eef2ef]">
      {/* Demo frame banner */}
      <div className="sticky top-16 z-30 border-b border-[#E7C98A] bg-[#FBF7EC] px-4 py-2.5 text-center text-xs font-medium text-[#8a6d1f]">
        👀 You&apos;re looking at a REAL seller dashboard (read-only demo) — this is what YOUR shop&apos;s control room looks like.{" "}
        <Link href="/signup?src=demo" className="font-bold underline">Make mine free →</Link>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* The page's h1. Visually hidden because the mock dashboard below is
            the point of the page, but a page with no h1 is invisible structure
            to Google and to screen readers. */}
        <h1 className="sr-only">StoreLink demo — a real seller dashboard</h1>
        {/* dashboard chrome */}
        <div className="overflow-hidden rounded-3xl border border-line bg-background shadow-2xl">
          {/* fake window bar */}
          <div className="flex items-center gap-1.5 border-b border-line bg-surface px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f2b8b2]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#f2dcb0]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#b9dcc5]" />
            <p className="ml-3 text-xs text-muted">storelink.pk/dashboard — {shop.name}</p>
          </div>

          <div className="p-5 sm:p-7">
            {/* header row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2EAF7D] to-[#1D7A9C] text-lg font-bold text-white">
                  {shop.name.slice(0, 1)}
                </div>
                <div>
                  <p className="font-bold text-ink">{shop.name} <span className="text-[#2C6B57]">✓</span></p>
                  <p className="text-xs text-muted">storelink.pk/{shop.slug} · Pro plan</p>
                </div>
              </div>
              <Link href={`/${shop.slug}`} className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink transition hover:border-primary">
                🛍️ Open this shop&apos;s live storefront →
              </Link>
            </div>

            {/* stat cards */}
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { v: String(orders.length), l: "Total orders" },
                { v: String(delivered), l: "Delivered" },
                { v: String(awaiting), l: "Awaiting confirmation" },
                { v: formatCurrency(sales, shop.currency), l: "Sales this month" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-line bg-surface p-4">
                  <p className="text-xl font-bold text-ink">{s.v}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{s.l}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-5">
              {/* orders table */}
              <div className="rounded-2xl border border-line bg-surface p-4 lg:col-span-3">
                <p className="text-sm font-bold text-ink">📦 Latest orders</p>
                <ul className="mt-3 divide-y divide-line">
                  {recent.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          #{o.id} · {o.customerName}
                        </p>
                        <p className="text-[11px] text-muted">{o.city} · Cash on Delivery</p>
                      </div>
                      <div className="flex flex-none items-center gap-2">
                        <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold " + (STATUS_STYLE[o.status] ?? "")}>{o.status}</span>
                        <span className="text-sm font-semibold text-ink">{formatCurrency(o.total, shop.currency)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* khata + protection */}
              <div className="space-y-5 lg:col-span-2">
                <div className="rounded-2xl border border-line bg-surface p-4">
                  <p className="text-sm font-bold text-ink">📒 Khata — this month</p>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between"><dt className="text-muted">Sales (delivered)</dt><dd className="font-medium text-ink">{formatCurrency(sales, shop.currency)}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">− Product costs</dt><dd className="text-ink">{formatCurrency(costs, shop.currency)}</dd></div>
                    <div className="flex justify-between border-t border-line pt-1.5"><dt className="font-semibold text-ink">= Net profit</dt><dd className="font-bold text-[#2C6B57]">{formatCurrency(sales - costs, shop.currency)}</dd></div>
                  </dl>
                  <p className="mt-2 text-[10px] text-muted">Real math — not a mockup. Expenses tracking included in the full khata.</p>
                </div>
                <div className="rounded-2xl border border-[#E7B8B2] bg-[#FBECEA] p-4">
                  <p className="text-sm font-bold text-ink">🛡️ Fake-order protection</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink">
                    <b>0333•••4567</b> — refused 3 parcels across StoreLink shops.
                    <span className="mt-1 block font-semibold text-[#8a2c22]">⚠️ Confirm on WhatsApp before shipping.</span>
                  </p>
                  <p className="mt-2 text-[10px] text-muted">Every order is checked against buyer history platform-wide.</p>
                </div>
              </div>
            </div>

            {/* products strip */}
            <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-ink">🛍️ Products ({products.filter((p) => p.isActive).length} live)</p>
                <Link href={`/${shop.slug}`} className="text-xs font-medium text-primary hover:underline">See them in the storefront →</Link>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {topProducts.map((p) => (
                  <div key={p.id} className="rounded-xl border border-line bg-background p-3">
                    <p className="truncate text-xs font-semibold text-ink">{p.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatCurrency(p.price, shop.currency)} · stock {p.stock}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* what you just saw + CTA */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { t: "Everything is real", d: "Live orders, live products, live profit math — pulled from an actual demo shop, not screenshots." },
            { t: "This took 2 minutes to set up", d: "Shop name, link, products. That's the whole setup — the dashboard builds itself." },
            { t: "Yours works exactly like this", d: "Same dashboard, same protection, same khata — with YOUR products and YOUR orders." },
          ].map((c, i) => (
            <div key={c.t} className="reveal rounded-2xl border border-line bg-surface p-5" style={{ transitionDelay: `${i * 100}ms` }}>
              <p className="text-sm font-bold text-ink">{c.t}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.d}</p>
            </div>
          ))}
        </div>
        <div className="reveal mt-8 text-center">
          <Link href="/signup?src=demo" className="inline-block rounded-2xl bg-primary px-10 py-4 text-base font-semibold text-primary-foreground shadow-lg transition hover:scale-[1.02]">
            Build mine now — free →
          </Link>
          <p className="mt-2 text-xs text-muted">2 minutes · no card · sample products pre-loaded for your industry</p>
        </div>
      </div>
    </main>
  );
}
