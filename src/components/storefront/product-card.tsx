import Link from "next/link";
import type { Product, Shop } from "@/server/types";
import { formatCurrency } from "@/lib/format";
import { salePrice } from "@/lib/sale";
import { ImagePlaceholder } from "./image-placeholder";
import { WishlistButton } from "./wishlist-button";
import { type TemplateConfig, radiusClass, headingFontClass } from "@/server/storefront-templates";
import { getLang } from "@/lib/get-lang";
import { tr, type StringKey } from "@/lib/i18n";

const TAGS: Record<string, { key: StringKey; cls: string }> = {
  hot: { key: "tagHot", cls: "bg-[#B45309] text-white" },
  bestseller: { key: "tagBestseller", cls: "bg-primary text-primary-foreground" },
  new: { key: "tagNew", cls: "bg-accent text-[#1E3A30]" },
};

export async function ProductCard({
  shop,
  product,
  rating,
  config,
}: {
  shop: Shop;
  product: Product;
  rating?: { count: number; average: number };
  config: TemplateConfig;
}) {
  const outOfStock = product.stock <= 0;
  const lang = await getLang();
  const eff = salePrice(product.price, shop);
  const flash = eff < product.price;
  const onSale = flash || (product.compareAtPrice != null && product.compareAtPrice > product.price);
  const wasPrice = flash ? product.price : product.compareAtPrice;
  const tag = product.tag ? TAGS[product.tag] : null;
  const r = radiusClass(config.radius);
  const nameFont = headingFontClass(config.headingFont);
  const href = `/${shop.slug}/product/${product.id}`;

  const Price = (
    <p className="text-sm font-medium text-ink">
      {formatCurrency(eff, shop.currency)}
      {onSale && (
        <span className="ml-1.5 text-xs font-normal text-muted line-through">
          {formatCurrency(wasPrice!, shop.currency)}
        </span>
      )}
    </p>
  );
  const Rating =
    rating && rating.count > 0 ? (
      <p className="flex items-center gap-1 text-xs text-muted">
        <span style={{ color: "#E8A317" }}>★</span> {rating.average} ({rating.count})
      </p>
    ) : null;
  const Badges = (
    <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
      {onSale && <span className="rounded-full bg-[#C0362C] px-2 py-0.5 text-[10px] font-semibold text-white">{tr(lang, "sale")}</span>}
      {tag && <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold " + tag.cls}>{tr(lang, tag.key)}</span>}
    </div>
  );
  const Wish = (
    <WishlistButton item={{ productId: product.id, name: product.name, price: eff, image: product.imageUrls[0] ?? null, slug: shop.slug }} />
  );

  // LIST ROW
  if (config.card === "row") {
    return (
      <Link href={href} className={"flex items-center gap-3 border border-line bg-surface p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_-12px_rgba(34,30,27,0.18)] " + r}>
        <div className={"relative h-20 w-20 flex-none overflow-hidden " + r}>
          {product.imageUrls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" decoding="async" src={product.imageUrls[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <ImagePlaceholder className="h-full w-full" />
          )}
          {outOfStock && <div className="absolute inset-0 bg-white/55" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={"line-clamp-1 text-sm font-medium text-ink " + nameFont}>{product.name}</p>
          <div className="mt-0.5">{Price}</div>
          {Rating}
        </div>
        <span aria-hidden className="flex-none pr-1 text-lg text-muted">›</span>
      </Link>
    );
  }

  // BOLD OVERLAY
  if (config.card === "overlay") {
    return (
      <Link href={href} className={"group relative block overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_38px_-16px_rgba(34,30,27,0.32)] " + r}>
        <div className="relative aspect-[4/5] w-full">
          {product.imageUrls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" decoding="async" src={product.imageUrls[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <ImagePlaceholder className="h-full w-full" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          {Badges}
          {Wish}
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-ink/80 px-3 py-1 text-xs font-medium text-white">{tr(lang, "soldOut")}</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className={"line-clamp-2 text-sm font-semibold text-white " + nameFont}>{product.name}</p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {formatCurrency(eff, shop.currency)}
              {onSale && (
                <span className="ml-1.5 text-xs font-normal text-white/70 line-through">
                  {formatCurrency(wasPrice!, shop.currency)}
                </span>
              )}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  // CARD or FLAT (vertical)
  const flat = config.card === "flat";
  const center = config.header === "center";
  return (
    <Link
      href={href}
      className={"group block overflow-hidden transition-all duration-200 " + r + (flat ? "" : " border border-line bg-surface shadow-[0_1px_2px_rgba(34,30,27,0.05)] hover:-translate-y-1 hover:shadow-[0_14px_34px_-14px_rgba(34,30,27,0.20)]")}
    >
      <div className="relative">
        {product.imageUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img loading="lazy" decoding="async" src={product.imageUrls[0]} alt={product.name} className={"aspect-square w-full object-cover " + (flat ? r : "")} />
        ) : (
          <ImagePlaceholder className={"aspect-square w-full " + (flat ? r : "")} />
        )}
        {Badges}
        {Wish}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/55">
            <span className="rounded-full bg-ink/80 px-3 py-1 text-xs font-medium text-white">{tr(lang, "soldOut")}</span>
          </div>
        )}
      </div>
      <div className={"space-y-0.5 " + (flat ? "px-0.5 pt-2.5" : "p-3") + (center ? " text-center" : "")}>
        <p className={"line-clamp-2 text-sm font-medium text-ink " + nameFont}>{product.name}</p>
        {Price}
        {center ? <div className="flex justify-center">{Rating}</div> : Rating}
      </div>
    </Link>
  );
}
