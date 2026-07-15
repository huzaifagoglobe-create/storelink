import { requireAdmin } from "@/server/auth/current-admin";
import { listPromoCodes } from "@/server/services/growth-services";
import { createPromoAction, togglePromoAction } from "@/server/actions/admin-actions";

/** Promo codes: campaign fuel. Drop "EID45" in a TikTok video → 45-day trials,
 *  and Growth shows exactly how many signups each code brought. */
export default async function AdminPromosPage() {
  await requireAdmin();
  const promos = await listPromoCodes();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Promo codes</h1>
        <p className="text-sm text-muted">
          A code = a longer free trial + tracking. Put different codes in different places (TikTok, seller groups,
          influencers) and you&apos;ll know exactly what works.
        </p>
      </div>
      <form action={createPromoAction} className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4">
        <label className="text-xs text-muted">
          Code
          <input name="code" className="mt-1 block w-36 rounded-xl border border-line bg-white px-3 py-2 text-sm uppercase text-ink outline-none focus:border-primary" placeholder="EID45" required />
        </label>
        <label className="text-xs text-muted">
          Trial days
          <input name="trialDays" type="number" min={7} max={120} defaultValue={45} className="mt-1 block w-24 rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary" />
        </label>
        <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Create code
        </button>
      </form>
      {promos.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <ul className="divide-y divide-line">
            {promos.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    <code className="rounded bg-[#f3f5f2] px-1.5 py-0.5">{p.code}</code>
                    {!p.isActive && <span className="ml-2 text-xs font-normal text-muted">(off)</span>}
                  </p>
                  <p className="text-[11px] text-muted">{p.trialDays}-day trial · used {p.uses} time{p.uses === 1 ? "" : "s"}</p>
                </div>
                <form action={togglePromoAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="active" value={p.isActive ? "false" : "true"} />
                  <button type="submit" className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-primary">
                    {p.isActive ? "Turn off" : "Turn on"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
