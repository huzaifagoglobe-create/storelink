"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ShareProduct {
  id: string;
  name: string;
  price: number;
  image: string | null;
}

/**
 * Generates a ready-to-post product image for Instagram/Facebook/TikTok stories
 * or feed posts (and WhatsApp status): product photo, name, price, shop name
 * and link — drawn on a canvas, downloaded as PNG. Removes the seller's
 * biggest daily chore: making a nice post for each product.
 */
export function ShareCardButton({
  product,
  shopName,
  shopSlug,
  accent,
  currency,
}: {
  product: ShareProduct;
  shopName: string;
  shopSlug: string;
  accent: string;
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink transition hover:border-primary"
        aria-label={`Share ${product.name}`}
      >
        📣 Share
      </button>
      {open && (
        <ShareCardModal
          product={product}
          shopName={shopName}
          shopSlug={shopSlug}
          accent={accent}
          currency={currency}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

type Format = "story" | "post";
const SIZES: Record<Format, { w: number; h: number; label: string }> = {
  story: { w: 1080, h: 1920, label: "Story / Status (9:16)" },
  post: { w: 1080, h: 1080, label: "Post (square)" },
};

function money(n: number, currency: string) {
  return `${currency === "PKR" ? "Rs" : currency} ${n.toLocaleString("en-PK")}`;
}

// Rounded-rect path helper (canvas has no built-in on older browsers).
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ShareCardModal({
  product,
  shopName,
  shopSlug,
  accent,
  currency,
  onClose,
}: {
  product: ShareProduct;
  shopName: string;
  shopSlug: string;
  accent: string;
  currency: string;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<Format>("story");
  const [ready, setReady] = useState(false);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = SIZES[format];
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ---- background: soft vertical wash of the brand colour ----
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#ffffff");
    bg.addColorStop(1, accent + "22"); // ~13% alpha tint
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    // top brand bar
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, w, 14);

    const pad = 72;
    const isStory = format === "story";

    // ---- shop name ----
    ctx.fillStyle = "#1c2b26";
    ctx.font = `700 ${isStory ? 54 : 48}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(shopName, w / 2, isStory ? 150 : 120, w - pad * 2);

    // ---- product image area ----
    const imgTop = isStory ? 220 : 180;
    const imgSize = w - pad * 2;
    const imgH = isStory ? imgSize : Math.round(imgSize * 0.62);
    rr(ctx, pad, imgTop, imgSize, imgH, 40);
    ctx.save();
    ctx.clip();
    let drew = false;
    if (product.image) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error("img"));
          img.src = product.image as string;
        });
        // cover-fit
        const s = Math.max(imgSize / img.width, imgH / img.height);
        const dw = img.width * s;
        const dh = img.height * s;
        ctx.drawImage(img, pad + (imgSize - dw) / 2, imgTop + (imgH - dh) / 2, dw, dh);
        drew = true;
      } catch {
        drew = false;
      }
    }
    if (!drew) {
      // graceful placeholder: tinted block with the product's initials
      ctx.fillStyle = accent + "33";
      ctx.fillRect(pad, imgTop, imgSize, imgH);
      ctx.fillStyle = accent;
      ctx.font = `800 ${Math.round(imgH / 3)}px system-ui, sans-serif`;
      const initials = product.name
        .split(/\s+/)
        .slice(0, 2)
        .map((x) => x[0] ?? "")
        .join("")
        .toUpperCase();
      ctx.fillText(initials || "★", w / 2, imgTop + imgH / 2 + imgH / 9);
    }
    ctx.restore();

    // ---- product name ----
    let y = imgTop + imgH + (isStory ? 110 : 90);
    ctx.fillStyle = "#1c2b26";
    ctx.font = `700 ${isStory ? 64 : 54}px system-ui, sans-serif`;
    // wrap to max 2 lines
    const words = product.name.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > w - pad * 2 && line) {
        lines.push(line);
        line = word;
        if (lines.length === 2) break;
      } else line = test;
    }
    if (lines.length < 2 && line) lines.push(line);
    for (const l of lines.slice(0, 2)) {
      ctx.fillText(l, w / 2, y, w - pad * 2);
      y += isStory ? 76 : 66;
    }

    // ---- price pill ----
    y += isStory ? 30 : 16;
    const priceText = money(product.price, currency);
    ctx.font = `800 ${isStory ? 72 : 60}px system-ui, sans-serif`;
    const pw = ctx.measureText(priceText).width + 90;
    const ph = isStory ? 110 : 96;
    rr(ctx, (w - pw) / 2, y - ph / 2 - 14, pw, ph, ph / 2);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(priceText, w / 2, y + (isStory ? 14 : 10));

    // ---- COD chip + link footer ----
    y += isStory ? 140 : 110;
    ctx.fillStyle = "#1c2b26";
    ctx.font = `600 ${isStory ? 40 : 36}px system-ui, sans-serif`;
    ctx.fillText("✓ Cash on Delivery  ·  📦 Delivery all over Pakistan", w / 2, y, w - pad);

    const footY = h - (isStory ? 120 : 90);
    ctx.fillStyle = "#6a7b74";
    ctx.font = `500 ${isStory ? 38 : 34}px system-ui, sans-serif`;
    ctx.fillText("Order now 👇", w / 2, footY - (isStory ? 60 : 52));
    ctx.fillStyle = "#1c2b26";
    ctx.font = `700 ${isStory ? 44 : 38}px system-ui, sans-serif`;
    ctx.fillText(`storelink.pk/${shopSlug}`, w / 2, footY);

    setReady(true);
  }, [format, product, shopName, shopSlug, accent, currency]);

  useEffect(() => {
    setReady(false);
    void draw();
  }, [draw]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `${shopSlug}-${product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${format}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-surface p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Share product"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-ink">Share this product</p>
            <p className="text-xs text-muted">A ready image for Instagram, Facebook, TikTok or WhatsApp status.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-muted hover:bg-[#eef3f0]">
            ✕
          </button>
        </div>

        <div className="mb-3 flex gap-1.5">
          {(Object.keys(SIZES) as Format[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={
                "rounded-lg px-3 py-1.5 text-xs font-medium transition " +
                (format === f ? "bg-primary text-primary-foreground" : "border border-line text-ink")
              }
            >
              {SIZES[f].label}
            </button>
          ))}
        </div>

        <div className="mx-auto overflow-hidden rounded-xl border border-line bg-white" style={{ maxWidth: 250 }}>
          {/* canvas is full-res; scaled down for preview via CSS */}
          <canvas ref={canvasRef} className="block h-auto w-full" />
        </div>

        <CaptionBlock product={product} shopSlug={shopSlug} currency={currency} />

        <button
          type="button"
          onClick={download}
          disabled={!ready}
          className="mt-3 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          ⬇️ Download image
        </button>
        <p className="mt-2 text-center text-[11px] text-muted">Post it anywhere — buyers tap your link in bio to order.</p>
      </div>
    </div>
  );
}

/** Ready-to-post caption + hashtags, one tap to copy. Removes the "what do I
 *  write?" friction that stops sellers from posting daily. */
function CaptionBlock({
  product,
  shopSlug,
  currency,
}: {
  product: ShareProduct;
  shopSlug: string;
  currency: string;
}) {
  const [copied, setCopied] = useState(false);
  const tags = [
    "#OnlineShoppingPakistan",
    "#CashOnDelivery",
    "#" + product.name.split(/\s+/).slice(0, 2).join("").replace(/[^A-Za-z0-9]/g, ""),
    "#PakistanShopping",
    "#SmallBusinessPK",
  ]
    .filter((t) => t.length > 2)
    .join(" ");
  const caption = `${product.name} ✨\n${money(product.price, currency)} — Cash on Delivery all over Pakistan 🚚\nDM or order directly 👉 storelink.pk/${shopSlug}\n\n${tags}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-line bg-[#f7f9f7] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ink">Caption — ready to paste</p>
        <button type="button" onClick={copy} className="rounded-lg border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-ink">
          {copied ? "Copied ✓" : "Copy caption"}
        </button>
      </div>
      <p className="mt-2 whitespace-pre-line text-[11px] leading-relaxed text-muted">{caption}</p>
    </div>
  );
}
