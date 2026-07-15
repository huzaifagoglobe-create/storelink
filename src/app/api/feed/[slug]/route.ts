import { NextResponse } from "next/server";
import { getShopBySlug } from "@/server/services/shop-service";
import { getProductsByShop } from "@/server/services/product-service";
import { salePrice } from "@/lib/sale";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Google Merchant / Meta Catalog product feed (RSS 2.0 with the g: namespace).
 * Sellers paste this URL into Google Merchant Center → their products appear in
 * Google Shopping for free; the same feed works for Instagram/Facebook Shops.
 */
export async function GET(_req: Request, { params: _p }: { params: Promise<{ slug: string }> }) {
  const { slug } = await _p;
  const shop = await getShopBySlug(slug);
  if (!shop || !shop.isActive) return new NextResponse("Not found", { status: 404 });

  const products = (await getProductsByShop(shop.id)).filter(
    (p) => p.isActive && (!p.dropAt || new Date(p.dropAt).getTime() <= Date.now())
  );

  const items = products
    .map((p) => {
      const url = `${SITE_URL}/${shop.slug}/product/${p.id}`;
      const img = p.imageUrls[0] ? (p.imageUrls[0].startsWith("http") ? p.imageUrls[0] : `${SITE_URL}${p.imageUrls[0]}`) : "";
      const price = salePrice(p.price, shop);
      return `  <item>
    <g:id>${esc(p.id)}</g:id>
    <g:title>${esc(p.name)}</g:title>
    <g:description>${esc((p.description || p.name).slice(0, 4900))}</g:description>
    <g:link>${esc(url)}</g:link>${img ? `\n    <g:image_link>${esc(img)}</g:image_link>` : ""}
    <g:price>${price}.00 PKR</g:price>${price < p.price ? `\n    <g:sale_price>${price}.00 PKR</g:sale_price>` : ""}
    <g:availability>${p.stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>
    <g:condition>new</g:condition>
    <g:brand>${esc(shop.name)}</g:brand>
    <g:identifier_exists>false</g:identifier_exists>
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>${esc(shop.name)}</title>
  <link>${esc(`${SITE_URL}/${shop.slug}`)}</link>
  <description>${esc(shop.tagline || shop.name)}</description>
${items}
</channel>
</rss>`;

  return new NextResponse(xml, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=1800" },
  });
}
