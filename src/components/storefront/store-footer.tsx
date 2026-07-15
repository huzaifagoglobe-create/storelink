import Link from "next/link";
import type { Shop } from "@/server/types";
import { type TemplateConfig, headingFontClass } from "@/server/storefront-templates";
import { shopPages } from "@/lib/shop-pages";

function SocialIcon({ href, label, d }: { href: string; label: string; d: string }) {
  const url = href.startsWith("http") ? href : `https://${href}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:border-primary hover:text-primary"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={d} />
      </svg>
    </a>
  );
}

const ICONS = {
  instagram: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.2-1.2h.01",
  facebook: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
  tiktok: "M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5",
  youtube: "M22.5 12s0-3.5-.5-5c-.3-.9-1-1.6-1.9-1.8C18.5 4.8 12 4.8 12 4.8s-6.5 0-8.1.4C3 5.4 2.3 6.1 2 7c-.5 1.5-.5 5-.5 5s0 3.5.5 5c.3.9 1 1.6 1.9 1.8 1.6.4 8.1.4 8.1.4s6.5 0 8.1-.4c.9-.2 1.6-.9 1.9-1.8.5-1.5.5-5 .5-5ZM10 15.5v-7l6 3.5-6 3.5Z",
};

/**
 * Storefront footer: brand, social links (from the seller's settings), quick
 * links, contact, and delivery reassurance. Two visual moods driven by the
 * template config so every design feels finished from header to footer.
 */
export function StoreFooter({ shop, config }: { shop: Shop; config: TemplateConfig }) {
  const nameFont = headingFontClass(config.headingFont);
  const socials = [
    shop.instagramUrl && { href: shop.instagramUrl, label: "Instagram", d: ICONS.instagram },
    shop.facebookUrl && { href: shop.facebookUrl, label: "Facebook", d: ICONS.facebook },
    shop.tiktokUrl && { href: shop.tiktokUrl, label: "TikTok", d: ICONS.tiktok },
    shop.youtubeUrl && { href: shop.youtubeUrl, label: "YouTube", d: ICONS.youtube },
  ].filter(Boolean) as { href: string; label: string; d: string }[];
  const rich = config.footer === "rich";
  const pages = shopPages(shop);

  return (
    <footer className={"mt-10 border-t border-line " + (rich ? "bg-[#f4f7f5]" : "bg-surface")}>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:grid-cols-2 md:grid-cols-4">
        {/* Brand */}
        <div>
          <p className={"text-base font-semibold text-ink " + nameFont}>{shop.name}</p>
          {shop.tagline && <p className="mt-1 text-sm text-muted">{shop.tagline}</p>}
          {socials.length > 0 && (
            <div className="mt-3 flex gap-2">
              {socials.map((s) => (
                <SocialIcon key={s.label} {...s} />
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="text-sm">
          <p className="mb-2 font-medium text-ink">Shop</p>
          <ul className="space-y-1.5 text-muted">
            <li><Link href={`/${shop.slug}`} className="hover:text-primary">All products</Link></li>
            <li><Link href={`/${shop.slug}/search`} className="hover:text-primary">Search</Link></li>
            <li><Link href={`/${shop.slug}/wishlist`} className="hover:text-primary">Wishlist</Link></li>
            <li><Link href={`/${shop.slug}/cart`} className="hover:text-primary">Cart</Link></li>
            <li><Link href="/orders" className="hover:text-primary">Track my orders</Link></li>
          </ul>
        </div>

        {/* Information pages */}
        <div className="text-sm">
          <p className="mb-2 font-medium text-ink">Information</p>
          <ul className="space-y-1.5 text-muted">
            {pages.map((pg) => (
              <li key={pg.href}>
                <Link href={pg.href} className="hover:text-primary">{pg.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact + trust */}
        <div className="text-sm">
          <p className="mb-2 font-medium text-ink">Get in touch</p>
          <ul className="space-y-1.5 text-muted">
            <li>
              <a href={`https://wa.me/${shop.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                💬 WhatsApp us — we reply fast
              </a>
            </li>
            {shop.address && <li>📍 {shop.address}</li>}
            <li>💵 Cash on Delivery all over Pakistan</li>
            <li>📦 Tracked delivery</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {shop.name} · Powered by{" "}
        <Link href="/?src=storefront" className="font-medium text-primary hover:underline" title="Open your own shop free">StoreLink — open yours free</Link>
        {" "}·{" "}
        <Link href={`/${shop.slug}/report`} className="underline hover:text-ink">Report this shop</Link>
      </div>
    </footer>
  );
}
