import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { getShopBySlug } from "@/server/services/shop-service";
import { getProductById } from "@/server/services/product-service";
import { formatCurrency } from "@/lib/format";
import { salePrice } from "@/lib/sale";
import { AddToCart } from "@/components/storefront/add-to-cart";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { ViewBeacon } from "@/components/storefront/view-beacon";
import { NotifyMe } from "@/components/storefront/notify-me";
import { OutOfStockPanel } from "@/components/storefront/out-of-stock-panel";
import { DropCountdown } from "@/components/storefront/drop-countdown";
import { SizeChartButton } from "@/components/storefront/size-chart-button";
import { productSoldCount } from "@/server/services/order-service";
import { ShopUnavailable } from "@/components/storefront/shop-unavailable";
import { shopHasAccess, effectiveSubscriptionStatus } from "@/server/billing";
import { ProductDescriptionTabs } from "@/components/storefront/product-description-tabs";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ReviewForm } from "@/components/storefront/review-form";
import {
  listReviewsForProduct,
  reviewSummary,
  listReviewsForShop,
  summarizeByProduct,
} from "@/server/services/review-service";
import { getProductsByShop } from "@/server/services/product-service";
import { ProductCard } from "@/components/storefront/product-card";
import { getTemplate, headingFontClass, buttonShapeClass } from "@/server/storefront-templates";

export async function generateMetadata({
  params: _p,
}: {
  params: Promise<{ slug: string; productId: string }>;
}): Promise<Metadata> {
  const params = await _p;
  const shop = await getShopBySlug(params.slug);
  if (!shop) return {};
  const product = await getProductById(shop.id, params.productId);
  if (!product) return {};
  // Both descriptions feed search: the long one exists precisely so sellers who
  // write more get found more. Short first (it's the pitch), long as backup.
  const stripHtml = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const plain = [stripHtml(product.description ?? ""), stripHtml(product.longDescription ?? "")]
    .filter(Boolean)
    .join(" ");
  const description =
    plain.slice(0, 160) ||
    `${product.name} from ${shop.name}. Order on WhatsApp with cash on delivery.`;
  const url = `${SITE_URL}/${shop.slug}/product/${product.id}`;
  const images = product.imageUrls.length ? [product.imageUrls[0]] : undefined;
  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: { title: product.name, description, url, type: "website", images },
    twitter: { card: "summary_large_image", title: product.name, description, images },
  };
}

