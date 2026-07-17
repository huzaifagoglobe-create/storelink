"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Live preview of the seller's REAL storefront (their own products) rendered in
 * the chosen template. Updates the moment they pick a different design, so they
 * see the change before pressing Save. Uses the owner-only ?previewTemplate=
 * override on the storefront route.
 *
 * Desktop mode renders a 1100px-wide viewport scaled down to fit whatever width
 * the panel actually has (measured live, so it never overflows).
 */
export function StorefrontLivePreview({ slug, template }: { slug: string; template: string }) {
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  const [loading, setLoading] = useState(true);
  const [panelW, setPanelW] = useState(320);
  const boxRef = useRef<HTMLDivElement>(null);
  const src = `/${slug}?previewTemplate=${encodeURIComponent(template)}`;

  // Show the loader whenever the template changes.
  useEffect(() => {
    setLoading(true);
  }, [template]);

  // Track the panel's real width so desktop scaling always fits.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setPanelW(el.clientWidth || el.getBoundingClientRect().width || 320);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = 560; // visible preview height
  const DESKTOP_W = 1100;
  const scale = Math.min(1, panelW / DESKTOP_W);

  return (
    <div className="rounded-2xl border border-line bg-[#f3f5f2] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-ink">Live preview</p>
        <div className="flex gap-1" role="group" aria-label="Preview device">
          <button
            type="button"
            onClick={() => setDevice("phone")}
            className={
              "rounded-md px-2 py-1 text-[11px] font-medium transition " +
              (device === "phone" ? "bg-primary text-primary-foreground" : "text-muted hover:text-ink")
            }
          >
            Phone
          </button>
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={
              "rounded-md px-2 py-1 text-[11px] font-medium transition " +
              (device === "desktop" ? "bg-primary text-primary-foreground" : "text-muted hover:text-ink")
            }
          >
            Desktop
          </button>
        </div>
      </div>

      <div
        ref={boxRef}
        className="relative w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-line bg-white"
        style={{ height: H }}
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <span className="text-xs text-muted">Updating preview…</span>
          </div>
        )}
        {device === "desktop" ? (
          // absolute: a CSS transform shrinks how this LOOKS but not the space it
          // takes up, so in normal flow the 1100px iframe still pushes the page
          // sideways. Taking it out of flow means it can never affect layout.
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ transform: `scale(${scale})`, width: DESKTOP_W }}
          >
            <iframe
              key="desktop"
              src={src}
              title="Storefront preview"
              onLoad={() => setLoading(false)}
              className="border-0"
              style={{ width: DESKTOP_W, height: Math.round(H / scale) }}
            />
          </div>
        ) : (
          <iframe
            key="phone"
            src={src}
            title="Storefront preview"
            onLoad={() => setLoading(false)}
            className="h-full w-full border-0"
          />
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-muted">
        Your real shop in the <b>{template}</b> design. Press <b>Save storefront</b> to make it live.{" "}
        <a href={src} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
          Open full preview ↗
        </a>
      </p>
    </div>
  );
}
