import { redirect } from "next/navigation";
import { requireSeller } from "@/server/auth/current-seller";
import { listStaffByShop } from "@/server/auth/user-service";
import { removeStaffAction } from "@/server/actions/team-actions";
import { TeamForm } from "@/components/dashboard/team-form";

/**
 * Team: extra logins that run the shop day-to-day (orders, products, khata…)
 * WITHOUT owner powers — no Plan/billing, no team management, no shop deletion.
 * The seller never has to share their own password again.
 */
export default async function TeamPage() {
  const { shop, isOwner } = await requireSeller();
  if (!isOwner) redirect("/dashboard");
  const staff = await listStaffByShop(shop.id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Team</h1>
        <p className="text-sm text-muted">
          Give a helper their own login. They can manage orders, products and everything daily — and they{" "}
          <b>cannot</b> touch your plan, your team, or delete the shop. Never share your own password.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <TeamForm />
      </div>

      {staff.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-5 text-center text-sm text-muted">
          No staff logins yet. Add one above — takes 10 seconds.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <ul className="divide-y divide-line">
            {staff.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{u.fullName ?? "Staff"}</p>
                  <p className="truncate text-xs text-muted">{u.email} · Staff — can&apos;t change plan or delete shop</p>
                </div>
                <form action={removeStaffAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <button type="submit" className="flex-none rounded-lg px-2 py-1 text-xs text-[#C0362C] hover:bg-[#FBECEA]">
                    Remove access
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-[11px] text-muted">Removing access deletes their login immediately. Up to 5 staff logins per shop.</p>
    </div>
  );
}
