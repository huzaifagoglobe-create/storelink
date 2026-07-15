import { requireSeller } from "@/server/auth/current-seller";
import { listAbandonedCarts } from "@/server/services/abandoned-cart-service";
import { formatCurrency } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default async function AbandonedCartsPage() {
  const { shop } = await requireSeller();
  const carts = await listAbandonedCarts(shop.id);
  const shopUrl = `${SITE_URL}/${shop.slug}`;
  const potential = carts.reduce((s, c) => s + c.subtotal, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-ink">Abandoned carts</h1>
        <p className="text-sm text-muted">
          Buyers who reached checkout but didn&apos;t finish. Send them a WhatsApp nudge to win the sale back.
        </p>
      </div>

      {carts.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">Carts to recover</p>
            <p className="mt-1 text-xl font-semibold text-ink">{carts.length}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">Potential revenue</p>
            <p className="mt-1 text-xl font-semibold text-primary">{formatCurrency(potential, shop.currency)}</p>
          </div>
        </div>
      )}

      {carts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
          No abandoned carts right now. When a buyer starts checkout but doesn&apos;t complete, they&apos;ll show up here.
        </p>
      ) : (
        <div className="space-y-3">
          {carts.map((c) => {
            const itemLines = c.items
              .map((i) => `• ${i.name}${i.variant ? " (" + i.variant + ")" : ""} × ${i.quantity}`)
              .join("\n");
            const msg =
              `Assalam o Alaikum${c.customerName ? " " + c.customerName : ""}! 👋\n\n` +
              `You left some items in your cart at ${shop.name}:\n${itemLines}\n\n` +
              `They're still available — complete your order here: ${shopUrl}\n\n` +
              `Let me know if you have any questions 😊`;
            const wa = `https://wa.me/${c.customerPhone}?text=${encodeURIComponent(msg)}`;
            return (
              <div key={c.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {c.customerName || "Customer"} <span className="text-muted">· {c.customerPhone}</span>
                    </p>
                    <p className="text-xs text-muted">{timeAgo(c.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">{formatCurrency(c.subtotal, shop.currency)}</p>
                    <p className="text-xs text-muted">{c.items.length} item{c.items.length > 1 ? "s" : ""}</p>
                  </div>
                </div>

                <ul className="mt-2 space-y-0.5 text-xs text-muted">
                  {c.items.slice(0, 4).map((i, idx) => (
                    <li key={idx} className="truncate">
                      {i.name}
                      {i.variant ? ` · ${i.variant}` : ""} × {i.quantity}
                    </li>
                  ))}
                  {c.items.length > 4 && <li>and {c.items.length - 4} more…</li>}
                </ul>

                <div className="mt-3 flex gap-2">
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-whatsapp px-4 py-2 text-xs font-medium text-whatsapp-foreground"
                  >
                    Send WhatsApp reminder
                  </a>
                  <a
                    href={`tel:${c.customerPhone}`}
                    className="rounded-lg border border-line px-4 py-2 text-xs font-medium text-ink"
                  >
                    Call
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
