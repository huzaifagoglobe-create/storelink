import type { MetadataRoute } from "next";
import { shopPages } from "@/lib/shop-pages";
import { bazaarLandingPages } from "@/lib/bazaar-seo";
import { listStories } from "@/server/services/growth-services";
import { SITE_URL } from "@/lib/site";
import { listAllShops } from "@/server/services/shop-service";
import { getProductsByShop } from "@/server/services/product-service";

export const revalidate = 3600; // refresh hourly

// Lists the marketing pages plus every ACTIVE shop and its products, so Google
// can discover real storefronts (not just a hardcoded demo).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const out: MetadataRoute.Sitemap = ["", "/signup", "/login", "/privacy", "/terms", "/bazaar", "/orders", "/stats", "/compare", "/stories", "/learn", "/learn/start-selling-online-pakistan", "/learn/reduce-cod-parcel-refusals", "/learn/instagram-selling-tips-pakistan", "/learn/price-products-online-pakistan", "/tools/cod-calculator", "/tools/caption-generator", "/features", "/pricing", "/how-it-works", "/about", "/contact", "/faq", "/demo"].map(
    (path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: path === "" ? 1 : 0.6,
    })
  );

  try {
    const shops = (await listAllShops()).filter((s) => s.isActive);
    // Bazaar SEO landing pages (only combos with real verified shops).
    for (const st of await listStories(true)) {
      out.push({ url: `${SITE_URL}/stories/${st.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 });
    }
    for (const pg of bazaarLandingPages(shops)) {
      out.push({ url: `${SITE_URL}${pg.href}`, lastModified: now, changeFrequency: "daily", priority: 0.7 });
    }
    for (const shop of shops) {
      if (out.length > 4900) break; // keep the sitemap a sane size
      out.push({
        url: `${SITE_URL}/${shop.slug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.8,
      });
      // Seller "Pages" — indexed so each store looks complete to Google.
      for (const pg of shopPages(shop)) {
        if (out.length > 4900) break;
        out.push({
          url: `${SITE_URL}${pg.href}`,
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.3,
        });
      }
      const products = await getProductsByShop(shop.id);
      for (const p of products) {
        if (out.length > 4900) break;
        out.push({
          url: `${SITE_URL}/${shop.slug}/product/${p.id}`,
          lastModified: new Date(p.createdAt),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  } catch (e) {
    console.error("sitemap:", e);
  }
  return out;
}
