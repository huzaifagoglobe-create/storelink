import { requireSeller } from "@/server/auth/current-seller";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { DangerZone } from "@/components/dashboard/danger-zone";

export default async function SettingsPage() {
  const { shop, isOwner } = await requireSeller();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Shop settings</h1>
        <p className="text-sm text-muted">
          Update your shop details, delivery and payment info.
        </p>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5">
        <SettingsForm shop={shop} />
      {isOwner && <DangerZone slug={shop.slug} />}
      </div>
    </div>
  );
}
