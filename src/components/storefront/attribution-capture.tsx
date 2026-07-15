"use client";

import { useEffect } from "react";

/**
 * Silently remembers ?ref= (referral) and ?rs= (reseller) tags when a buyer
 * lands on the shop, so checkout can attribute the order — even if they browse
 * around first. Stored per shop, in the browser only.
 */
export function AttributionCapture({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const ref = q.get("ref");
      const rs = q.get("rs");
      if (ref) localStorage.setItem(`wsb-ref-${slug}`, ref.slice(0, 80));
      if (rs) localStorage.setItem(`wsb-rs-${slug}`, rs.slice(0, 20).toUpperCase());
    } catch {
      /* storage unavailable — attribution just won't persist */
    }
  }, [slug]);
  return null;
}
