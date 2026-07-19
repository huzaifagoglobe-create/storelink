"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tells the seller the moment an order arrives — wherever they are.
 *
 * A missed order is lost money, so this deliberately uses four channels,
 * because any one of them can fail:
 *
 *   1. Sound      — a double chime, twice, not a single easy-to-miss blip.
 *   2. Tab title  — "(2) New order! · …" so a background tab still shouts.
 *   3. Browser/OS — a real notification. This is the ONLY channel that reaches
 *                   a seller who has switched to WhatsApp. Needs permission, so
 *                   we ask once, politely, and never nag again.
 *   4. On-screen  — a banner that STAYS until acknowledged. The old one vanished
 *                   after six seconds; look away and the order was never seen.
 *
 * Browsers block sound until a real user gesture, so the audio context is
 * unlocked on the seller's first tap anywhere.
 */

const POLL_MS = 20_000;
const ASKED_KEY = "sl-alerts-asked";

export function NewOrderPing() {
  const baseline = useRef<number | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const baseTitle = useRef<string>("");
  const [newCount, setNewCount] = useState(0);
  const [askPermission, setAskPermission] = useState(false);

  const ensureCtx = useCallback(() => {
    if (!audioCtx.current) {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) audioCtx.current = new Ctx();
    }
    if (audioCtx.current?.state === "suspended") void audioCtx.current.resume();
  }, []);

  const chime = useCallback(() => {
    try {
      ensureCtx();
      const ctx = audioCtx.current;
      if (!ctx) return;
      // Two rising notes, played twice: reads as good news, hard to miss.
      const notes = [880, 1174.66, 880, 1174.66];
      notes.forEach((freq, i) => {
        const t = ctx.currentTime + i * 0.18 + (i >= 2 ? 0.25 : 0);
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = "sine";
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.28, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
        o.start(t);
        o.stop(t + 0.36);
      });
    } catch {
      /* audio unavailable — the other channels still fire */
    }
  }, [ensureCtx]);

  const osNotify = useCallback((count: number) => {
    try {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const n = new Notification(count > 1 ? `${count} new orders!` : "New order! 🎉", {
        body: count > 1 ? "Open StoreLink to see them." : "Someone just bought from your shop.",
        tag: "storelink-new-order",
      });
      n.onclick = () => {
        window.focus();
        window.location.href = "/dashboard/orders";
      };
    } catch {
      /* not supported */
    }
  }, []);

  useEffect(() => {
    if (!baseTitle.current) baseTitle.current = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = newCount > 0 ? `(${newCount}) New order! · ${baseTitle.current}` : baseTitle.current;
  }, [newCount]);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch("/api/dashboard/new-orders", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.count !== "number" || !active) return;
        if (baseline.current === null) {
          baseline.current = data.count; // first read = baseline, no alert
          return;
        }
        if (data.count > baseline.current) {
          const fresh = data.count - baseline.current;
          chime();
          setNewCount((c) => c + fresh);
          osNotify(fresh);
        }
        baseline.current = data.count;
      } catch {
        /* offline / transient — retry next tick */
      }
    }

    const unlock = () => ensureCtx();
    document.addEventListener("pointerdown", unlock);

    poll();
    const id = window.setInterval(poll, POLL_MS);
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
  }, [chime, ensureCtx, osNotify]);

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(ASKED_KEY)) return;
    const t = window.setTimeout(() => setAskPermission(true), 4000);
    return () => window.clearTimeout(t);
  }, []);

  async function enableAlerts() {
    try {
      await Notification.requestPermission();
    } catch {
      /* ignore */
    }
    localStorage.setItem(ASKED_KEY, "1");
    setAskPermission(false);
    ensureCtx(); // this tap also unlocks sound
  }

  function dismissAsk() {
    localStorage.setItem(ASKED_KEY, "1");
    setAskPermission(false);
  }

  return (
    <>
      {askPermission && newCount === 0 && (
        <div className="fixed bottom-4 left-1/2 z-50 w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-line bg-surface p-4 shadow-xl">
          <p className="text-sm font-semibold text-ink">Never miss an order 🔔</p>
          <p className="mt-1 text-xs text-muted">
            Let us ping you when an order comes in — even when this tab is in the background.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={enableAlerts}
              className="flex-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
            >
              Yes, alert me
            </button>
            <button onClick={dismissAsk} className="rounded-xl border border-line px-3 py-2 text-xs font-medium text-muted">
              Not now
            </button>
          </div>
        </div>
      )}

      {newCount > 0 && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 z-50 w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl bg-primary p-4 text-primary-foreground shadow-2xl ring-4 ring-primary/20"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none">🎉</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{newCount > 1 ? `${newCount} new orders!` : "New order!"}</p>
              <p className="mt-0.5 text-xs opacity-90">
                {newCount > 1 ? "Someone's shopping. Go and see." : "Someone just bought from your shop."}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              href="/dashboard/orders"
              onClick={() => setNewCount(0)}
              className="flex-1 rounded-xl bg-white px-3 py-2 text-center text-xs font-bold text-primary"
            >
              See {newCount > 1 ? "them" : "it"} →
            </Link>
            <button
              onClick={() => setNewCount(0)}
              className="rounded-xl border border-white/40 px-3 py-2 text-xs font-medium"
            >
              Later
            </button>
          </div>
        </div>
      )}
    </>
  );
}
