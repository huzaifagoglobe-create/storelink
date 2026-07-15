import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getShopBySlug } from "@/server/services/shop-service";
import { InfoPage } from "@/components/storefront/info-page";

export async function generateMetadata({ params: _p }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await _p;
  const shop = await getShopBySlug(slug);
  if (!shop) return {};
  return {
    title: `About us — ${shop.name}`,
    description: (shop.aboutText ?? "").slice(0, 155) || `About ${shop.name}`,
  };
}

export default async function AboutPage({ params: _p }: { params: Promise<{ slug: string }> }) {
  const { slug } = await _p;
  const shop = await getShopBySlug(slug);
  if (!shop || !shop.aboutText) notFound();
  return (
    <InfoPage
      shop={shop}
      title={`About ${shop.name}`}
      paragraphs={shop.aboutText.split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean)}
    />
  );
}
