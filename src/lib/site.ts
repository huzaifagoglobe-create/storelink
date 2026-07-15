// One place to set your public URL + product name (used for SEO, sitemap, robots).
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://storelink.pk";
export const SITE_NAME = "StoreLink";

// ── Support contact ──────────────────────────────────────────────────────────
// Put YOUR StoreLink support WhatsApp number here (international digits, NO "+").
// A Pakistani number looks like "923001234567".
// You can also set it via the NEXT_PUBLIC_SUPPORT_WHATSAPP env var instead of
// editing this line.
export const SUPPORT_WHATSAPP =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "923390331975"; // ← your support number

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@storelink.pk";

/**
 * "Talk to us" link for upgrade / activate / support buttons.
 * ALWAYS opens WhatsApp — never an email app — so it can never open your
 * personal or any other mail account. Set SUPPORT_WHATSAPP above.
 */
export function supportLink(message: string): string {
  const text = encodeURIComponent(message);
  return SUPPORT_WHATSAPP
    ? `https://wa.me/${SUPPORT_WHATSAPP}?text=${text}`
    : `https://wa.me/?text=${text}`;
}
