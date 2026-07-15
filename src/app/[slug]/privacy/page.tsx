import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getShopBySlug } from "@/server/services/shop-service";
import { privacySections } from "@/lib/shop-pages";
import { InfoPage } from "@/components/storefront/info-page";

export async function generateMetadata({ params: _p }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await _p;
  const shop = await getShopBySlug(slug);
  if (!shop) return {};
  return { title: `Privacy policy — ${shop.name}`, description: `How ${shop.name} handles your information.` };
}

export default async function PrivacyPage({ params: _p }: { params: Promise<{ slug: string }> }) {
  const { slug } = await _p;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();
  return (
    <InfoPage
      shop={shop}
      title="Privacy policy"
      intro="Plain words about the information you share with us and how it's used."
      sections={privacySections(shop)}
    />
  );
}
