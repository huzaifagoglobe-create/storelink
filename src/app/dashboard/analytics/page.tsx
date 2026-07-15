import { requireSeller } from "@/server/auth/current-seller";
import { getShopStats } from "@/server/services/analytics-service";
import { getProductsByShop } from "@/server/services/product-service";
import { listShopOrders } from "@/server/services/order-service";

export default async function AnalyticsPage() {
  const { shop } = await requireSeller();
  const [stats, products, orders] = await Promise.all([
    getShopStats(shop.id),
    getProductsByShop(shop.id),
    listShopOrders(shop.id),
  ]);

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? "Product";
  const orderCount = orders.length;
  // Rough visit→order conversion (orders vs total views). Guarded against /0.
  const conversion = stats.totalViews > 0 ? (orderCount / stats.totalViews) * 100 : 0;
  const maxDaily = Math.max(1, ...stats.dailyLast14.map((d) => d.views));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-ink">Analytics</h1>
        <p className="text-sm text-muted">How your shop is doing. Share your link on Instagram, Facebook, TikTok or WhatsApp to bring in visitors.</p>
      </div>

      {stats.totalViews === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
          <p className="text-sm font-medium text-ink">No visits yet</p>
          <p className="mt-1 text-xs text-muted">
            Share your shop link anywhere you post — every visit shows up here so you can see what&apos;s working.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-xs text-muted">Total visits</p>
              <p className="mt-1 text-xl font-semibold text-ink">{stats.totalViews}</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-xs text-muted">Last 7 days</p>
              <p className="mt-1 text-xl font-semibold text-ink">{stats.views7d}</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-xs text-muted">Orders</p>
              <p className="mt-1 text-xl font-semibold text-ink">{orderCount}</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-xs text-muted">Visit → order</p>
              <p className="mt-1 text-xl font-semibold text-primary">{conversion.toFixed(1)}%</p>
            </div>
          </div>

          {/* 14-day visits bar chart (pure CSS, no library) */}
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="mb-3 text-sm font-medium text-ink">Visits — last 14 days</p>
            <div className="flex items-end gap-1.5" style={{ height: 140 }}>
              {stats.dailyLast14.map((d, i) => (
                <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <div
                    className="w-full rounded-t bg-primary/80"
                    style={{ height: `${(d.views / maxDaily) * 110}px`, minHeight: d.views > 0 ? 3 : 0 }}
                    title={`${d.day}: ${d.views} visits`}
                  />
                  <span className="text-[9px] text-muted">{d.day.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic sources */}
          {stats.sources.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="mb-1 text-sm font-medium text-ink">Where your visitors come from</p>
              <p className="mb-3 text-xs text-muted">Post more where the buyers actually are.</p>
              <ul className="space-y-2">
                {stats.sources.map((src) => {
                  const pct = (src.views / stats.sources[0].views) * 100;
                  return (
                    <li key={src.source} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-ink">{src.source}</span>
                        <span className="flex-none text-muted">
                          {src.views} ({Math.round((src.views / stats.totalViews) * 100)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#eef3f0]">
                        <div className="h-2 rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Top products by views */}
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="mb-3 text-sm font-medium text-ink">Most-viewed products</p>
            {stats.topProducts.length === 0 ? (
              <p className="text-xs text-muted">No product views yet.</p>
            ) : (
              <ul className="space-y-2">
                {stats.topProducts.map((tp) => {
                  const pct = (tp.views / stats.topProducts[0].views) * 100;
                  return (
                    <li key={tp.productId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate text-ink">{productName(tp.productId)}</span>
                        <span className="flex-none text-muted">{tp.views} views</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#eef3f0]">
                        <div className="h-2 rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-sm font-medium text-ink">🛍️ Put your products on Google — free</p>
        <p className="mt-1 text-xs text-muted">
          Your shop has an automatic product feed. Paste this link into{" "}
          <a href="https://merchants.google.com" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
            Google Merchant Center
          </a>{" "}
          and your products can appear in Google Shopping for free. The same link works for Facebook/Instagram
          catalogues (Meta Commerce Manager) so you can tag products in your posts.
        </p>
        <code className="mt-2 block overflow-x-auto rounded-lg bg-[#f3f5f2] px-3 py-2 text-xs text-ink">
          {`${process.env.NEXT_PUBLIC_SITE_URL || "https://storelink.pk"}/api/feed/${shop.slug}`}
        </code>
        <p className="mt-1 text-[11px] text-muted">It updates itself — new products, prices and stock included automatically.</p>
      </div>
    </div>
  );
}
