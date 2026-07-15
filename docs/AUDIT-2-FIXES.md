# StoreLink — Second Audit: Fixes Applied

An independent deep audit re-attacked the codebase (not trusting prior "all clean"
claims). Build, lint, tests, and a real dependency scan were re-run. This documents
what was changed in response, and what was deliberately deferred (with reasons).

Verified after every batch: production build ✅ clean · lint ✅ 0 warnings ·
tests ✅ 13/13 · stray-branding references ✅ 0 · `mailto:` ✅ 0.

---

## Batch A — Security hardening (no breaking changes)

- **Global security headers + Content-Security-Policy** (`next.config.mjs`).
  Adds CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy`, and HSTS to every response. CSP keeps
  `script-src 'unsafe-inline'` for now (App Router injects inline hydration
  scripts; JSON-LD is inline) — everything else is strict (`frame-ancestors 'none'`,
  `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`). Verified live.
- **Email fails loudly in production** (`server/email.ts`). Previously, if
  `RESEND_API_KEY` was unset it logged the full message — including PII and
  one-time password-reset links — regardless of environment. Now it throws in
  production (all callers already swallow, so nothing breaks) and only logs in dev.
- **Login rate-limiter degrades instead of failing open** (`lib/rate-limit.ts`).
  On a DB/RPC error it now falls back to the in-memory limiter rather than
  allowing every request, so an attacker can't strip rate-limiting by stressing
  the DB.
- **Account deletion now purges storage** (`services/upload-service.ts`,
  `actions/account-actions.ts`). New `purgeShopStorage()` removes the shop's CNIC
  photo, selfie, and product images from Storage on account deletion — previously
  only DB rows were deleted and the identity documents were orphaned.
- **Billing webhook hardened** (`api/billing/webhook/route.ts`). Timing-safe
  secret comparison, plan validated against the allowlist, and idempotency by
  gateway reference (`activateSubscription` now ignores a repeated reference), so
  webhook retries/replays can't double-extend a subscription. Still inert until
  `BILLING_WEBHOOK_SECRET` is set. (A real gateway still needs its own HMAC
  signature check — noted in the route.)
- **Abuse-report endpoint rate-limited** (`actions/report-actions.ts`). Caps
  reports per IP so a competitor can't flood a shop with fake reports.

## Batch B — SEO / AEO / data integrity

- **Pricing reconciled with reality.** The marketing homepage advertised
  "Starter Rs 1,500 / Growth Rs 3,500 / up to 50 products," but the app charges
  Basic Rs 2,500 / Pro Rs 5,500 / Premium Rs 9,999 (35 / 90 / unlimited products).
  The homepage pricing cards **and** the JSON-LD offers are now generated from
  `server/plans.ts`, so marketing can never drift from what's charged again.
- **`llms.txt` added** (`app/llms.txt/route.ts`). A plain-text summary for AI
  answer engines / LLM crawlers (llmstxt.org), served at `/llms.txt`, with the
  real product description, pricing, and key pages. Directly supports the AEO goal.
- **Homepage JSON-LD escaping** made consistent with the product pages
  (`<` → `\u003c`).

## Batch C — Image performance (SEO / Core Web Vitals)

- **Uploads are now downscaled** (`server/image.ts`). `toWebp` resizes to fit
  within 1600px on the longest side (never upscales) and drops quality 92→82.
  A 3000×2000 phone photo now becomes 1600×1067 instead of being stored and
  served full-size to phones — a real LCP / bandwidth win, which is exactly what
  the "get found on Google" pitch depends on. Verified: 3000×2000 → 1600×1067.
- **Decompression-bomb guard** added (`limitInputPixels`), rejecting tiny files
  that decode to giant bitmaps. Verified: a 64-megapixel image is rejected.
- **Banner image host validated** (`actions/storefront-actions.ts`) — only our
  own uploads (same-origin / Supabase) are accepted, matching product images.

## Env / ops

- `.env.example`: clarified that `FIELD_ENCRYPTION_KEY` should be set separately
  (rotating `SESSION_SECRET` would otherwise orphan encrypted CNIC/payout data),
  and that email now fails loudly in production without a key.

---

## Batch D — Next.js 14 → 15 migration (completed)

This was deliberately treated as its own careful, tested pass rather than bundled
into the hardening batches — it touches the auth/session core and needed real
runtime verification, not just a green build.

**Decision:** upgraded to **Next.js 15.5.19** while keeping **React 18.3.1**
(not Next 16 / React 19). Rationale: 14 components use `useFormState` from
`react-dom`, which stays valid under React 18 but requires migrating to
`useActionState` under React 19 — Next 15 clears the framework CVEs with a much
smaller blast radius by not forcing that additional migration at the same time.

**What changed (async request APIs — the Next 15 breaking change):**
- `cookies()` and `headers()` are now `Promise`-returning. Converted: the session
  core (`setSessionCookie`, `clearSessionCookie`, `getSession`), `getLang()`,
  both auth guards (`getCurrentSeller`, `getCurrentAdmin`), `reqIp()` in
  auth-actions, and the headers-based host detection in the dashboard storefront
  page (QR code URL).
- `getLang()` callers that are Server Components (`ProductCard`, `FeaturedCard`,
  `StorefrontHome`, the `[slug]` layout, checkout page) were converted to
  `async`/awaited. The **cart page** (a Client Component) can't `await` a Promise
  prop, so `shopSlug` was moved into the `CartContext` instead of being read from
  `params` — a cleaner fix that removes the dependency entirely.
- `params` / `searchParams` are now `Promise<...>` in every dynamic route: all
  `[slug]` storefront pages (page, layout, product, checkout, order, category,
  report, search), the dashboard/admin param pages (order detail, edit product,
  admin shop detail), the demo image route, and the three `searchParams` pages
  (reset-password, verify-email, dashboard/reports).
- Two Next 15 ESLint rule fixes: the CSV-export `<a>` (a genuine file download,
  not navigation — kept as `<a>` with a documented lint-disable) and the
  `error.tsx` "Homepage" link (kept as `<a>` deliberately — a full page reload is
  the safer recovery path from a crashed render tree than client-side nav
  re-entering the same broken state).
- `next.config.mjs`: `experimental.serverComponentsExternalPackages` renamed to
  `serverExternalPackages` (Next 15 stabilized the option).
- **`@supabase/supabase-js` bumped 2.45.0 → 2.110.0** (found during the
  post-migration audit re-check, not part of the original Next.js CVE list —
  patches a low-severity `auth-js` advisory). Confirmed the app never calls any
  `supabase.auth.*` method (it has its own custom session system), so the
  vulnerable path was unreachable either way — patched anyway since a safe,
  non-breaking upgrade was available.

**A real bug this caught, and how it was fixed (this is why the migration got
its own pass):** the CSP added in Batch A blocked the app's own Google Fonts
stylesheet (`style-src` didn't allow `fonts.googleapis.com`), which only showed
up under a real browser — `curl` header checks didn't catch it. Fixed by adding
`fonts.googleapis.com` to `style-src` and `fonts.gstatic.com` to `font-src`.

**Verification performed (not just compile):**
- Production build ✅, lint ✅ (0 warnings), unit tests ✅ (13/13).
- `npm audit --omit=dev`: **0 vulnerabilities** (previously 1 high + others from
  Next 14.2.35, plus the newly-found `auth-js` low). Verified with real CVE
  scans, not assumed.
- **Real-browser end-to-end test** (Playwright/Chromium, not curl) against the
  running production build, with `SESSION_SECRET` set as a real deploy would
  have it: seller login → session cookie set (httpOnly, confirmed) → dashboard
  renders real shop data → session persists across a second page navigation →
  the `headers()`-based QR code page renders → sign-out clears the cookie →
  admin login works → **a seller session is correctly blocked from `/admin`** →
  product page + add-to-cart → cart page shows the item via the new
  context-based `shopSlug` (no `params` dependency). **12/12 checks passed.**

---

## Deliberately deferred (with reasons)

- **Next.js 16 / React 19.** Not pursued in this pass — Next 15 already clears
  the framework CVEs (`npm audit --omit=dev` is clean), and jumping to React 19
  would additionally require migrating 14 components off `useFormState` (renamed
  `useActionState`) for no CVE benefit today. Worth revisiting opportunistically,
  not urgently.

- **Order/stock transactional atomicity.** The availability check and stock
  decrement aren't wrapped in a single transaction (small oversell window under
  concurrency). The atomic DB decrement keeps stock ≥ 0; the fix (a single RPC
  that checks-and-decrements) is worth doing but is a low-impact correctness item
  for a low-traffic COD product.

- **Public-shop projection.** `getShopBySlug` returns the full shop (with
  decrypted CNIC/payout) server-side. It never reaches the client today, but a
  dedicated projection that never selects those columns would remove the latent
  risk. Recommended, not urgent.

- **Sitemap at scale** (N+1 query, 4,900-URL cap) and **PWA icons**
  (SVG-only, no PNG apple-touch-icon) — fine at launch, revisit as you grow.
