import { requireSeller } from "@/server/auth/current-seller";
import { listResellers } from "@/server/services/reseller-service";
import { listShopOrders } from "@/server/services/order-service";
import { removeResellerAction } from "@/server/actions/reseller-actions";
import { ResellerForm } from "@/components/dashboard/reseller-form";
import { CopyButton } from "@/components/dashboard/copy-button";
import { formatCurrency } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

/**
 * Reseller network: the seller's own sales force. Each reseller gets a tagged
 * link; every order through it is attributed, and commissions are computed on
 * DELIVERED sales only (no commission on refused parcels).
 */
export default async function ResellersPage() {
  const { shop } = await requireSeller();
  const [resellers, orders] = await Promise.all([listResellers(shop.id), listShopOrders(shop.id)]);

  const stats = new Map<string, { orders: number; delivered: number; revenue: number }>();
  for (const o of orders) {
    if (!o.resellerCode) continue;
    const s = stats.get(o.resellerCode) ?? { orders: 0, delivered: 0, revenue: 0 };
    s.orders++;
    if (o.status === "delivered") {
      s.delivered++;
      s.revenue += o.total;
    }
    stats.set(o.resellerCode, s);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Resellers</h1>
        <p className="text-sm text-muted">
          Give friends, family or side-hustlers a personal link. Every order through it is tracked here — you always
          know exactly who to pay and how much.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <ResellerForm />
      </div>

      {resellers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
          No resellers yet. Add your first one above — takes 10 seconds.
        </div>
      ) : (
        <div className="space-y-3">
          {resellers.map((r) => {
            const s = stats.get(r.code) ?? { orders: 0, delivered: 0, revenue: 0 };
            const commission = Math.round((s.revenue * r.commissionPercent) / 100);
            const link = `${SITE_URL}/${shop.slug}?rs=${r.code}`;
            return (
              <div key={r.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {r.name} <span className="ml-1 rounded bg-[#f1f4f2] px-1.5 py-0.5 font-mono text-[11px] text-muted">{r.code}</span>
                    </p>
                    <p className="text-xs text-muted">{r.phone} · {r.commissionPercent}% commission</p>
                  </div>
                  <form action={removeResellerAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" className="rounded-lg px-2 py-1 text-xs text-[#C0362C] hover:bg-[#FBECEA]">
                      Remove
                    </button>
                  </form>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-xl bg-[#f6f8f6] p-2">
                    <p className="text-lg font-bold text-ink">{s.orders}</p>
                    <p className="text-[11px] text-muted">orders brought</p>
                  </div>
                  <div className="rounded-xl bg-[#f6f8f6] p-2">
                    <p className="text-lg font-bold text-ink">{formatCurrency(s.revenue, shop.currency)}</p>
                    <p className="text-[11px] text-muted">delivered sales</p>
                  </div>
                  <div className="rounded-xl bg-[#EAF3EE] p-2">
                    <p className="text-lg font-bold text-[#2C6B57]">{formatCurrency(commission, shop.currency)}</p>
                    <p className="text-[11px] text-muted">commission owed</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-[#f3f5f2] px-3 py-2 text-xs text-ink">{link}</code>
                  <CopyButton text={link} />
                  <a
                    href={`https://wa.me/${r.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Assalam o Alaikum ${r.name}! Here's your personal selling link for ${shop.name} — share it anywhere, every order through it is tracked for your ${r.commissionPercent}% commission: ${link}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-none rounded-lg bg-whatsapp px-3 py-2 text-xs font-medium text-whatsapp-foreground"
                  >
                    Send it
                  </a>
                </div>
              </div>
            );
          })}
          <p className="text-[11px] text-muted">
            Commission is calculated on <b>delivered</b> sales only — refused or cancelled parcels never count.
          </p>
        </div>
      )}
    </div>
  );
}
