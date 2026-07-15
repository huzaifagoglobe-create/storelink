import { listShopOrders } from "@/server/services/order-service";
import { SITE_URL } from "@/lib/site";
import { requireSeller } from "@/server/auth/current-seller";
import { listLeads } from "@/server/services/lead-service";
import { getProductsByShop } from "@/server/services/product-service";
import { BroadcastTool } from "@/components/dashboard/broadcast-tool";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} day(s) ago`;
}

export default async function AudiencePage() {
  const { shop } = await requireSeller();
  const [leads, products] = await Promise.all([listLeads(shop.id), getProductsByShop(shop.id)]);
  const productName = (id: string | null) => (id ? products.find((p) => p.id === id)?.name ?? null : null);

  const notifyCount = leads.filter((l) => l.source === "notify").length;
  const newsletterCount = leads.filter((l) => l.source === "newsletter").length;

  // Win-back list: buyers whose LAST delivered order is 30+ days old.
  const orders = await listShopOrders(shop.id);
  const lastByPhone = new Map<string, { name: string; phone: string; last: number; delivered: number }>();
  for (const o of orders) {
    const key = o.customerPhone.replace(/\D/g, "");
    const cur = lastByPhone.get(key) ?? { name: o.customerName, phone: o.customerPhone, last: 0, delivered: 0 };
    const t = new Date(o.createdAt).getTime();
    if (t > cur.last) {
      cur.last = t;
      cur.name = o.customerName;
    }
    if (o.status === "delivered") cur.delivered++;
    lastByPhone.set(key, cur);
  }
  const DAY = 86400000;
  const winback = [...lastByPhone.values()]
    .filter((c) => c.delivered > 0 && Date.now() - c.last > 30 * DAY)
    .sort((a, b) => a.last - b.last)
    .slice(0, 20);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-ink">Audience</h1>
        <p className="text-sm text-muted">
          People who followed your shop or asked to be notified — but haven&apos;t ordered yet. Message them to turn interest into sales.
        </p>
      </div>

      {leads.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">Total audience</p>
            <p className="mt-1 text-xl font-semibold text-ink">{leads.length}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">Following shop</p>
            <p className="mt-1 text-xl font-semibold text-ink">{newsletterCount}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">Waiting on restock</p>
            <p className="mt-1 text-xl font-semibold text-ink">{notifyCount}</p>
          </div>
        </div>
      )}

      {leads.length > 0 && (
        <BroadcastTool customers={leads.map((l) => ({ name: l.name || "Follower", phone: l.phone }))} shopName={shop.name} />
      )}

      {winback.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-sm font-semibold text-ink">💤 Win them back — {winback.length} customer{winback.length > 1 ? "s" : ""} gone quiet</p>
          <p className="mt-1 text-xs text-muted">
            Real buyers who haven&apos;t ordered in 30+ days. One tap opens WhatsApp with a friendly &quot;we miss
            you&quot; message — the cheapest sale is the second sale.
          </p>
          <ul className="mt-3 space-y-1.5">
            {winback.map((c) => {
              const days = Math.floor((Date.now() - c.last) / 86400000);
              const msg = `Assalam o Alaikum ${c.name}! 👋 It's ${shop.name} — we've added new stock since your last order and thought of you. Have a look: ${SITE_URL}/${shop.slug} 💚`;
              return (
                <li key={c.phone} className="flex items-center justify-between gap-3 rounded-xl bg-[#f6f8f6] px-3 py-2">
                  <span className="min-w-0 truncate text-sm text-ink">
                    {c.name} <span className="text-xs text-muted">· last order {days} days ago</span>
                  </span>
                  <a
                    href={`https://wa.me/${c.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-none rounded-lg bg-whatsapp px-3 py-1.5 text-xs font-medium text-whatsapp-foreground"
                  >
                    💬 Win back
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {leads.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
          No audience yet. When visitors tap “Follow” on your shop, or “Notify me” on an out-of-stock item, they&apos;ll appear here.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <ul className="divide-y divide-line">
            {leads.map((l) => {
              const pn = productName(l.productId);
              return (
                <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{l.name || "Follower"}</p>
                    <p className="text-xs text-muted">
                      {l.phone} · {timeAgo(l.createdAt)}
                      {l.source === "notify" && pn ? ` · wants: ${pn}` : ""}
                    </p>
                  </div>
                  <span className={"rounded-full px-2 py-0.5 text-[11px] font-medium " + (l.source === "notify" ? "bg-[#FBF7EC] text-[#8a6d1f]" : "bg-[#EAF3EE] text-primary")}>
                    {l.source === "notify" ? "Restock alert" : "Following"}
                  </span>
                  <a
                    href={`https://wa.me/${l.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-whatsapp px-3 py-1.5 text-xs font-medium text-whatsapp-foreground"
                  >
                    WhatsApp
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
