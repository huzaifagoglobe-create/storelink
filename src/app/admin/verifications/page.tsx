import { requireAdmin } from "@/server/auth/current-admin";
import { listPendingVerifications } from "@/server/services/verification-service";
import { signedDocUrl } from "@/server/services/upload-service";
import {
  approveVerificationAction,
  rejectVerificationAction,
} from "@/server/actions/verification-actions";

export const metadata = { title: "Admin · Verifications" };

function Photo({ url, label }: { url: string | null; label: string }) {
  return (
    <div className="flex-1">
      <p className="mb-1 text-xs font-medium text-muted">{label}</p>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className="h-32 w-full rounded-lg border border-line object-cover" />
        </a>
      ) : (
        <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-line text-xs text-muted">
          No photo
        </div>
      )}
    </div>
  );
}

export default async function AdminVerifications() {
  await requireAdmin();
  const pending = await listPendingVerifications();
  // Resolve private ID docs to short-lived signed URLs (admin-only view).
  const withDocs = await Promise.all(
    pending.map(async (s) => ({
      s,
      cnicUrl: await signedDocUrl(s.cnicImageUrl),
      selfieUrl: await signedDocUrl(s.selfieImageUrl),
    }))
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Pending verifications</h1>
        <p className="text-sm text-muted">{withDocs.length} waiting for review</p>
      </div>

      {withDocs.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
          Nothing to review right now.
        </div>
      ) : (
        <ul className="space-y-3">
          {withDocs.map(({ s, cnicUrl, selfieUrl }) => {
            const notify = `https://wa.me/${s.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
              `Good news! Your shop "${s.name}" is now verified on StoreLink. You can start accepting online payments from customers.`
            )}`;
            return (
              <li key={s.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                  <p className="truncate text-xs text-muted">/{s.slug}</p>
                </div>

                {/* Face match: CNIC photo vs selfie, side by side */}
                <div className="mt-3 flex gap-3">
                  <Photo url={cnicUrl} label="CNIC photo" />
                  <Photo url={selfieUrl} label="Selfie" />
                </div>
                <p className="mt-2 rounded-lg bg-[#FBF7EC] px-3 py-2 text-xs text-[#7a5a16]">
                  Check: is this the <b>same person</b> in both photos, and does the account holder name match the CNIC?
                </p>

                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted">CNIC number</dt>
                    <dd className="text-ink">{s.cnicNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Method</dt>
                    <dd className="text-ink capitalize">{s.payoutMethod}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Account holder</dt>
                    <dd className="text-ink">{s.payoutAccountName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Account number</dt>
                    <dd className="text-ink">{s.payoutAccountNumber}</dd>
                  </div>
                </dl>

                {(s.instagramUrl || s.tiktokUrl) && (
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {s.instagramUrl && (
                      <a href={`https://${s.instagramUrl.replace(/^https?:\/\//, "")}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                        Instagram ↗
                      </a>
                    )}
                    {s.tiktokUrl && (
                      <a href={`https://${s.tiktokUrl.replace(/^https?:\/\//, "")}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                        TikTok ↗
                      </a>
                    )}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a href={notify} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-whatsapp px-3 py-1.5 text-sm font-medium text-[#1f8f4e]">
                    Notify on WhatsApp
                  </a>
                  <form action={approveVerificationAction}>
                    <input type="hidden" name="shopId" value={s.id} />
                    <button type="submit" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
                      Approve
                    </button>
                  </form>
                  <form action={rejectVerificationAction} className="flex items-center gap-2">
                    <input type="hidden" name="shopId" value={s.id} />
                    <input name="note" placeholder="Reason (optional)" className="rounded-lg border border-line px-2.5 py-1.5 text-sm" />
                    <button type="submit" className="rounded-lg border border-[#C0362C] px-3 py-1.5 text-sm font-medium text-[#C0362C]">
                      Reject
                    </button>
                  </form>
                </div>
                <p className="mt-2 text-xs text-muted">Tip: tap “Notify on WhatsApp” to message the seller, then Approve.</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
