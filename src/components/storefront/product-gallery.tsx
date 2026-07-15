"use client";

import { useRef, useState } from "react";
import { ImagePlaceholder } from "./image-placeholder";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const boxRef = useRef<HTMLDivElement>(null);

  const setFromPoint = (clientX: number, clientY: number) => {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100));
    setOrigin(`${x}% ${y}%`);
  };

  if (images.length === 0) {
    return <ImagePlaceholder className="aspect-square w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-3">
      <div
        ref={boxRef}
        className="relative aspect-square w-full overflow-hidden rounded-2xl border border-line bg-surface"
        style={{ cursor: zoom ? "zoom-out" : "zoom-in", touchAction: "none" }}
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={(e) => setFromPoint(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) {
            setFromPoint(t.clientX, t.clientY);
            setZoom(true);
          }
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) setFromPoint(t.clientX, t.clientY);
        }}
        onTouchEnd={() => setZoom(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]}
          alt={alt}
          draggable={false}
          className="h-full w-full object-cover transition-transform duration-150 ease-out"
          style={{ transform: zoom ? "scale(2.2)" : "scale(1)", transformOrigin: origin }}
        />
        <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-ink/60 px-2 py-0.5 text-[11px] font-medium text-white sm:hidden">
          Hold to zoom
        </span>
      </div>

      {images.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {images.map((u, i) => (
            <button
              key={u}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Photo ${i + 1}`}
              className={
                "h-16 w-16 overflow-hidden rounded-lg border transition " +
                (i === active ? "border-primary ring-1 ring-primary" : "border-line hover:border-primary")
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img loading="lazy" decoding="async" src={u} alt="" className="h-full w-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
