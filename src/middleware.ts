import { NextResponse, type NextRequest } from "next/server";

/**
 * Strict, nonce-based Content-Security-Policy for the PRIVATE areas only
 * (/dashboard and /admin).
 *
 * Why only here?
 *   A nonce must be unique per request, which forces Next.js to render the page
 *   dynamically. Our public pages (storefronts, marketing, guides) are cached
 *   and revalidated on a timer — that caching is what makes them load in under
 *   half a second and is core to how sellers get found on Google. Putting a
 *   nonce on them would throw all of that away.
 *
 *   /dashboard and /admin already render per-request (they read the session
 *   cookie), so a nonce costs us nothing there — and they are exactly where a
 *   logged-in session, customer data and admin powers live. So the private
 *   pages get the strict policy; the public pages keep the (documented)
 *   'unsafe-inline' policy from next.config.mjs.
 *
 * 'strict-dynamic' means: trust scripts loaded by an already-trusted (nonced)
 * script, and ignore host allowlists. Next.js automatically stamps the nonce
 * onto the scripts it generates when it sees one in this request header.
 */
const PRIVATE_CSP = (nonce: string) =>
  [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // Tailwind/Next inject inline <style>; there is no style nonce plumbing in
    // Next's App Router, and inline CSS is not a script-execution risk.
    // Google Fonts is needed here too — the dashboard uses the same typefaces as
    // the storefront, including Noto Nastaliq for Urdu.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'", // the dashboard must never be framed
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

// The non-CSP hardening headers, mirrored from next.config.mjs so the private
// pages are never weaker than the public ones.
const BASE_HEADERS: Array<[string, string]> = [
  ["X-Frame-Options", "DENY"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()"],
  ["Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload"],
  // Private pages must never be stored by a shared cache.
  ["Cache-Control", "private, no-store"],
];

export function middleware(request: NextRequest) {
  // Edge runtime: use Web Crypto, not Node's Buffer.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = btoa(String.fromCharCode(...bytes));
  const csp = PRIVATE_CSP(nonce);

  // Next.js reads the nonce out of the CSP on the REQUEST headers and applies
  // it to its own inline scripts, so hydration keeps working.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  for (const [k, v] of BASE_HEADERS) response.headers.set(k, v);
  return response;
}

export const config = {
  // Private areas only. Everything else keeps the cached, ISR-friendly policy.
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