export default async function ProductPage({
  params: _p,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const params = await _p;
  const shop = await getShopBySlug(params.slug);
  if (!shop) notFound();
  if (!shopHasAccess(shop)) {
    return <ShopUnavailable shop={shop} paused={effectiveSubscriptionStatus(shop) === "paused"} />;
  }
  const product = await getProductById(shop.id, params.productId);
  if (!product) notFound();
  const reviews = await listReviewsForProduct(shop.id, product.id);
  const summary = reviewSummary(reviews);

  // "You might also like": related (same category) first, then random others.
  const allProducts = await getProductsByShop(shop.id);
  const shopReviews = await listReviewsForShop(shop.id);
  const ratings = summarizeByProduct(shopReviews);
  const config = getTemplate(shop.template);
  const relatedConfig = { ...config, card: "card" as const, header: "left" as const };
  const shuffle = <T,>(a: T[]): T[] => {
    const x = [...a];
    for (let i = x.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [x[i], x[j]] = [x[j], x[i]];
    }
    return x;
  };
  const others = allProducts.filter((p) => p.id !== product.id && p.isActive);
  const sameCat = shuffle(others.filter((p) => p.category && p.category === product.category));
  const otherCat = shuffle(others.filter((p) => !(p.category && p.category === product.category)));
  const related = [...sameCat, ...otherCat].slice(0, 4);

  const inStock = product.stock > 0;
  const eff = salePrice(product.price, shop);
  const flash = eff < product.price;
  const onSale = flash || (product.compareAtPrice != null && product.compareAtPrice > product.price);
  const wasPrice = flash ? product.price : product.compareAtPrice;
  const TAG_LABEL: Record<string, string> = { hot: "Hot", bestseller: "Best seller", new: "New" };

  const canonicalUrl = `${SITE_URL}/${shop.slug}/product/${product.id}`;
  const stripTags = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const plainDesc = [stripTags(product.description ?? ""), stripTags(product.longDescription ?? "")]
    .filter(Boolean)
    .join(" ");
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.imageUrls,
    description: plainDesc.slice(0, 500) || undefined,
    sku: product.id,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: shop.currency || "PKR",
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: canonicalUrl,
    },
    ...(summary.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: summary.average,
            reviewCount: summary.count,
          },
        }
      : {}),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: shop.name, item: `${SITE_URL}/${shop.slug}` },
      { "@type": "ListItem", position: 2, name: product.name, item: canonicalUrl },
    ],
  };
  // Escape "<" so seller-supplied text can never break out of the script tag.
  const ld = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");

  // The shop's template drives the product page too — layout, type, buttons —
  // so every template is a complete design from storefront to product page.
  const headFont = headingFontClass(config.headingFont);
  const dropPending = !!product.dropAt && new Date(product.dropAt).getTime() > Date.now();
  const soldCount = dropPending ? 0 : await productSoldCount(shop.id, product.id);
  // YouTube → inline embed id; TikTok/Instagram → external link card.
  const ytMatch = (product.videoUrl ?? "").match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/
  );
  const ytId = ytMatch ? ytMatch[1] : null;
  const btnShape = buttonShapeClass(config.buttonStyle);
  const layout = config.productLayout;
  const wrapCls =
    layout === "gallery"
      ? "space-y-6"
      : layout === "showcase"
        ? "grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start lg:gap-10"
        : "grid gap-6 lg:grid-cols-2 lg:gap-10";
  const infoCls =
    layout === "gallery"
      ? "mx-auto max-w-2xl space-y-4"
      : layout === "showcase"
        ? "space-y-4 rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-20"
        : "space-y-4";

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <ViewBeacon slug={shop.slug} kind="product" productId={product.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(breadcrumbLd) }} />
      <Link href={`/${shop.slug}`} className="inline-block text-sm text-muted">
        ← Back
      </Link>

      <div className={wrapCls}>
        <ProductGallery images={product.imageUrls} alt={product.name} />

        <div className={infoCls}>
          <div>
            <h1 className={"text-xl font-semibold text-ink lg:text-2xl " + headFont}>{product.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xl font-medium text-ink">
                {formatCurrency(eff, shop.currency)}
              </span>
              {onSale && (
                <span className="text-sm text-muted line-through">
                  {formatCurrency(wasPrice!, shop.currency)}
                </span>
              )}
              {onSale && (
                <span className="rounded-full bg-[#C0362C] px-2.5 py-0.5 text-xs font-semibold text-white">Sale</span>
              )}
              {product.tag && (
                <span className="rounded-full bg-[#EAF3EE] px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {TAG_LABEL[product.tag]}
                </span>
              )}
              {inStock ? (
                product.stock < 10 ? (
                  <span className="rounded-full bg-[#FBE7D8] px-2.5 py-0.5 text-xs font-semibold text-[#B5651D]">
                    🔥 Only {product.stock} left — order soon
                  </span>
                ) : (
                  <span className="rounded-full bg-[#DDECE3] px-2.5 py-0.5 text-xs font-medium text-[#2C6B57]">In stock</span>
                )
              ) : (
                <span className="rounded-full bg-[#ECEEED] px-2.5 py-0.5 text-xs font-medium text-muted">Out of stock</span>
              )}
              {product.sizeChartUrl && <SizeChartButton url={product.sizeChartUrl} productName={product.name} />}
              {soldCount >= 3 && (
                <span className="rounded-full bg-[#EAF1FB] px-2.5 py-0.5 text-xs font-semibold text-[#1f4f86]">
                  🔥 {soldCount} sold
                </span>
              )}
              {summary.count > 0 && (
                <span className="text-sm text-muted">
                  <span style={{ color: "#E8A317" }}>★</span> {summary.average} ({summary.count})
                </span>
              )}
            </div>
          </div>

          <ProductDescriptionTabs
            description={product.description}
            longDescription={product.longDescription}
          />

          {product.videoUrl && ytId && (
            <div className="overflow-hidden rounded-2xl border border-line">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                title={`${product.name} video`}
                className="aspect-video w-full"
                allow="accelerometer; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {product.videoUrl && !ytId && (
            <a
              href={product.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:border-primary"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-ink text-white">▶</span>
              <span className="text-sm font-medium text-ink">
                Watch the video of this product
                <span className="block text-xs font-normal text-muted">
                  Opens {product.videoUrl.includes("tiktok") ? "TikTok" : "Instagram"} in a new tab
                </span>
              </span>
            </a>
          )}

          {dropPending ? (
            <div className="rounded-2xl border-2 border-ink/80 bg-surface p-4 text-center">
              <p className="text-sm font-semibold text-ink">🚀 Dropping soon</p>
              <div className="mt-2">
                <DropCountdown dropAt={product.dropAt as string} big />
              </div>
              <p className="mt-2 text-xs text-muted">
                Nobody can order before the drop. Leave your number and we&apos;ll remind you the moment it&apos;s live.
              </p>
              <div className="mt-3 text-left">
                <NotifyMe slug={shop.slug} productId={product.id} context="drop" />
              </div>
            </div>
          ) : (
            <AddToCart
              shopSlug={shop.slug}
              options={product.options}
              variantStock={product.variantStock ?? null}
              shapeClass={btnShape}
              priceLabel={formatCurrency(eff, shop.currency)}
              product={{
                id: product.id,
                name: product.name,
                price: eff,
                image: product.imageUrls[0] ?? null,
                inStock,
              }}
            />
          )}
          <div className="mt-2">
            <WishlistButton
              size="md"
              item={{ productId: product.id, name: product.name, price: product.price, image: product.imageUrls[0] ?? null, slug: shop.slug }}
            />
          </div>

          {/* Sold out → treat it as proof the product is good, and give the
              buyer two ways to stay: get told when it's back, or save it. */}
          {!inStock && (
            <OutOfStockPanel
              slug={shop.slug}
              productId={product.id}
              productName={product.name}
              price={product.price}
              image={product.imageUrls[0] ?? null}
              soldCount={soldCount}
            />
          )}

          {/* Trust & delivery reassurance */}
          <div className="mt-4 grid gap-2 rounded-2xl border border-line bg-surface p-3 text-xs text-ink sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <span aria-hidden>🚚</span>
              <span>
                {shop.freeDeliveryOver
                  ? `Free delivery over ${formatCurrency(shop.freeDeliveryOver, shop.currency)}`
                  : shop.deliveryFee > 0
                    ? `Delivery ${formatCurrency(shop.deliveryFee, shop.currency)}`
                    : "Delivery available"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span aria-hidden>💵</span>
              <span>Cash on Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <span aria-hidden>📦</span>
              <span>Ships with tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <span aria-hidden>{shop.verificationStatus === "verified" ? "✅" : "💬"}</span>
              <span>{shop.verificationStatus === "verified" ? "Verified seller" : "Chat before you buy"}</span>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-3 border-t border-line pt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Reviews</h2>
          {summary.count > 0 && (
            <span className="text-sm text-muted">
              <span style={{ color: "#E8A317" }}>★</span> {summary.average} · {summary.count}{" "}
              {summary.count === 1 ? "review" : "reviews"}
            </span>
          )}
        </div>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted">No reviews yet. Be the first to review this product.</p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl border border-line bg-surface p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{r.author}</span>
                  <span className="text-sm" style={{ color: "#E8A317" }}>
                    {"★".repeat(r.rating)}
                    <span style={{ color: "#D6DEDA" }}>{"★".repeat(5 - r.rating)}</span>
                  </span>
                </div>
                {r.comment && <p className="mt-1 text-sm text-muted">{r.comment}</p>}
                {r.photos && r.photos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.photos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block h-16 w-16 overflow-hidden rounded-lg border border-line">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Photo from ${r.author}'s review`} loading="lazy" decoding="async" className="h-full w-full object-cover transition hover:opacity-90" />
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <ReviewForm shopSlug={shop.slug} productId={product.id} />
      </section>

      {related.length > 0 && (
        <section className="space-y-3 border-t border-line pt-5">
          <h2 className="text-base font-semibold text-ink">You might also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} shop={shop} product={p} rating={ratings.get(p.id)} config={relatedConfig} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
