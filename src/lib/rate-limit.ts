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

/** Best-effort client IP from a Request (for route handlers). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return (xff.split(",")[0] ?? "unknown").trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Best-effort client IP from a forwarded-for header value (for Server Actions). */
export function ipFromForwarded(xff: string | null, xrip?: string | null): string {
  if (xff) return (xff.split(",")[0] ?? "unknown").trim();
  return xrip ?? "unknown";
}
