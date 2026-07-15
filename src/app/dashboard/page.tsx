import { ReferSellerCard } from "@/components/dashboard/refer-seller-card";
import Link from "next/link";
import { requireSeller } from "@/server/auth/current-seller";
import { listShopProducts } from "@/server/services/product-service";
import { countCategories } from "@/server/services/category-service";
import { PLAN_LABEL, PLAN_PRICE_PKR, planLimits, limitLabel, FREE_MODE, FREE_MODE_LABEL } from "@/server/plans";
import { listShopOrders } from "@/server/services/order-service";
import { formatCurrency } from "@/lib/format";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { StoreShare } from "@/components/dashboard/store-share";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";

function StatIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export default async function DashboardHome() {
  const { shop, isOwner } = await requireSeller();
  const [products, orders, categoryCount] = await Promise.all([
    listShopProducts(shop.id),
    listShopOrders(shop.id),
    countCategories(shop.id),
  ]);

  const productCount = products.length;
  const newOrders = orders.filter((o) => o.status === "new").length;
  const totalOrders = orders.length;
  const sales = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.total, 0);
  const recent = orders.slice(0, 5);


  // Low-stock: active products at or below the threshold (out-of-stock first).
  const LOW_STOCK_THRESHOLD = 3;
  const lowStock = products
    .filter((p) => p.isActive && p.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock);

  const stats = [
    { label: "New orders", value: String(newOrders), href: "/dashboard/orders", accent: newOrders > 0, d: "M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" },
    { label: "Total orders", value: String(totalOrders), href: "/dashboard/orders", accent: false, d: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
    { label: "Products", value: String(productCount), href: "/dashboard/products", accent: false, d: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" },
    { label: "Sales", value: formatCurrency(sales, shop.currency), href: "/dashboard/reports", accent: false, d: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  ];

  const planLabel = PLAN_LABEL[shop.plan];
  const limits = planLimits(shop.plan);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Overview</h1>
          <p className="text-sm text-muted">A quick look at how your shop is doing.</p>
        </div>
        <span className="hidden flex-none items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted sm:inline-flex">
          <span className={`h-1.5 w-1.5 rounded-full ${shop.isActive ? "bg-primary" : "bg-muted"}`} />
          {planLabel} plan
        </span>
      </div>

      <OnboardingChecklist shop={shop} productCount={productCount} orderCount={totalOrders} />

      {lowStock.length > 0 && (
        <div className="rounded-2xl border border-[#E7C98A] bg-[#FBF7EC] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">
              {lowStock.length} {lowStock.length === 1 ? "product is" : "products are"} running low
            </p>
            <Link href="/dashboard/products" className="flex-none text-xs font-medium text-primary hover:underline">
              Manage stock →
            </Link>
          </div>
          <ul className="mt-2 space-y-1">
            {lowStock.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <Link href={`/dashboard/products/${p.id}/edit`} className="truncate text-ink hover:underline">
                  {p.name}
                </Link>
                <span className={"flex-none rounded-full px-2 py-0.5 text-[11px] font-semibold " + (p.stock === 0 ? "bg-[#F3D2D2] text-[#7A1F1F]" : "bg-white text-[#8a6d1f]")}>
                  {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                </span>
              </li>
            ))}
          </ul>
          {lowStock.length > 5 && (
            <p className="mt-1.5 text-xs text-muted">and {lowStock.length - 5} more…</p>
          )}
        </div>
      )}

      {/* Signature card: share your store */}
      <div className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${shop.isActive ? "bg-accent" : "bg-white/40"}`} />
            <p className="text-sm font-medium">{shop.isActive ? "Your store is live" : "Your store is paused"}</p>
          </div>
          <h2 className="mt-1.5 text-lg font-semibold tracking-tight">Share your link and start taking orders</h2>
          <p className="mt-1 max-w-md text-sm text-primary-foreground/80">
            Send this link on WhatsApp, Instagram, or anywhere. Customers browse and order, and every order lands in your WhatsApp and right here.
          </p>
          <div className="mt-4">
            <StoreShare slug={shop.slug} />
          </div>
        </div>
      </div>


      {shop.verificationStatus !== "verified" && (
        <Link
          href="/dashboard/verification"
          className="flex items-center justify-between gap-3 rounded-2xl border border-[#E7C98A] bg-[#FBF7EC] p-4 transition hover:border-[#d9b463]"
        >
          <div>
            <p className="text-sm font-semibold text-ink">
              {shop.verificationStatus === "pending" ? "Verification under review" : "Accept online payments"}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {shop.verificationStatus === "pending"
                ? "We're checking your details — we'll update you soon."
                : "Verify your shop to let customers pay online, not just Cash on Delivery."}
            </p>
          </div>
          <span className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
            {shop.verificationStatus === "pending" ? "View status" : "Verify now"}
          </span>
        </Link>
      )}

      {/* Plan usage */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        {FREE_MODE ? (
          <>
            <p className="text-sm font-medium text-ink">
              {FREE_MODE_LABEL} — everything is free
            </p>
            <p className="mt-1 text-sm text-muted">
              Products {productCount} · Categories {categoryCount} · No limits while we&apos;re testing.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-ink">
              {planLabel} plan
              {PLAN_PRICE_PKR[shop.plan] > 0
                ? ` · ${formatCurrency(PLAN_PRICE_PKR[shop.plan], shop.currency)}/mo`
                : ""}
            </p>
            <p className="mt-1 text-sm text-muted">
              Products {productCount}/{limitLabel(limits.products)} · Categories {categoryCount}/
              {limitLabel(limits.categories)}
            </p>
            {isOwner && (
            <Link href="/dashboard/plan" className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
              View plans &amp; upgrade →
            </Link>
            )}
          </>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl border border-line bg-surface p-4 transition hover:border-primary hover:shadow-sm">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.accent ? "bg-primary text-primary-foreground" : "bg-[#EAF3EE] text-primary"}`}>
              <StatIcon d={s.d} />
            </span>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{s.value}</p>
            <p className="mt-0.5 text-xs text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/products/new" className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">
          <StatIcon d="M12 5v14M5 12h14" /> Add product
        </Link>
        <Link href="/dashboard/orders" className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:border-primary">
          Manage orders
        </Link>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-sm font-semibold text-ink">Recent orders</p>
          <Link href="/dashboard/orders" className="text-xs font-medium text-primary hover:underline">See all</Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-ink">No orders yet</p>
            <p className="mt-1 text-sm text-muted">Share your store link above to get your first order.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/dashboard/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#f7faf8]">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#EAF3EE] text-xs font-semibold uppercase text-primary">
                    {o.customerName.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">#{o.id} · {o.customerName}</p>
                    <p className="text-xs text-muted">
                      {formatCurrency(o.total, shop.currency)} · {o.paymentMethod === "cod" ? "Cash on Delivery" : "Online"}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ReferSellerCard slug={shop.slug} shopName={shop.name} />
    </div>
  );
}
