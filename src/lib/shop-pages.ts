import type { Shop } from "@/server/types";

/**
 * Content for the seller "Pages" (About / Contact / Returns / Terms / Privacy).
 * Sellers type almost nothing: About is their own short text, Returns is a
 * preset they pick, and Terms/Privacy are generated from shop details so every
 * store gets professional pages without writing a word.
 */

export const RETURN_POLICIES: Record<string, { label: string; lines: string[] }> = {
  "7day": {
    label: "7-day returns & exchange",
    lines: [
      "You can return or exchange any item within 7 days of receiving your order.",
      "Items must be unused, in original condition, with tags and packaging intact.",
      "To start a return, message us on WhatsApp with your order number — we'll guide you from there.",
      "Once we receive and check the item, we'll send your refund or exchange. Refunds are made the same way you paid, or as agreed with you on WhatsApp.",
      "Delivery charges for returns are paid by the customer, unless we sent a wrong or damaged item — then it's fully on us.",
    ],
  },
  exchange: {
    label: "Exchange only (no cash refunds)",
    lines: [
      "We offer exchanges within 7 days of delivery — for a different size, colour, or another item of the same value.",
      "Items must be unused, in original condition, with tags and packaging intact.",
      "Cash refunds are not offered, except when we sent a wrong or damaged item.",
      "To arrange an exchange, message us on WhatsApp with your order number and we'll sort it out quickly.",
    ],
  },
  none: {
    label: "All sales final",
    lines: [
      "All sales are final and items cannot be returned or exchanged.",
      "If your order arrives damaged, or you receive the wrong item, message us on WhatsApp within 48 hours with a photo — we will always make it right.",
    ],
  },
};

export function returnPolicyLines(shop: Shop): string[] | null {
  if (!shop.returnPolicy || !(shop.returnPolicy in RETURN_POLICIES)) return null;
  const lines = [...RETURN_POLICIES[shop.returnPolicy].lines];
  if (shop.returnPolicyNote) lines.push(shop.returnPolicyNote);
  return lines;
}

/** Which pages exist for this shop (drives footer links + sitemap). */
export function shopPages(shop: Shop): { href: string; label: string }[] {
  const base = `/${shop.slug}`;
  const pages: { href: string; label: string }[] = [];
  if (shop.aboutText) pages.push({ href: `${base}/about`, label: "About us" });
  pages.push({ href: `${base}/contact`, label: "Contact" });
  if (returnPolicyLines(shop)) pages.push({ href: `${base}/returns`, label: "Returns & exchange" });
  pages.push({ href: `${base}/terms`, label: "Terms" });
  pages.push({ href: `${base}/privacy`, label: "Privacy" });
  return pages;
}

/** Auto-generated Terms of Service — shop details filled in, zero typing. */
export function termsSections(shop: Shop): { heading: string; body: string }[] {
  const name = shop.name;
  return [
    {
      heading: "Who we are",
      body: `${name} is an independent online shop${shop.address ? ` based in ${shop.address}` : " in Pakistan"}, selling through this store powered by StoreLink. By placing an order you agree to these terms.`,
    },
    {
      heading: "Orders & confirmation",
      body: `When you place an order, we may confirm it with you on WhatsApp before dispatch. An order is accepted once we confirm it. Prices, product details and availability can change, and obvious pricing mistakes may be corrected before confirmation.`,
    },
    {
      heading: "Payment",
      body: `We offer Cash on Delivery across Pakistan — you pay the rider when your parcel arrives. Where shown at checkout, we may also accept online payment. Please have the exact amount ready for COD orders.`,
    },
    {
      heading: "Delivery",
      body: `Orders are dispatched with courier partners and typically arrive within 2–6 working days depending on your city. Delivery charges (if any) are shown at checkout before you place the order. Please provide a complete address and a reachable phone number — repeated failed deliveries may lead to the order being cancelled.`,
    },
    {
      heading: "Returns",
      body: shop.returnPolicy && RETURN_POLICIES[shop.returnPolicy]
        ? `Our return policy: ${RETURN_POLICIES[shop.returnPolicy].label}. Full details are on our Returns page.`
        : `For any issue with your order — damage, wrong item, or anything else — message us on WhatsApp within 48 hours of delivery and we will work it out with you.`,
    },
    {
      heading: "Fair use",
      body: `Please order only what you intend to receive. Repeated refusal of COD parcels causes real losses for a small business, and we may decline future COD orders in such cases.`,
    },
    {
      heading: "Contact & disputes",
      body: `The fastest way to reach us is WhatsApp — we reply quickly. These terms are governed by the laws of Pakistan.`,
    },
  ];
}

/** Auto-generated Privacy Policy — honest, plain-language, details filled in. */
export function privacySections(shop: Shop): { heading: string; body: string }[] {
  const name = shop.name;
  return [
    {
      heading: "What we collect",
      body: `To deliver your order, ${name} collects the details you enter at checkout: your name, phone number, delivery address, and (optionally) your email. If you tap "Notify me" or follow the shop, we save the phone number you provide.`,
    },
    {
      heading: "How we use it",
      body: `Your details are used to process and deliver your order, contact you about it on WhatsApp or by phone, and — only if you opted in — to tell you about new stock or offers. We do not sell your personal information to anyone.`,
    },
    {
      heading: "Who can see it",
      body: `Your delivery details are shared only with the courier delivering your parcel, and are stored securely by StoreLink, the platform this shop runs on.`,
    },
    {
      heading: "Cookies & analytics",
      body: `This store uses basic, privacy-friendly analytics (like page-visit counts) to understand what customers like. Your cart and preferences may be stored in your browser so the shop works smoothly.`,
    },
    {
      heading: "Your choices",
      body: `You can ask us any time to update or delete your saved details, or to stop receiving messages — just send us a WhatsApp message and we'll take care of it.`,
    },
  ];
}
