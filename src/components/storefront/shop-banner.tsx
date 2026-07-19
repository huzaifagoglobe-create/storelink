import type { Shop } from "@/server/types";

export function ShopBanner({ shop }: { shop: Shop }) {
  if (shop.bannerStyle === "none") return null;
  const color = shop.themeColor || "#43705F";
  const isImage = shop.bannerStyle === "image" && !!shop.bannerImage;

  return (
    <section
      className="relative overflow-hidden rounded-2xl px-5 py-8 text-white"
      style={
        isImage
          ? {
              backgroundImage: `url(${shop.bannerImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : { backgroundColor: color }
      }
    >
      {isImage && <div className="absolute inset-0 bg-black/40" />}
      <div className="relative">
        {/* Main heading of the storefront -> h1 (one per page). */}
        <h1 className="text-xl font-semibold leading-tight">
          {shop.bannerHeading || shop.name}
        </h1>
        {shop.bannerSubtext && (
          <p className="mt-1 max-w-md text-sm text-white/90">{shop.bannerSubtext}</p>
        )}
        <a
          href="#products"
          className="mt-4 inline-block rounded-xl bg-white px-4 py-2 text-sm font-medium"
          style={{ color }}
        >
          Shop now
        </a>
      </div>
    </section>
  );
}
