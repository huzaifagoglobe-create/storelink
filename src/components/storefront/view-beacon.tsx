"use client";

import { useEffect, useRef } from "react";

/**
 * Fires a one-time view beacon on mount for storefront analytics. Silent and
 * non-blocking — a failure never affects the page. Skips repeat fires within
 * the same mount (React strict-mode double-invoke guard).
 */
export function ViewBeacon({ slug, kind, productId }: { slug: string; kind: "shop" | "product"; productId?: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    // Referrer (which app/site sent this visitor) + optional ?src= tag.
    let ref = "";
    try {
      ref = new URLSearchParams(window.location.search).get("src") || document.referrer || "";
    } catch {
      ref = "";
    }
    const payload = JSON.stringify({ slug, kind, productId, ref: ref.slice(0, 300) });
    // Prefer sendBeacon (survives navigation); fall back to fetch.
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/view", new Blob([payload], { type: "application/json" }));
        return;
      }
    } catch {
      /* fall through */
    }
    fetch("/api/view", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
  }, [slug, kind, productId]);
  return null;
}
