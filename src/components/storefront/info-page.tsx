import type { Shop } from "@/server/types";
import { getTemplate, headingFontClass } from "@/server/storefront-templates";

/**
 * Shared shell for the seller "Pages" (About / Returns / Terms / Privacy) —
 * clean typographic layout that follows the shop's template design.
 */
export function InfoPage({
  shop,
  title,
  intro,
  sections,
  paragraphs,
}: {
  shop: Shop;
  title: string;
  intro?: string;
  sections?: { heading: string; body: string }[];
  paragraphs?: string[];
}) {
  const config = getTemplate(shop.template);
  const headFont = headingFontClass(config.headingFont);
  return (
    <article className="mx-auto max-w-2xl py-4">
      <h1 className={"text-2xl font-semibold text-ink " + headFont}>{title}</h1>
      {intro && <p className="mt-2 text-sm text-muted">{intro}</p>}
      {paragraphs && (
        <div className="mt-5 space-y-3">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-ink">
              {p}
            </p>
          ))}
        </div>
      )}
      {sections && (
        <div className="mt-6 space-y-5">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className={"text-base font-semibold text-ink " + headFont}>{s.heading}</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-ink">{s.body}</p>
            </section>
          ))}
        </div>
      )}
      <div className="mt-8 rounded-2xl border border-line bg-surface p-4 text-sm">
        <p className="font-medium text-ink">Questions? We&apos;re one message away.</p>
        <a
          href={`https://wa.me/${shop.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block rounded-xl bg-whatsapp px-4 py-2 text-sm font-medium text-whatsapp-foreground"
        >
          💬 WhatsApp {shop.name}
        </a>
      </div>
    </article>
  );
}
