"use client";

import { useEffect, useRef, useState } from "react";

export function NewOrderPing() {
  const baseline = useRef<number | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    let active = true;

    function ensureCtx() {
      if (!audioCtx.current) {
        const Ctx =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctx) audioCtx.current = new Ctx();
      }
      if (audioCtx.current?.state === "suspended") void audioCtx.current.resume();
    }

    function beep() {
      try {
        ensureCtx();
        const ctx = audioCtx.current;
        if (!ctx) return;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = "sine";
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        o.start();
        o.stop(ctx.currentTime + 0.42);
      } catch {
        /* audio not available */
      }
    }

    async function poll() {
      try {
        const res = await fetch("/api/dashboard/new-orders", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.count !== "number") return;
        if (baseline.current === null) {
          baseline.current = data.count; // first read = baseline, no alert
          return;
        }
        if (data.count > baseline.current) {
          beep();
          setToast(true);
          window.setTimeout(() => {
            if (active) setToast(false);
          }, 6000);
        }
        baseline.current = data.count;
      } catch {
        /* offline / transient */
      }
    }

    // Unlock audio on the first interaction (browser autoplay policy).
    const unlock = () => ensureCtx();
    document.addEventListener("pointerdown", unlock);

    poll();
    const id = window.setInterval(poll, 25000);
    const onVis = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      active = false;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("pointerdown", unlock);
    };
  }, []);

  if (!toast) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg">
      New order received — check Orders.
    </div>
  );
}
