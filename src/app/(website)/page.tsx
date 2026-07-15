import Link from "next/link";
import { LeadForm } from "@/components/marketing/lead-form";
import { CountUp } from "@/components/website/count-up";
import { listAllShops } from "@/server/services/shop-service";
import { listShopOrders } from "@/server/services/order-service";
import { PLAN_PRICE_PKR, PLAN_LIMITS, limitLabel, PLAN_LABEL, PLAN_TIERS, FREE_MODE } from "@/server/plans";
import { SITE, HOME, FEATURE_GROUPS, FAQS } from "@/content/site-content";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const revalidate = 600;

/* Live platform numbers for the social-proof strip + founding counter. */
async function platformNumbers() {
  let shops = 0, orders = 0, delivered = 0, gmv = 0, paying = 0;
  try {
    const all = await listAllShops();
    const active = all.filter((s) => s.isActive);
    shops = active.length;
    paying = all.filter(
      (s) => s.plan !== "trial" && s.subscriptionStatus === "active" && s.planExpiresAt && new Date(s.planExpiresAt).getTime() > Date.now()
    ).length;
    for (const s of active) {
      const os = await listShopOrders(s.id);
      orders += os.length;
      for (const o of os) if (o.status === "delivered") { delivered++; gmv += o.total; }
    }
  } catch { /* show zeros rather than crash */ }
  return { shops, orders, delivered, gmv, foundingLeft: Math.max(0, 100 - paying) };
}

