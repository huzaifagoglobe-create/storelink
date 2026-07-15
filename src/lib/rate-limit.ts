// Rate limiting.
//
// Two layers:
//  - rateLimit()    : sync, in-memory, per-instance. Fine for a single VPS or
//                     for demo mode. Used as the fallback when there's no DB.
//  - rateLimitDb()  : async, backed by Postgres (Supabase) so the limit is
//                     SHARED across serverless instances (Vercel). This is the
//                     one to use for security-sensitive limits (login, etc.).
//
// rateLimitDb falls back to the in-memory limiter automatically when Supabase
// is not configured (demo mode), so callers don't need to branch.

import { getServerSupabase, isSupabaseConfigured } from "@/server/supabase/server";

type Hit = { count: number; resetAt: number };
const buckets = new Map<string, Hit>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, remaining: limit - b.count, retryAfterSec: 0 };
}

/**
 * Shared, cross-instance rate limit (Postgres-backed in real mode).
 * Returns true if the request is ALLOWED, false if the limit is exceeded.
 * On limiter errors it DEGRADES to the per-instance in-memory limiter (rather
 * than failing fully open) so an attacker can't strip rate-limiting by causing
 * DB errors, while a genuine outage still doesn't lock every user out forever.
 */
export async function rateLimitDb(
  key: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return rateLimit(key, limit, windowSec * 1000).ok;
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.rpc("rl_hit", {
      p_key: key,
      p_limit: limit,
      p_window_secs: windowSec,
    });
    if (error) {
      console.error("rateLimitDb rpc error (degrading to in-memory):", error.message);
      return rateLimit(key, limit, windowSec * 1000).ok;
    }
    return data === true;
  } catch (e) {
    console.error("rateLimitDb threw (degrading to in-memory):", e);
    return rateLimit(key, limit, windowSec * 1000).ok;
  }
}

// ─── Client IP resolution ───────────────────────────────────────────────────
//
// SECURITY: `X-Forwarded-For` is CLIENT-SUPPLIED. Reading the leftmost value
// (the old behaviour) let anyone spoof a fresh IP per request and walk straight
// through every IP-based rate limit — including login brute-force protection.
//
// How XFF actually works: each proxy APPENDS the address it received the
// request from. So with one trusted proxy in front of us (Render, Vercel, etc.):
//
//     client sends:  X-Forwarded-For: 9.9.9.9        (a lie)
//     our proxy adds the real peer:  "9.9.9.9, 203.0.113.7"
//                                     ^ spoofed        ^ REAL — always rightmost
//
// So we count from the RIGHT, never the left. Anything an attacker injects is
// pushed leftward and ignored.
//
// TRUSTED_PROXY_HOPS = how many proxies of ours append to XFF before it reaches
// the app. 1 = Render/Vercel alone (the default). Put Cloudflare in front too
// and it becomes 2. Setting this too HIGH would read an attacker value; setting
// it too LOW groups users behind your own proxy into one bucket (fails safe).
const TRUSTED_PROXY_HOPS = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS ?? 1));

function pickIp(xff: string | null, xrip?: string | null): string {
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      // The last TRUSTED_PROXY_HOPS entries were appended by infrastructure we
      // control; the one immediately before them is the real client.
      const idx = parts.length - TRUSTED_PROXY_HOPS;
      return parts[idx >= 0 ? idx : 0] ?? "unknown";
    }
  }
  // No XFF at all: only then consider x-real-ip. (Also spoofable in principle,
  // but a proxy that sets it overwrites any client value, and reaching here at
  // all means no proxy chain was present.)
  return xrip?.trim() || "unknown";
}

/** Best-effort client IP from a Request (for route handlers). */
export function clientIp(req: Request): string {
  return pickIp(req.headers.get("x-forwarded-for"), req.headers.get("x-real-ip"));
}

/** Best-effort client IP from a forwarded-for header value (for Server Actions). */
export function ipFromForwarded(xff: string | null, xrip?: string | null): string {
  return pickIp(xff, xrip);
}
