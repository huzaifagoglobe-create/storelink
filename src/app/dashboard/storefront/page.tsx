import { applyFestivalKitAction } from "@/server/actions/flash-sale-actions";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { requireSeller } from "@/server/auth/current-seller";
import { StorefrontForm } from "@/components/dashboard/storefront-form";

export default async function StorefrontPage() {
  const { shop } = await requireSeller();

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const url = `${proto}://${host}/${shop.slug}`;
  const qr = await QRCode.toDataURL(url, {
    width: 240,
    margin: 1,
    color: { dark: "#232C28", light: "#ffffff" },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-ink">Storefront</h1>
        <p className="text-sm text-muted">Customise how your shop looks to customers.</p>
      </div>

      <StorefrontForm shop={shop} />

      <div className="max-w-2xl rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm font-semibold text-ink">🎉 Festival kits — one tap</p>
        <p className="mb-3 mt-1 text-xs text-muted">
          Instantly dress your shop for the season: applies a ready-made banner heading &amp; text. Pair it with a
          flash sale on the Discounts page for maximum effect. You can edit or replace it any time above.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            ["eid", "Eid ✨"],
            ["ramadan", "Ramadan 🌙"],
            ["wedding", "Shaadi season 💍"],
            ["sale", "SALE 🔥"],
            ["eleven", "11.11 🛍️"],
          ].map(([k, label]) => (
            <form key={k} action={applyFestivalKitAction}>
              <input type="hidden" name="kit" value={k} />
              <button type="submit" className="rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink transition hover:border-primary">
                {label}
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className="max-w-2xl rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm font-semibold text-ink">Your shop QR code</p>
        <p className="mt-0.5 text-sm text-muted">
          Print it for your shop, packaging, or business card. Scanning opens your store.
        </p>
        <div className="mt-4 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Shop QR code" width={112} height={112} className="rounded-lg border border-line" />
          <div className="min-w-0 text-sm">
            <p className="truncate text-muted">{url}</p>
            <a
              href={qr}
              download={`${shop.slug}-qr.png`}
              className="mt-2 inline-flex rounded-xl border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-primary"
            >
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
