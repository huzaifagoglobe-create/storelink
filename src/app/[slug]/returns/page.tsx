import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getShopBySlug } from "@/server/services/shop-service";
import { returnPolicyLines, RETURN_POLICIES } from "@/lib/shop-pages";
import { InfoPage } from "@/components/storefront/info-page";

export async function generateMetadata({ params: _p }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await _p;
  const shop = await getShopBySlug(slug);
  if (!shop) return {};
  return { title: `Returns & exchange — ${shop.name}`, description: `Return and exchange policy for ${shop.name}.` };
}

export default async function ReturnsPage({ params: _p }: { params: Promise<{ slug: string }> }) {
  const { slug } = await _p;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();
  const lines = returnPolicyLines(shop);
  if (!lines) notFound();
  return (
    <InfoPage
      shop={shop}
      title="Returns & exchange"
      intro={RETURN_POLICIES[shop.returnPolicy as string].label}
      paragraphs={lines}
    />
  );
}
