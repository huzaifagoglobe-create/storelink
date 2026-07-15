import { requireSeller } from "@/server/auth/current-seller";
import { PagesForm } from "@/components/dashboard/pages-form";
import { shopPages } from "@/lib/shop-pages";

export default async function DashboardPagesPage() {
  const { shop } = await requireSeller();
  const live = shopPages(shop);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Pages</h1>
        <p className="text-sm text-muted">
          Professional store pages in 2 minutes — buyers trust shops that have them, and Google ranks them better.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Live on your store</p>
        <div className="flex flex-wrap gap-2">
          {live.map((p) => (
            <a
              key={p.href}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:border-primary"
            >
              {p.label} ↗
            </a>
          ))}
        </div>
      </div>

      <PagesForm shop={shop} />
    </div>
  );
}
