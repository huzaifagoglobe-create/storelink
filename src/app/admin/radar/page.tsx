import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-admin";
import { listAllShops } from "@/server/services/shop-service";
import { listShopOrders } from "@/server/services/order-service";
import { getProductsByShop } from "@/server/services/product-service";

const DAY = 86400000;

/**
 * The radar: sellers about to churn, caught while a WhatsApp message can
 * still save them. Saving one Rs 2,500 subscription a week pays for
 * everything.
 */
export default async function AdminRadarPage() {
  await requireAdmin();
  const shops = await listAllShops();
  const now = Date.now();

  // 0) Fresh signups (last 48h): a personal salam from the founder is the
  //    highest-converting onboarding that exists at this stage.
  const fresh = shops
    .filter((s) => now - new Date(s.createdAt).getTime() < 2 * 86400000)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  // 1) Dead-on-arrival trials: trial ends within 3 days, still ZERO products.
  const doa: { id: string; name: string; whatsapp: string; days: number }[] = [];
  // 2) Paying but silent: active paid plan, zero orders in the last 14 days.
  const silent: { id: string; name: string; whatsapp: string; last: string }[] = [];

  for (const s of shops) {
    if (s.plan === "trial" && s.trialEndsAt) {
      const left = new Date(s.trialEndsAt).getTime() - now;
      if (left > 0 && left < 3 * DAY) {
        const products = await getProductsByShop(s.id);
        if (products.length === 0) {
          doa.push({ id: s.id, name: s.name, whatsapp: s.whatsapp, days: Math.max(1, Math.ceil(left / DAY)) });
        }
      }
    }
    if (
      s.plan !== "trial" &&
      s.subscriptionStatus === "active" &&
      s.planExpiresAt &&
      new Date(s.planExpiresAt).getTime() > now
    ) {
      const orders = await listShopOrders(s.id);
      const lastOrder = orders.length > 0 ? Math.max(...orders.map((o) => new Date(o.createdAt).getTime())) : 0;
      if (now - lastOrder > 14 * DAY) {
        silent.push({
          id: s.id,
          name: s.name,
          whatsapp: s.whatsapp,
          last: lastOrder ? new Date(lastOrder).toLocaleDateString("en-PK", { day: "numeric", month: "short" }) : "never",
        });
      }
    }
  }

  const doaMsg = (name: string) =>
    `Assalam o Alaikum! It's StoreLink 👋\nWe noticed your shop "${name}" doesn't have products yet and your free trial ends soon. Adding your first product takes 2 minutes — want a hand? Reply here and we'll walk you through it, or even add the first one WITH you. 💚`;
  const silentMsg = (name: string) =>
    `Assalam o Alaikum! It's StoreLink 👋\nQuick check-in on "${name}" — orders have been quiet lately. Have you tried the Share cards + ready captions (Products page), the referral rewards, or a flash sale? Reply here and we'll help you get orders moving again. 💚`;

  const Section = ({
    tone,
    title,
    hint,
    children,
  }: {
    tone: "warn" | "info";
    title: string;
    hint: string;
    children: React.ReactNode;
  }) => (
    <div className={"rounded-2xl border p-4 " + (tone === "warn" ? "border-[#E7C98A] bg-[#FBF7EC]" : "border-line bg-surface")}>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
      {children}
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-ink">At-risk radar</h1>
        <p className="text-sm text-muted">Sellers about to be lost — while a message can still save them.</p>
      </div>

      <Section
        tone="info"
        title={`🎉 New signups — last 48 hours (${fresh.length})`}
        hint="Say salam personally. Founders who welcome every signup convert far more of them."
      >
        {fresh.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No new signups in the last 48 hours.</p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {fresh.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f6f8f6] px-3 py-2">
                <Link href={`/admin/shops/${s.id}`} className="min-w-0 truncate text-sm font-medium text-ink hover:text-primary">
                  {s.name}
                  <span className="ml-2 text-[11px] font-normal text-muted">
                    {s.industry ?? "—"} · joined {new Date(s.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                    {s.signupSource ? ` · via ${s.signupSource}` : ""}
                  </span>
                </Link>
                <a
                  href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Assalam o Alaikum! It's the founder of StoreLink 👋 Welcome — I saw you just opened "${s.name}". Need a hand adding your first product or setting up your page? Reply here, I'll personally help you get your first order. 💚`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-none rounded-lg bg-whatsapp px-3 py-1.5 text-xs font-medium text-whatsapp-foreground"
                >
                  💬 Welcome
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        tone="warn"
        title={`🚨 Trial ending, ZERO products (${doa.length})`}
        hint="They signed up and got stuck. One helping hand converts many of these into paying shops."
      >
        {doa.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nobody right now — good.</p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {doa.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2">
                <Link href={`/admin/shops/${s.id}`} className="min-w-0 truncate text-sm font-medium text-ink hover:text-primary">
                  {s.name}
                  <span className="ml-2 text-[11px] font-normal text-muted">trial ends in {s.days} day{s.days === 1 ? "" : "s"}</span>
                </Link>
                <a
                  href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(doaMsg(s.name))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-none rounded-lg bg-whatsapp px-3 py-1.5 text-xs font-medium text-whatsapp-foreground"
                >
                  💬 Rescue
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        tone="info"
        title={`💤 Paying, but no orders in 14+ days (${silent.length})`}
        hint={'These sellers are one bad month from asking "why am I paying?" — reach out before they do.'}
      >
        {silent.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nobody right now — good.</p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {silent.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f6f8f6] px-3 py-2">
                <Link href={`/admin/shops/${s.id}`} className="min-w-0 truncate text-sm font-medium text-ink hover:text-primary">
                  {s.name}
                  <span className="ml-2 text-[11px] font-normal text-muted">last order: {s.last}</span>
                </Link>
                <a
                  href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(silentMsg(s.name))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-none rounded-lg bg-whatsapp px-3 py-1.5 text-xs font-medium text-whatsapp-foreground"
                >
                  💬 Check in
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
