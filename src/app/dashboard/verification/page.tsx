import { VerifiedBadgeKit } from "@/components/dashboard/verified-badge-kit";
import { requireOwner } from "@/server/auth/current-seller";
import { listShopOrders } from "@/server/services/order-service";
import { listReviewsForShop, reviewSummary } from "@/server/services/review-service";
import { computeTrust } from "@/server/trust";
import { VerificationForm } from "@/components/dashboard/verification-form";

export const metadata = { title: "Verification" };

const METHOD_LABEL: Record<string, string> = {
  easypaisa: "Easypaisa",
  jazzcash: "JazzCash",
  sadapay: "SadaPay",
  nayapay: "NayaPay",
  bank: "Bank account",
};

export default async function VerificationPage() {
  const { shop } = await requireOwner(); // payout + CNIC: owner-only
  const [orders, reviews] = await Promise.all([
    listShopOrders(shop.id),
    listReviewsForShop(shop.id),
  ]);
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const { average, count } = reviewSummary(reviews);
  const trust = computeTrust(shop, delivered, average, count);
  const status = shop.verificationStatus;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Verification &amp; trust</h1>
        <p className="text-sm text-muted">
          Get verified to accept online payments and earn buyer trust.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5">
        {status === "verified" ? (
          <div>
            <span className="inline-flex rounded-full bg-[#E7F2EC] px-2.5 py-0.5 text-xs font-medium text-[#2C6B57]">
              Verified ✓
            </span>
            <p className="mt-2 text-sm text-muted">
              Customers see a Verified badge on your shop. Payments go to:
            </p>
            <p className="mt-1 text-sm text-ink">
              {METHOD_LABEL[shop.payoutMethod ?? ""] ?? shop.payoutMethod} · {shop.payoutAccountName} ·{" "}
              {shop.payoutAccountNumber}
            </p>
          </div>
        ) : status === "pending" ? (
          <div>
            <span className="inline-flex rounded-full bg-[#FBF1DD] px-2.5 py-0.5 text-xs font-medium text-[#9A6A12]">
              Under review
            </span>
            <p className="mt-2 text-sm text-muted">
              We&apos;re checking your details and will let you know soon. Keep taking Cash-on-Delivery
              orders in the meantime.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {status === "rejected" && (
              <div className="rounded-xl bg-[#FBECEA] p-3 text-sm">
                <p className="font-medium text-[#8f231b]">Not approved</p>
                <p className="mt-1 text-[#8f231b]">
                  {shop.verificationNote ?? "Please review your details and resubmit."}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-ink">Get verified</p>
              <p className="mt-1 text-sm text-muted">
                Verify your identity and payout account to accept online payments — and earn a
                Verified badge buyers trust.
              </p>
            </div>
            <VerificationForm
              defaults={{
                payoutMethod: shop.payoutMethod,
                payoutAccountName: shop.payoutAccountName,
                payoutAccountNumber: shop.payoutAccountNumber,
                cnicNumber: shop.cnicNumber,
                cnicImageUrl: shop.cnicImageUrl,
                selfieImageUrl: shop.selfieImageUrl,
                instagramUrl: shop.instagramUrl,
                tiktokUrl: shop.tiktokUrl,
              }}
            />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm font-semibold text-ink">Your trust level</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#EEF3F0] px-2.5 py-0.5 text-xs font-medium text-ink">
            {trust.tierLabel}
          </span>
          {trust.verified && (
            <span className="rounded-full bg-[#E7F2EC] px-2.5 py-0.5 text-xs font-medium text-[#2C6B57]">
              Verified ✓
            </span>
          )}
        </div>
        <ul className="mt-3 space-y-1 text-sm text-muted">
          <li>
            Delivered orders: <b className="text-ink">{delivered}</b>
          </li>
          <li>
            Rating: <b className="text-ink">{count ? `${average} ★ (${count})` : "No reviews yet"}</b>
          </li>
        </ul>
        <p className="mt-3 text-sm text-muted">
          {trust.verified
            ? "You can accept online payments."
            : "Get verified to start accepting online payments."}
        </p>
      </div>

      {shop.verificationStatus === "verified" && <VerifiedBadgeKit slug={shop.slug} shopName={shop.name} />}
    </div>
  );
}
