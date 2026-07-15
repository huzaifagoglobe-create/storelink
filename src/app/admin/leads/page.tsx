import { requireAdmin } from "@/server/auth/current-admin";
import { listSellerLeads } from "@/server/services/growth-services";
import { setLeadStatusAction } from "@/server/actions/admin-actions";

const STATUS_STYLE: Record<string, string> = {
  new: "bg-[#FBF7EC] text-[#8a6d1f]",
  contacted: "bg-[#EAF1FB] text-[#1f4f86]",
  won: "bg-[#E7F2EC] text-[#2C6B57]",
  lost: "bg-[#f1f4f2] text-muted",
};

/**
 * The founder's pipeline: everyone who tapped "Get my shop built free".
 * Message them, flip the status, close them. No lead rots in silence.
 */
export default async function AdminLeadsPage() {
  await requireAdmin();
  const leads = await listSellerLeads();
  const counts = { new: 0, contacted: 0, won: 0, lost: 0 } as Record<string, number>;
  for (const l of leads) counts[l.status] = (counts[l.status] ?? 0) + 1;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Leads</h1>
        <p className="text-sm text-muted">
          Prospects from the &quot;Get your shop built free&quot; form. Message → flip the status → close.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {(["new", "contacted", "won", "lost"] as const).map((k) => (
          <div key={k} className="rounded-2xl border border-line bg-surface p-3 text-center">
            <p className="text-lg font-semibold text-ink">{counts[k]}</p>
            <p className="text-[11px] capitalize text-muted">{k}</p>
          </div>
        ))}
      </div>

      {leads.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
          No leads yet. They arrive here from the homepage form the moment someone&apos;s interested.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <ul className="divide-y divide-line">
            {leads.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {l.name}
                    <span className={"ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium " + (STATUS_STYLE[l.status] ?? "")}>{l.status}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {l.whatsapp}
                    {l.selling ? ` · sells: ${l.selling}` : ""}
                    {l.source ? ` · via ${l.source}` : ""} ·{" "}
                    {new Date(l.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <a
                    href={`https://wa.me/${l.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Assalam o Alaikum ${l.name}! It's StoreLink 👋 You asked about getting your online shop built${l.selling ? ` for your ${l.selling}` : ""} — I can set it up WITH you in 10 minutes, free to start. When suits you?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-whatsapp px-3 py-1.5 text-xs font-medium text-whatsapp-foreground"
                  >
                    💬 Message
                  </a>
                  <form action={setLeadStatusAction} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={l.id} />
                    <select
                      name="status"
                      defaultValue={l.status}
                      className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none"
                    >
                      <option value="new">new</option>
                      <option value="contacted">contacted</option>
                      <option value="won">won</option>
                      <option value="lost">lost</option>
                    </select>
                    <button type="submit" className="rounded-lg border border-line px-2 py-1.5 text-xs font-medium text-ink hover:border-primary">
                      Set
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
