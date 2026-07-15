import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getShopBySlug } from "@/server/services/shop-service";
import { getTemplate, headingFontClass } from "@/server/storefront-templates";

export async function generateMetadata({ params: _p }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await _p;
  const shop = await getShopBySlug(slug);
  if (!shop) return {};
  return { title: `Contact — ${shop.name}`, description: `Get in touch with ${shop.name} — we reply fast on WhatsApp.` };
}

export default async function ContactPage({ params: _p }: { params: Promise<{ slug: string }> }) {
  const { slug } = await _p;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();
  const headFont = headingFontClass(getTemplate(shop.template).headingFont);
  const socials = [
    shop.instagramUrl && { label: "Instagram", href: shop.instagramUrl },
    shop.facebookUrl && { label: "Facebook", href: shop.facebookUrl },
    shop.tiktokUrl && { label: "TikTok", href: shop.tiktokUrl },
    shop.youtubeUrl && { label: "YouTube", href: shop.youtubeUrl },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <div className="mx-auto max-w-2xl py-4">
      <h1 className={"text-2xl font-semibold text-ink " + headFont}>Contact {shop.name}</h1>
      <p className="mt-2 text-sm text-muted">The fastest way to reach us is WhatsApp — we reply fast.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <a
          href={`https://wa.me/${shop.whatsapp}?text=${encodeURIComponent("Hi! I have a question about your shop")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-line bg-surface p-4 transition hover:border-primary"
        >
          <p className="text-sm font-semibold text-ink">💬 WhatsApp</p>
          <p className="mt-1 text-sm text-muted">Tap to open a chat — questions, orders, sizes, anything.</p>
        </a>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-sm font-semibold text-ink">📞 Phone</p>
          <p className="mt-1 text-sm text-muted">{shop.whatsapp}</p>
        </div>
        {shop.address && (
          <div className="rounded-2xl border border-line bg-surface p-4 sm:col-span-2">
            <p className="text-sm font-semibold text-ink">📍 Location</p>
            <p className="mt-1 text-sm text-muted">{shop.address}</p>
          </div>
        )}
        {socials.length > 0 && (
          <div className="rounded-2xl border border-line bg-surface p-4 sm:col-span-2">
            <p className="text-sm font-semibold text-ink">Follow us</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href.startsWith("http") ? s.href : `https://${s.href}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-line px-3 py-1.5 text-sm text-ink transition hover:border-primary hover:text-primary"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
