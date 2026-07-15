import Link from "next/link";
import type { Shop } from "@/server/types";
import { CartCount } from "./cart-count";
import { WishlistLink } from "./wishlist-link";
import { type TemplateConfig, headingFontClass } from "@/server/storefront-templates";
import { tr, type Lang } from "@/lib/i18n";

function Logo({ shop, size }: { shop: Shop; size: "sm" | "lg" }) {
  const cls = (size === "lg" ? "h-10 w-10 text-base" : "h-9 w-9 text-sm") + " flex items-center justify-center overflow-hidden rounded-full";
  if (shop.logoUrl) {
    return (
      <span className={cls + " border border-line bg-white"}>
        {/* eslint-disable-next-line @next/next/no-img-element -- seller-uploaded logo, already sized/re-encoded at upload */}
        <img src={shop.logoUrl} alt={shop.name + " logo"} className="h-full w-full object-contain" />
      </span>
    );
  }
  const initials = shop.logoText ?? shop.name.slice(0, 2).toUpperCase();
  return <span className={cls + " bg-primary font-medium text-primary-foreground"}>{initials}</span>;
}

export function ShopHeader({ shop, config, lang }: { shop: Shop; config: TemplateConfig; lang: Lang }) {
  const nameFont = headingFontClass(config.headingFont);

  const actions = (
    <div className="flex items-center gap-2">
      <form action={`/${shop.slug}/search`} className="hidden items-center sm:flex">
        <input
          name="q"
          placeholder={tr(lang, "search")}
          aria-label={tr(lang, "search")}
          className="w-36 rounded-l-xl border border-line px-3 py-2 text-xs focus:w-44 focus:outline-none"
        />
        <button type="submit" aria-label={tr(lang, "search")} className="rounded-r-xl border border-l-0 border-line bg-surface px-2.5 py-2 text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        </button>
      </form>
      <Link href={`/${shop.slug}/search`} aria-label={tr(lang, "search")} className="inline-flex items-center rounded-xl border border-line px-2.5 py-2 text-muted sm:hidden">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
      </Link>
      <WishlistLink slug={shop.slug} label={tr(lang, "wishlist")} />
      <a
        href={`https://wa.me/${shop.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-xl bg-whatsapp px-3 py-2 text-xs font-medium text-whatsapp-foreground"
      >
        {tr(lang, "chat")}
      </a>
      <Link
        href={`/${shop.slug}/cart`}
        className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-medium text-ink"
      >
        {tr(lang, "cart")}
        <CartCount />
      </Link>
    </div>
  );

  if (config.header === "center") {
    return (
      <header className="sticky top-0 z-10 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1.5 px-4 py-3 sm:px-6">
          <Link href={`/${shop.slug}`} className="flex flex-col items-center gap-1">
            <Logo shop={shop} size="lg" />
            <span className={"text-base font-semibold tracking-wide text-ink " + nameFont}>{shop.name}</span>
            {shop.tagline && <span className="text-xs text-muted">{shop.tagline}</span>}
          </Link>
          <div className="mt-1">{actions}</div>
        </div>
      </header>
    );
  }

  const bold = config.header === "bold";
  const dark = config.header === "dark";
  if (dark) {
    return (
      <header className="sticky top-0 z-10 bg-[#1c2b26] text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href={`/${shop.slug}`} className="flex items-center gap-2.5">
            <Logo shop={shop} size="sm" />
            <span className="leading-tight">
              <span className={"block text-sm font-semibold text-white " + nameFont}>{shop.name}</span>
              {shop.tagline && <span className="block text-xs text-white/60">{shop.tagline}</span>}
            </span>
          </Link>
          <div className="ms-auto">{actions}</div>
        </div>
      </header>
    );
  }
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href={`/${shop.slug}`} className="flex items-center gap-2.5">
          <Logo shop={shop} size={bold ? "lg" : "sm"} />
          <span className="leading-tight">
            <span className={(bold ? "text-base font-bold" : "text-sm font-medium") + " block text-ink " + nameFont}>
              {shop.name}
            </span>
            {shop.tagline && <span className="block text-xs text-muted">{shop.tagline}</span>}
          </span>
        </Link>
        <div className="ms-auto">{actions}</div>
      </div>
    </header>
  );
}
