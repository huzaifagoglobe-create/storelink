import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "../src/server/services/upload-service";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("#9 image uploads", () => {
  it("accepts photos straight from a phone (10 MB)", () => {
    expect(MAX_UPLOAD_BYTES).toBe(10 * 1024 * 1024);
    expect(MAX_UPLOAD_MB).toBe(10);
  });

  it("size messages are derived from the constant, never hardcoded", () => {
    // A hardcoded "4 MB" is how the limit and the message drift apart.
    for (const f of ["src/app/api/uploads/route.ts", "src/app/api/uploads/verification/route.ts"]) {
      const s = read(f);
      expect(s, `${f} must not hardcode a size`).not.toMatch(/under 4 MB/);
      expect(s).toMatch(/MAX_UPLOAD_MB/);
    }
  });

  it("every stored image is re-encoded to WebP", () => {
    const s = read("src/server/services/upload-service.ts");
    // Both upload paths (product photos, verification docs) must go through it.
    expect((s.match(/toWebp\(/g) ?? []).length).toBeGreaterThanOrEqual(2);
    const img = read("src/server/image.ts");
    expect(img).toMatch(/contentType: "image\/webp"/);
    expect(img, "must cap dimensions so a 10 MB photo stays small").toMatch(/MAX_DIM/);
    expect(img, "must guard decompression bombs").toMatch(/limitInputPixels/);
  });

  it("the uploader checks size in the browser too", () => {
    const s = read("src/components/dashboard/image-uploader.tsx");
    expect(s).toMatch(/MAX_BYTES/);
    expect(s).toMatch(/const MAX_MB = 10/);
  });
});

describe("#2 order status colours", () => {
  it("the suggested WhatsApp message follows the order status", () => {
    const s = read("src/app/dashboard/orders/[orderNumber]/page.tsx");
    expect(s).toMatch(/updateButtons/);
    expect(s).toMatch(/suggested: order\.status === "new"/);
    expect(s).toMatch(/suggested: order\.status === "confirmed"/);
    expect(s).toMatch(/suggested: order\.status === "delivered"/);
    // green must not be welded to one button any more
    expect(s).not.toMatch(/className="rounded-xl bg-whatsapp px-3 py-2 text-xs font-medium text-whatsapp-foreground">\s*📦/);
  });
});

describe("#1 new-order alert", () => {
  const s = read("src/components/dashboard/new-order-ping.tsx");
  it("runs on every dashboard page, not just the overview", () => {
    expect(read("src/app/dashboard/layout.tsx")).toMatch(/<NewOrderPing \/>/);
  });
  it("uses all four channels", () => {
    expect(s, "sound").toMatch(/createOscillator/);
    expect(s, "tab title").toMatch(/document\.title/);
    expect(s, "OS notification").toMatch(/new Notification\(/);
    expect(s, "on-screen banner").toMatch(/role="alert"/);
  });
  it("does not auto-dismiss the banner", () => {
    // The old one hid itself after 6s; a seller who looked away lost the order.
    expect(s).not.toMatch(/setToast\(false\)/);
  });
  it("asks for notification permission once and never nags", () => {
    expect(s).toMatch(/sl-alerts-asked/);
  });
});

describe("#4 long description", () => {
  it("is stored, typed and sanitised", () => {
    expect(read("db/schema.sql")).toMatch(/add column if not exists long_description text/);
    expect(read("src/server/types.ts")).toMatch(/longDescription/);
    const a = read("src/server/actions/product-actions.ts");
    expect(a, "seller HTML must be sanitised").toMatch(/cleanRichText\(optStr\(formData\.get\("longDescription"\)/);
  });
  it("feeds SEO, not just the tab", () => {
    const s = read("src/app/[slug]/product/[productId]/page.tsx");
    expect(s, "meta description").toMatch(/longDescription/);
    expect(s, "JSON-LD").toMatch(/plainDesc/);
  });
  it("renders both bodies into the HTML so Google reads them", () => {
    const s = read("src/components/storefront/product-description-tabs.tsx");
    expect((s.match(/dangerouslySetInnerHTML/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(s, "inactive tab hidden with CSS, not unmounted").toMatch(/hidden=\{tab !== "long"\}/);
  });
});

describe("#3 out of stock", () => {
  const s = read("src/components/storefront/out-of-stock-panel.tsx");
  it("offers the wishlist when sold out", () => {
    expect(s).toMatch(/WishlistButton/);
  });
  it("never invents social proof", () => {
    expect(s).toMatch(/soldCount >= 3/);
  });
  it("frames a sell-out as popularity on the card", () => {
    expect(read("src/lib/i18n.ts")).toMatch(/soldOut: \{ en: "Sold out/);
    expect(read("src/components/storefront/product-card.tsx")).toMatch(/tr\(lang, "soldOut"\)/);
  });
  it("drops do not claim to be out of stock", () => {
    const n = read("src/components/storefront/notify-me.tsx");
    expect(n).toMatch(/context\?: "restock" \| "drop"/);
    expect(read("src/app/[slug]/product/[productId]/page.tsx")).toMatch(/context="drop"/);
  });
});
