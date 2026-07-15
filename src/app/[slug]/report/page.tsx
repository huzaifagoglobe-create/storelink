import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopBySlug } from "@/server/services/shop-service";
import { ReportForm } from "@/components/storefront/report-form";

export const metadata = { title: "Report a shop" };

export default async function ReportPage({ params: _p }: { params: Promise<{ slug: string }> }) {
  const params = await _p;
  const shop = await getShopBySlug(params.slug);
  if (!shop) notFound();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Report {shop.name}</h1>
        <p className="text-sm text-muted">
          Tell us if something went wrong with this shop. Reports are private and help us keep buyers
          safe.
        </p>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5">
        <ReportForm slug={shop.slug} />
      </div>
      <p className="text-center text-sm">
        <Link href={`/${shop.slug}`} className="font-medium text-primary hover:underline">
          Back to the shop
        </Link>
      </p>
    </div>
  );
}
