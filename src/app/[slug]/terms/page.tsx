import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getShopBySlug } from "@/server/services/shop-service";
import { termsSections } from "@/lib/shop-pages";
import { InfoPage } from "@/components/storefront/info-page";

export async function generateMetadata({ params: _p }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await _p;
  const shop = await getShopBySlug(slug);
  if (!shop) return {};
  return { title: `Terms of service — ${shop.name}`, description: `Terms of service for ordering from ${shop.name}.` };
}

export default async function TermsPage({ params: _p }: { params: Promise<{ slug: string }> }) {
  const { slug } = await _p;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();
  return (
    <InfoPage
      shop={shop}
      title="Terms of service"
      intro={`The simple, fair terms for shopping with ${shop.name}.`}
      sections={termsSections(shop)}
    />
  );
}
