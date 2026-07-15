import Link from "next/link";
import type { ReactNode } from "react";
import type { Shop, Product, Category } from "@/server/types";
import { ShopBanner } from "./shop-banner";
import { CategoryNav } from "./category-nav";
import { ProductCard } from "./product-card";
import { ProductGrid } from "./product-grid";
import { ImagePlaceholder } from "./image-placeholder";
import { NewsletterOptIn } from "./notify-me";
import { SaleBanner } from "./sale-banner";
import { DropCountdown } from "./drop-countdown";
import { saleActive, salePrice } from "@/lib/sale";
import { formatCurrency } from "@/lib/format";
import { type TemplateConfig, headingFontClass, radiusClass, buttonShapeClass } from "@/server/storefront-templates";
import type { TrustInfo } from "@/server/trust";
import { getLang } from "@/lib/get-lang";
import { tr } from "@/lib/i18n";

type Ratings = Map<string, { count: number; average: number }>;

async function FeaturedCard({
  shop,
  product,
  config,
  headFont,
}: {
  shop: Shop;
  product: Product;
  config: TemplateConfig;
  headFont: string;
}) {
  const eff = salePrice(product.price, shop);
  const flash = eff < product.price;
  const onSale = flash || (product.compareAtPrice != null && product.compareAtPrice > product.price);
  const wasPrice = flash ? product.price : product.compareAtPrice;
  const lang = await getLang();
  return (
    <Link
      href={`/${shop.slug}/product/${product.id}`}
      className={"group block overflow-hidden border border-line bg-surface shadow-[0_1px_3px_rgba(34,30,27,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(34,30,27,0.22)] " + radiusClass(config.radius)}
    >
      <div className="relative aspect-[16/10] w-full">
        {product.imageUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img loading="lazy" decoding="async" src={product.imageUrls[0]} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <ImagePlaceholder className="h-full w-full" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-semibold text-white">
          {tr(lang, "featured")}
        </span>
      </div>
      <div className="p-4">
        <p className={"text-lg font-semibold text-ink " + headFont}>{product.name}</p>
        <p className="mt-1 text-base font-semibold text-ink">
          {formatCurrency(eff, shop.currency)}
          {onSale && (
            <span className="ml-1.5 text-sm font-normal text-muted line-through">
              {formatCurrency(wasPrice!, shop.currency)}
            </span>
          )}
        </p>
        {product.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{product.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}</p>}
      </div>
    </Link>
  );
}

export async function StorefrontHome({
  shop,
  products,
  categories,
  ratings,
  config,
  trust,
  delivered,
  reviewAvg,
  reviewCount,
}: {
  shop: Shop;
  products: Product[];
  categories: Category[];
  ratings: Ratings;
  config: TemplateConfig;
  trust: TrustInfo;
  delivered: number;
  reviewAvg: number;
  reviewCount: number;
}) {
  const headFont = headingFontClass(config.headingFont);
  const accent = shop.themeColor || "#8E2C5A";
  const nowMs = Date.now();
  const upcoming = products.filter((p) => p.dropAt && new Date(p.dropAt).getTime() > nowMs);
  const liveProducts = products.filter((p) => !p.dropAt || new Date(p.dropAt).getTime() <= nowMs);
  const lang = await getLang();

  let hero: ReactNode = null;
  if (config.hero === "banner") {
    hero = <ShopBanner shop={shop} />;
  } else if (config.hero === "full") {
    const isImage = shop.bannerStyle === "image" && !!shop.bannerImage;
    hero = (
      <section
        className="relative -mx-4 overflow-hidden px-6 py-14 text-white sm:mx-0 sm:rounded-2xl"
        style={
          isImage
            ? { backgroundImage: `url(${shop.bannerImage})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { backgroundColor: accent }
        }
      >
        {isImage ? (
          <div className="absolute inset-0 bg-black/45" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/25" />
        )}
        <div className="relative">
          <h2 className={"text-3xl font-bold leading-tight sm:text-4xl " + headFont}>
            {shop.bannerHeading || shop.name}
          </h2>
          {(shop.bannerSubtext || shop.tagline) && (
            <p className="mt-2 max-w-lg text-sm text-white/90">{shop.bannerSubtext || shop.tagline}</p>
          )}
          <a href="#products" className={"mt-5 inline-block bg-white px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:shadow-md " + buttonShapeClass(config.buttonStyle)} style={{ color: accent }}>
            {tr(lang, "shopNow")}
          </a>
        </div>
      </section>
    );
  } else if (config.hero === "minimal") {
    hero = (
      <section className="pt-2">
        <h2 className={"text-2xl font-semibold tracking-tight text-ink " + headFont}>
          {shop.bannerHeading || shop.name}
        </h2>
        {(shop.bannerSubtext || shop.tagline) && (
          <p className="mt-1 max-w-md text-sm text-muted">{shop.bannerSubtext || shop.tagline}</p>
        )}
        <div className="mt-4 h-px w-full bg-line" />
      </section>
    );
  } else if (config.hero === "gradient") {
    hero = (
      <section
        className="relative -mx-4 overflow-hidden px-6 py-14 text-white sm:mx-0 sm:rounded-3xl"
        style={{ background: `linear-gradient(120deg, ${accent}, ${accent}CC 55%, #1c2b26)` }}
      >
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative">
          <h2 className={"text-3xl font-bold leading-tight sm:text-4xl " + headFont}>
            {shop.bannerHeading || shop.name}
          </h2>
          {(shop.bannerSubtext || shop.tagline) && (
            <p className="mt-2 max-w-lg text-sm text-white/90">{shop.bannerSubtext || shop.tagline}</p>
          )}
          <a href="#products" className={"mt-5 inline-block bg-white px-6 py-2.5 text-sm font-semibold shadow-sm transition hover:shadow-md " + buttonShapeClass(config.buttonStyle)} style={{ color: accent }}>
            {tr(lang, "shopNow")} →
          </a>
        </div>
      </section>
    );
  } else if (config.hero === "centered") {
    hero = (
      <section className="flex flex-col items-center pt-3 text-center">
        <h2 className={"text-2xl font-semibold tracking-wide text-ink " + headFont}>
          {shop.bannerHeading || shop.name}
        </h2>
        {(shop.bannerSubtext || shop.tagline) && (
          <p className="mt-1 max-w-md text-sm text-muted">{shop.bannerSubtext || shop.tagline}</p>
        )}
        <div className="mt-4 h-px w-16" style={{ backgroundColor: accent }} />
      </section>
    );
  }

  const showTrust = trust.verified || trust.tier === "new" || delivered > 0 || reviewCount > 0;
  const trustRow = showTrust ? (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {trust.verified && (
        <span className="rounded-full bg-[#E7F2EC] px-2.5 py-1 font-medium text-[#2C6B57]">{tr(lang, "verified")} ✓</span>
      )}
      {trust.tier === "trusted" && (
        <span className="rounded-full bg-[#EAF1FB] px-2.5 py-1 font-medium text-[#1f4f86]">{tr(lang, "trustedSeller")}</span>
      )}
      {trust.tier === "new" && !trust.verified && (
        <span className="rounded-full bg-[#F1EFEB] px-2.5 py-1 font-medium text-muted">{tr(lang, "newSeller")}</span>
      )}
      {delivered > 0 && (
        <span className="rounded-full bg-[#F1EFEB] px-2.5 py-1 text-muted">{delivered} {tr(lang, "ordersDelivered")}</span>
      )}
      {reviewCount > 0 && (
        <span className="rounded-full bg-[#F1EFEB] px-2.5 py-1 text-muted">★ {reviewAvg} ({reviewCount})</span>
      )}
    </div>
  ) : null;

  const mkCard = (p: Product) => (
    <ProductCard key={p.id} shop={shop} product={p} rating={ratings.get(p.id)} config={config} />
  );
  let grid: ReactNode;
  if (config.grid === "magazine") {
    const [first, ...rest] = liveProducts;
    grid = (
      <div className="space-y-4">
        {first && <FeaturedCard shop={shop} product={first} config={config} headFont={headFont} />}
        {rest.length > 0 && <ProductGrid cards={rest.map(mkCard)} layout="g2" />}
      </div>
    );
  } else {
    const layout: "g2" | "g2gap" | "list" =
      config.grid === "list" ? "list" : config.grid === "g2gap" ? "g2gap" : "g2";
    grid = <ProductGrid cards={liveProducts.map(mkCard)} layout={layout} />;
  }

  return (
    <div className="space-y-4">
      {saleActive(shop) && <SaleBanner percent={shop.salePercent as number} endsAt={shop.saleEndsAt as string} />}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          {upcoming.slice(0, 3).map((p) => (
            <Link
              key={p.id}
              href={`/${shop.slug}/product/${p.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border-2 border-ink/80 bg-surface px-4 py-3 transition hover:border-primary"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">🚀 Dropping soon</p>
                <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
              </div>
              <DropCountdown dropAt={p.dropAt as string} />
            </Link>
          ))}
        </div>
      )}
      {hero}
      {trustRow}
      <div id="products" />
      <CategoryNav shopSlug={shop.slug} categories={categories} />
      {shop.freeDeliveryOver !== null && (
        <p className="text-xs text-muted">
          {tr(lang, "freeDeliveryOver")} {formatCurrency(shop.freeDeliveryOver, shop.currency)}
        </p>
      )}
      {products.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">{tr(lang, "noProducts")}</p>
      ) : (
        grid
      )}
      {products.length > 0 && (
        <a
          href={`https://wa.me/${shop.whatsapp}?text=${encodeURIComponent("Hi! I saw your shop and have a question")}`}
          target="_blank"
          rel="noopener noreferrer"
          className={"mt-2 flex items-center justify-center gap-2 border border-line bg-surface px-4 py-3 text-sm font-medium text-ink transition hover:border-primary " + radiusClass(config.radius)}
        >
          💬 Not sure what to pick?{" "}
          <span className="font-semibold" style={{ color: accent }}>
            WhatsApp us — we reply fast
          </span>
        </a>
      )}
      {products.length > 0 && (
        <div className="pt-4">
          <NewsletterOptIn slug={shop.slug} shopName={shop.name} />
        </div>
      )}
    </div>
  );
}
