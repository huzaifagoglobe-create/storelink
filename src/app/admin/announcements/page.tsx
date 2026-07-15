import { requireAdmin } from "@/server/auth/current-admin";
import { listAnnouncements } from "@/server/services/announcement-service";
import { postAnnouncementAction, toggleAnnouncementAction } from "@/server/actions/admin-actions";

/**
 * Announcements: one banner in every seller's dashboard. You shipped the
 * features — this is how sellers find out they exist.
 */
export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const all = await listAnnouncements();
  const active = all.find((a) => a.isActive);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Announcements</h1>
        <p className="text-sm text-muted">
          Post a message and it appears as a banner in every seller&apos;s dashboard. The newest active one shows;
          sellers can dismiss it.
        </p>
      </div>

      <form action={postAnnouncementAction} className="rounded-2xl border border-line bg-surface p-4">
        <label htmlFor="ann-msg" className="text-sm font-semibold text-ink">
          New announcement
        </label>
        <textarea
          id="ann-msg"
          name="message"
          rows={2}
          maxLength={240}
          required
          className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
          placeholder="e.g. 🎉 New: Khata is live — see your real monthly profit in the sidebar!"
        />
        <button type="submit" className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Post to all sellers
        </button>
        {active && (
          <p className="mt-2 text-[11px] text-muted">Posting a new one replaces the current banner (newest active shows).</p>
        )}
      </form>

      {all.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="mb-2 text-sm font-semibold text-ink">History</p>
          <ul className="divide-y divide-line">
            {all.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className={"text-sm " + (a.isActive ? "text-ink" : "text-muted line-through")}>{a.message}</p>
                  <p className="text-[11px] text-muted">
                    {new Date(a.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                    {a.isActive ? " · live" : " · off"}
                  </p>
                </div>
                <form action={toggleAnnouncementAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="active" value={a.isActive ? "false" : "true"} />
                  <button type="submit" className="flex-none rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-primary">
                    {a.isActive ? "Turn off" : "Turn on"}
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
