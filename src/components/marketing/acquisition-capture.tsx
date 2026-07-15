"use client";

import { useEffect } from "react";

/** Remembers ?src= and ?rf= from any landing page so signup can attribute it. */
export function AcquisitionCapture() {
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const src = q.get("src");
      const rf = q.get("rf");
      if (src) localStorage.setItem("wsb-src", src.slice(0, 40));
      if (rf) localStorage.setItem("wsb-rf", rf.slice(0, 60));
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
