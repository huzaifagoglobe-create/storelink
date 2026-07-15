"use client";

import { useState } from "react";

/** Verified badge kit: a downloadable badge image for Instagram bios/WhatsApp
 *  status + the public verify link to send doubtful buyers. Every badge is a
 *  free ad; every doubtful buyer who checks learns StoreLink exists. */
export function VerifiedBadgeKit({ slug, shopName }: { slug: string; shopName: string }) {
  const [copied, setCopied] = useState(false);
  const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : "https://storelink.pk"}/verify/${slug}`;

  function downloadBadge() {
    const c = document.createElement("canvas");
    c.width = 800;
    c.height = 280;
    const x = c.getContext("2d");
    if (!x) return;
    x.fillStyle = "#0E2A20";
    x.beginPath();
    x.roundRect(0, 0, 800, 280, 28);
    x.fill();
    x.fillStyle = "#5BBD8B";
    x.beginPath();
    x.arc(120, 140, 62, 0, Math.PI * 2);
    x.fill();
    x.strokeStyle = "#0E2A20";
    x.lineWidth = 14;
    x.beginPath();
    x.moveTo(90, 142);
    x.lineTo(112, 166);
    x.lineTo(152, 114);
    x.stroke();
    x.fillStyle = "#ffffff";
    x.font = "bold 44px system-ui, sans-serif";
    x.fillText("Verified Seller", 220, 122);
    x.font = "28px system-ui, sans-serif";
    x.fillStyle = "#BFE3CF";
    const name = shopName.length > 26 ? shopName.slice(0, 25) + "…" : shopName;
    x.fillText(name, 220, 168);
    x.font = "22px system-ui, sans-serif";
    x.fillStyle = "#8FBFA6";
    x.fillText(`Check: storelink.pk/verify/${slug}`, 220, 214);
    const a = document.createElement("a");
    a.download = `${slug}-verified-badge.png`;
    a.href = c.toDataURL("image/png");
    a.click();
  }

  return (
    <div className="rounded-2xl border border-[#bfe0cd] bg-[#EAF3EE] p-4">
      <p className="text-sm font-semibold text-ink">🎖️ Your verified badge</p>
      <p className="mt-1 text-xs text-muted">
        Put the badge in your Instagram bio, WhatsApp status and Facebook page — and send the verify link to any buyer
        who doubts you. It proves you&apos;re checked and real.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={downloadBadge} className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
          ⬇ Download badge image
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(verifyUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* ignore */
            }
          }}
          className="flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-primary"
        >
          {copied ? "Copied ✓" : "Copy my verify link"}
        </button>
      </div>
    </div>
  );
}