export default async function HomePage() {
  const n = await platformNumbers();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logo-mark.svg`,
        description: SITE.description,
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: SITE.description,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "PKR",
          description: FREE_MODE
            ? "Free — every feature included, no card required, no commission on sales"
            : "Free 14-day trial, paid plans from Rs 2,500/month",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <main>
        {/* ═══ HERO — deep forest, aurora glow, live phone mock ═══ */}
        <section className="relative overflow-hidden bg-[#0B1F17] text-white">
          <div className="aurora left-[-120px] top-[-120px] h-[420px] w-[420px] bg-[#2EAF7D]" />
          <div className="aurora right-[-100px] top-[120px] h-[380px] w-[380px] bg-[#1D7A9C]" style={{ animationDelay: "-6s" }} />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div>
              <p className="inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
                {HOME.heroKicker}
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                {HOME.heroTitle1}
                <br />
                <span className="grad-text">{HOME.heroTitle2}</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">{HOME.heroSub}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup?src=hero"
                  className="rounded-2xl bg-[#2EAF7D] px-7 py-4 text-center text-base font-semibold text-white shadow-lg shadow-[#2EAF7D]/25 transition hover:scale-[1.02] hover:opacity-95"
                >
                  {HOME.heroCtaPrimary}
                </Link>
                <Link
                  href="/demo"
                  className="glass rounded-2xl px-7 py-4 text-center text-base font-semibold text-white transition hover:bg-white/12"
                >
                  {HOME.heroCtaDemo}
                </Link>
              </div>
              <p className="mt-4 text-xs text-white/50">{HOME.heroTrust}</p>
            </div>

            {/* Live phone mock: a shop card + order notifications, pure CSS/HTML */}
            <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
              <div className="glass float-slow rounded-[2rem] p-4">
                <div className="rounded-2xl bg-white p-4 text-ink">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2EAF7D] to-[#1D7A9C] text-lg font-bold text-white">Z</div>
                    <div>
                      <p className="text-sm font-bold leading-tight">Zara Boutique ✓</p>
                      <p className="text-[11px] text-muted">storelink.pk/zara</p>
                    </div>
                    <span className="ml-auto rounded-full bg-[#E7F2EC] px-2 py-0.5 text-[10px] font-semibold text-[#2C6B57]">● Open</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {["🌸", "👗", "🧣"].map((e, i) => (
                      <div key={i} className="rounded-xl bg-[#f2f6f3] p-2 text-center">
                        <p className="text-2xl">{e}</p>
                        <p className="mt-1 text-[10px] font-medium">Rs {[3499, 2199, 999][i].toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-xl bg-[#0B1F17] py-2.5 text-center text-xs font-semibold text-white">
                    🛒 Order — Cash on Delivery
                  </div>
                </div>
              </div>
              <div className="glass order-pop absolute -left-4 top-6 rounded-2xl px-4 py-3 sm:-left-10" style={{ animationDelay: "0.9s" }}>
                <p className="text-xs font-semibold">📦 New order — Rs 3,499</p>
                <p className="text-[10px] text-white/60">Ayesha K. · Lahore · COD</p>
              </div>
              <div className="glass order-pop float-slower absolute -right-3 bottom-20 rounded-2xl px-4 py-3 sm:-right-8" style={{ animationDelay: "1.6s" }}>
                <p className="text-xs font-semibold">💰 Net profit this month</p>
                <p className="text-sm font-bold text-[#7fe0b2]">Rs 84,200 ↗</p>
              </div>
              <div className="glass order-pop absolute -bottom-4 left-8 rounded-2xl px-4 py-3" style={{ animationDelay: "2.3s" }}>
                <p className="text-xs font-semibold">🛡️ Risky buyer flagged</p>
                <p className="text-[10px] text-white/60">3 refused parcels — confirm first</p>
              </div>
            </div>
          </div>

          {/* Live stats marquee */}
          <div className="relative border-t border-white/10 bg-white/[0.03] py-3.5">
            <div className="overflow-hidden">
              <div className="marquee-track text-sm text-white/70">
                {[0, 1].map((k) => (
                  <div key={k} className="flex items-center gap-12">
                    <span>🏪 <b className="text-white">{n.shops}</b> shops live</span>
                    <span>📦 <b className="text-white">{n.orders}</b> orders placed</span>
                    <span>✅ <b className="text-white">{n.delivered}</b> parcels delivered</span>
                    <span>💚 <b className="text-white">Rs {n.gmv.toLocaleString()}</b> earned by sellers</span>
                    {FREE_MODE
                      ? <span>🎉 <b className="text-white">Free</b> while we test</span>
                      : <span>🏆 <b className="text-white">{n.foundingLeft}</b> founding spots left</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 10-SECOND EXPLAINER ═══ */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid gap-5 md:grid-cols-3">
            {HOME.explainSteps.map((s, i) => (
              <div key={s.title} className="reveal lift rounded-3xl border border-line bg-surface p-7" style={{ transitionDelay: `${i * 120}ms` }}>
                <p className="text-4xl">{s.emoji}</p>
                <h2 className="mt-4 text-lg font-bold text-ink">{s.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ THE PAIN ═══ */}
        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
            <h2 className="reveal text-center text-2xl font-bold text-ink sm:text-3xl">{HOME.problemTitle}</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {HOME.problems.map((p, i) => (
                <div key={p} className="reveal flex items-start gap-3 rounded-2xl border border-[#E7B8B2]/60 bg-[#FBECEA]/60 p-4" style={{ transitionDelay: `${i * 90}ms` }}>
                  <span className="text-lg">😩</span>
                  <p className="text-sm leading-relaxed text-ink">{p}</p>
                </div>
              ))}
            </div>
            <p className="reveal mt-8 text-center text-lg font-semibold text-primary">{HOME.problemPunch}</p>
          </div>
        </section>

        {/* ═══ LIVE NUMBERS ═══ */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="reveal text-center text-2xl font-bold text-ink sm:text-3xl">{HOME.socialProofTitle}</h2>
          <p className="reveal mt-2 text-center text-sm text-muted">
            Real numbers, straight from the platform — <Link href="/stats" className="font-medium text-primary hover:underline">see them live →</Link>
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { v: n.shops, label: "shops running", prefix: "" },
              { v: n.orders, label: "orders placed", prefix: "" },
              { v: n.delivered, label: "parcels delivered", prefix: "" },
              { v: n.gmv, label: "earned by sellers", prefix: "Rs " },
            ].map((s, i) => (
              <div key={s.label} className="reveal rounded-3xl border border-line bg-surface p-6 text-center" style={{ transitionDelay: `${i * 100}ms` }}>
                <p className="text-3xl font-bold text-primary">
                  <CountUp value={s.v} prefix={s.prefix} />
                </p>
                <p className="mt-1 text-xs text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ FEATURES (grouped teaser → /features) ═══ */}
        <section className="border-y border-line bg-[#0B1F17] text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <h2 className="reveal text-center text-2xl font-bold sm:text-3xl">{HOME.featuresTitle}</h2>
            <p className="reveal mx-auto mt-2 max-w-xl text-center text-sm text-white/60">{HOME.featuresSub}</p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {FEATURE_GROUPS.map((g, i) => (
                <div key={g.title} className="glass reveal rounded-3xl p-6" style={{ transitionDelay: `${i * 120}ms` }}>
                  <p className="text-3xl">{g.emoji}</p>
                  <h3 className="mt-3 text-lg font-bold">{g.title}</h3>
                  <ul className="mt-4 space-y-2.5">
                    {g.features.slice(0, 4).map((f) => (
                      <li key={f.name} className="flex items-start gap-2 text-sm text-white/75">
                        <span className="mt-0.5 text-[#7fe0b2]">✓</span>
                        {f.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="reveal mt-8 text-center">
              <Link href="/features" className="inline-block rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                See all {FEATURE_GROUPS.reduce((a, g) => a + g.features.length, 0)} features →
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ DEMO INVITE ═══ */}
        <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <div className="reveal rounded-3xl border-2 border-primary/25 bg-gradient-to-br from-[#EAF3EE] to-[#EAF1F5] p-10">
            <p className="pulse-dot mx-auto inline-block rounded-full bg-[#2EAF7D] px-3 py-1 text-xs font-bold text-white">LIVE</p>
            <h2 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">Don&apos;t take our word for it — walk inside</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Open a real seller&apos;s dashboard — real orders, real profit books, real everything. No signup, one click.
            </p>
            <Link href="/demo" className="mt-6 inline-block rounded-2xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg transition hover:scale-[1.02]">
              ▶ Open the live demo
            </Link>
          </div>
        </section>

        {/* ═══ PRICING ═══ */}
        {FREE_MODE ? (
          <section className="border-y border-line bg-surface">
            <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
              <p className="reveal inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                FREE WHILE WE TEST
              </p>
              <h2 className="reveal mt-3 text-2xl font-bold text-ink sm:text-3xl">
                Right now, it costs nothing
              </h2>
              <p className="reveal mx-auto mt-3 max-w-md text-sm text-muted">
                We&apos;re testing StoreLink with real Pakistani shops. Every feature, no limits,
                no card — while we learn what sellers actually need.
              </p>
              <div className="reveal lift mx-auto mt-8 max-w-sm rounded-3xl border-2 border-primary bg-background p-7 shadow-lg">
                <p className="text-4xl font-bold text-ink">Rs 0<span className="text-sm font-normal text-muted">/mo</span></p>
                <ul className="mt-5 space-y-2 text-left text-sm text-muted">
                  <li>✓ Unlimited products &amp; categories</li>
                  <li>✓ Unlimited orders — no commission</li>
                  <li>✓ COD orders + fake-order protection</li>
                  <li>✓ Every feature included</li>
                </ul>
                <Link href="/signup?src=home-free" className="mt-6 block rounded-xl bg-primary py-3 text-center text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                  Create your free shop
                </Link>
              </div>
              <p className="reveal mt-6 text-center text-xs text-muted">
                If we ever start charging, we&apos;ll tell you first · <Link href="/pricing" className="font-medium text-primary hover:underline">More details →</Link>
              </p>
            </div>
          </section>
        ) : (
        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="reveal text-center text-2xl font-bold text-ink sm:text-3xl">Simple, honest pricing</h2>
            <p className="reveal mt-2 text-center text-sm text-muted">Start free. Upgrade when the orders say so.</p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {PLAN_TIERS.filter((t) => t !== "trial").map((t, i) => (
                <div key={t} className={"reveal lift rounded-3xl border bg-background p-7 " + (t === "pro" ? "border-2 border-primary shadow-lg" : "border-line")} style={{ transitionDelay: `${i * 100}ms` }}>
                  {t === "pro" && <p className="mb-2 inline-block rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground">MOST POPULAR</p>}
                  <p className="text-sm font-semibold text-muted">{PLAN_LABEL[t]}</p>
                  <p className="mt-1 text-3xl font-bold text-ink">Rs {PLAN_PRICE_PKR[t].toLocaleString()}<span className="text-sm font-normal text-muted">/mo</span></p>
                  <ul className="mt-4 space-y-2 text-sm text-muted">
                    <li>✓ {limitLabel(PLAN_LIMITS[t].products)} products</li>
                    <li>✓ {limitLabel(PLAN_LIMITS[t].categories)} categories</li>
                    <li>✓ Every feature included</li>
                    <li>✓ COD orders + fake-order protection</li>
                  </ul>
                  <Link href={`/signup?src=home-pricing`} className={"mt-6 block rounded-xl py-3 text-center text-sm font-semibold transition " + (t === "pro" ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-line text-ink hover:border-primary")}>
                    Start free trial
                  </Link>
                </div>
              ))}
            </div>
            <p className="reveal mt-6 text-center text-xs text-muted">
              Every plan starts with a free 14-day trial · <Link href="/pricing" className="font-medium text-primary hover:underline">Full pricing details →</Link>
            </p>
          </div>
        </section>
        )}

        {/* ═══ FOUNDING OFFER ═══ */}
        {!FREE_MODE && n.foundingLeft > 0 && (
          <section className="mx-auto max-w-3xl px-4 pt-16 sm:px-6">
            <div className="reveal rounded-3xl border-2 border-[#E7C98A] bg-[#FBF7EC] p-7 text-center">
              <p className="text-lg font-bold text-ink">{HOME.founding.title}</p>
              <p className="mx-auto mt-1 max-w-lg text-sm text-muted">{HOME.founding.body}</p>
              <p className="mt-3 text-base font-bold text-[#8a6d1f]">{n.foundingLeft} of 100 founding spots left</p>
            </div>
          </section>
        )}

        {/* ═══ FAQ PREVIEW ═══ */}
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="reveal text-center text-2xl font-bold text-ink sm:text-3xl">Questions, answered honestly</h2>
          <div className="mt-8 space-y-3">
            {FAQS.slice(0, 4).map((f, i) => (
              <details key={f.q} className="reveal group rounded-2xl border border-line bg-surface p-5" style={{ transitionDelay: `${i * 80}ms` }}>
                <summary className="cursor-pointer list-none text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {f.q} <span className="float-right text-muted transition group-open:rotate-45">＋</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="reveal mt-5 text-center text-sm">
            <Link href="/faq" className="font-medium text-primary hover:underline">All {FAQS.length} questions →</Link>
          </p>
        </section>

        {/* ═══ LEAD FORM ═══ */}
        <section className="mx-auto max-w-3xl px-4 pb-8 sm:px-6">
          <div className="reveal">
            <LeadForm />
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="relative overflow-hidden bg-[#0B1F17] text-white">
          <div className="aurora left-1/4 top-[-140px] h-[360px] w-[360px] bg-[#2EAF7D]" />
          <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
            <h2 className="reveal text-3xl font-bold sm:text-4xl">{HOME.finalCtaTitle}</h2>
            <p className="reveal mt-3 text-white/65">{HOME.finalCtaSub}</p>
            <Link href="/signup?src=home-final" className="reveal mt-8 inline-block rounded-2xl bg-[#2EAF7D] px-10 py-4 text-lg font-semibold text-white shadow-xl shadow-[#2EAF7D]/25 transition hover:scale-[1.03]">
              {HOME.finalCtaButton}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
