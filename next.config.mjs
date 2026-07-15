/** @type {import('next').NextConfig} */

// Content-Security-Policy — defence-in-depth so a future XSS has nothing to
// execute, plus the standard hardening headers (clickjacking, sniffing, etc).
// script-src keeps 'unsafe-inline' for now because Next's App Router injects
// inline hydration scripts and we render inline JSON-LD; this is tightened to a
// nonce-based policy after the Next 15 upgrade. Everything else is strict.
// Next.js DEV mode runs its bundles through eval() and uses a websocket for
// hot reload — a CSP without 'unsafe-eval'/ws: silently kills ALL client JS in
// `npm run dev` (pages render, but no button works). So: relaxed in dev only;
// production stays strict.
const isDev = process.env.NODE_ENV === "development";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://plausible.io https://connect.facebook.net`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https: https://www.facebook.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self'${isDev ? " ws: wss:" : ""} https://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://plausible.io https://connect.facebook.net https://www.facebook.com`,
  "frame-ancestors 'self'",
  // Product videos: privacy-friendly YouTube embeds only.
  "frame-src 'self' https://www.youtube-nocookie.com",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig = {
  images: {
    // Only allow images from Supabase Storage (where our uploads live).
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  serverExternalPackages: ["sharp"],
  async headers() {
    return [
      // Public pages: cached/ISR-friendly policy (keeps 'unsafe-inline' — see note above).
      // /dashboard and /admin are deliberately EXCLUDED: src/middleware.ts gives
      // those a strict nonce-based CSP, which it can afford because they already
      // render per-request. Two CSP headers on one response would both be
      // enforced and fight each other, so only one source sets it per path.
      { source: "/((?!dashboard|admin).*)", headers: securityHeaders },
      // Non-CSP hardening still applies everywhere (middleware re-sets these too).
      { source: "/:path*", headers: securityHeaders.filter((h) => h.key !== "Content-Security-Policy") },
    ];
  },
};

export default nextConfig;
