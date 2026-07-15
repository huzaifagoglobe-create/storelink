import { requireSeller } from "@/server/auth/current-seller";
import { setFlashSaleAction, endFlashSaleAction, setReferralAction } from "@/server/actions/flash-sale-actions";
import { saleActive } from "@/lib/sale";
import { listDiscounts } from "@/server/services/discount-service";
import { toggleDiscountActiveAction, deleteDiscountAction } from "@/server/actions/discount-actions";
import { DiscountCreateForm } from "@/components/dashboard/discount-create-form";

export default async function DiscountsPage() {
  const { shop } = await requireSeller();
  const discounts = await listDiscounts(shop.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-ink">Discount codes</h1>
        <p className="text-sm text-muted">
          Create codes customers type at checkout to get money off.
        </p>
      </div>

      {/* Storewide flash sale */}
      <div className={"rounded-2xl border p-4 " + (saleActive(shop) ? "border-[#E7C98A] bg-[#FBF7EC]" : "border-line bg-surface")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-ink">🔥 Flash sale</p>
            <p className="text-xs text-muted">
              {saleActive(shop)
                ? `LIVE — ${shop.salePercent}% off everything until ${new Date(shop.saleEndsAt as string).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`
                : "Put your whole shop on sale with a countdown — urgency that sells."}
            </p>
          </div>
          {saleActive(shop) && (
            <form action={endFlashSaleAction}>
              <button type="submit" className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink">
                End sale now
              </button>
            </form>
          )}
        </div>
        <form action={setFlashSaleAction} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-xs text-muted">
            Percent off
            <input
              name="percent"
              type="number"
              min={1}
              max={90}
              defaultValue={shop.salePercent ?? 20}
              required
              className="mt-1 block w-24 rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </label>
          <label className="text-xs text-muted">
            Ends at
            <input
              name="endsAt"
              type="datetime-local"
              required
              className="mt-1 block rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </label>
          <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            {saleActive(shop) ? "Update sale" : "Start sale"}
          </button>
        </form>
      </div>

      {/* Referral rewards */}
      <div className={"rounded-2xl border p-4 " + (shop.referralAmount ? "border-[#bfe0cd] bg-[#EAF3EE]" : "border-line bg-surface")}>
        <p className="text-sm font-semibold text-ink">💚 Referral rewards {shop.referralAmount ? "— ON" : ""}</p>
        <p className="mt-1 text-xs text-muted">
          Your customers become your marketing. After delivery, buyers get a personal link — their friend gets Rs off
          the first order, and they earn the same off their next one (applied automatically). You only give a discount
          on sales you wouldn&apos;t have had.
        </p>
        <form action={setReferralAction} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-xs text-muted">
            Reward amount (Rs)
            <input
              name="referralAmount"
              type="number"
              min={0}
              max={5000}
              defaultValue={shop.referralAmount ?? 150}
              className="mt-1 block w-28 rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </label>
          <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            {shop.referralAmount ? "Update" : "Turn on"}
          </button>
          {shop.referralAmount ? (
            <button type="submit" name="referralAmount" value="0" className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium text-ink">
              Turn off
            </button>
          ) : null}
        </form>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <DiscountCreateForm />
      </div>

      {discounts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
          No discount codes yet. Add one above.
        </p>
      ) : (
        <ul className="space-y-2">
          {discounts.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-3"
            >
              <div className="flex-1">
                <p className="font-mono text-sm font-semibold text-ink">{d.code}</p>
                <p className="text-xs text-muted">
                  {d.type === "percent" ? `${d.value}% off` : `Rs ${d.value} off`}
                  {d.isActive ? "" : " · paused"}
                </p>
              </div>
              <form action={toggleDiscountActiveAction}>
                <input type="hidden" name="id" value={d.id} />
                <input type="hidden" name="next" value={d.isActive ? "" : "on"} />
                <button
                  type="submit"
                  className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-[#eef3f0]"
                >
                  {d.isActive ? "Pause" : "Activate"}
                </button>
              </form>
              <form action={deleteDiscountAction}>
                <input type="hidden" name="id" value={d.id} />
                <button
                  type="submit"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#C0362C] transition hover:bg-[#FBECEA]"
                >
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
