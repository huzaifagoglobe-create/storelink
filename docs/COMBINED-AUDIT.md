# Combined Audit — StoreLink (all milestones)

A single end-to-end audit of the whole system as it stands (M1–M4 Part 1),
reviewed at **basic / medium / expert** levels plus a focused **security
(attacker's-eye)** pass, then verified at runtime.

**Overall result: ✅ PASS** (in demo mode). One high-severity production issue was
found and **fixed during this audit**; the rest are minor or hardening
recommendations, listed honestly below.

**Important scope note:** all testing was done in **demo mode** (built-in data).
The code path for a real database (Supabase) is written the same way but has
**not yet been run against a live database**, and the app has not been deployed.
See the verdict at the end.

---

## What was audited
- **M1** — buyer storefront (browse, cart, COD checkout, order → WhatsApp).
- **M2** — seller auth + dashboard (products, orders, settings).
- **M3** — admin panel (all shops, plans, pause/activate).
- **M4 Part 1** — product image uploads.

---

## 1. Build & static checks
| Check | Result |
|---|---|
| `npm run build` (production) | ✅ compiled, types valid, 16 routes |
| `npm run lint` | ✅ no warnings or errors |
| TypeScript strict type-check (part of build) | ✅ pass |

## 2. Runtime verification (live server)
Every line below was executed against a running build.

**Storefront / privacy**
- `GET /` 200 · `/zara` (active) 200 · `/zara/product/p-lawn` 200 ✅
- `/old-boutique` (a **paused** shop) → **404** — paused shops are hidden ✅
- `/nope` (missing shop) → 404 ✅
- Order page by **guessed number** `/zara/order/1041` → **404**; by **real
  unguessable token** → 200. Customer details can't be found by guessing URLs ✅

**Ordering**
- `POST /api/orders` (COD) → 200, then confirmation page by token → 200 ✅
- Order containing only an **out-of-stock** item → **400** (rejected) ✅

**Seller auth + tenant isolation**
- `/dashboard` with no session → **307 → /login** ✅
- `/dashboard` as seller → 200 ✅
- Seller opening **their own** order (1041) → 200 ✅
- Seller opening **another shop's** order (1043) → **404 (blocked)** ✅

**Admin role separation (all four directions)**
- Seller → `/admin` → **307 → /dashboard** (blocked) ✅
- Admin → `/admin` → 200 ✅
- Admin → `/dashboard` → **307 → /login** (admins have no shop) ✅
- Guest → `/admin` → **307 → /login** ✅

**Image upload**
- `POST /api/uploads` with no login → **401** ✅
- As seller with a PNG → 200 + URL; fetching the URL returns the image ✅
- A non-image file → **400** ✅

**Fail-closed session secret (the fix)**
- Production with **no `SESSION_SECRET`**: a **forged cookie** to `/admin` → **500
  (auth refuses)**, while `/` still serves ✅

---

## 3. Security review (attacker's-eye)

| # | Area | Finding | Severity | Status |
|---|---|---|---|---|
| 1 | Sessions | The session-signing secret fell back to a **default value present in the source**. Deploying to production without `SESSION_SECRET` would let an attacker **forge an admin session** and take over the platform. | **High** | **FIXED** — auth now **fails closed** in production if `SESSION_SECRET` is unset (verified at runtime). |
| 2 | Public order API | `POST /api/orders` is intentionally anonymous (buyers) and has input caps, but **no rate limiting**, so it could be spammed with fake orders. | Medium | **Recommended** before scale: add per-IP rate limiting / a light CAPTCHA. |
| 3 | Uploads | The image's content-type is taken from the client; bytes aren't sniffed for a real image header. | Low | Recommended: add magic-byte validation. |
| 4 | Sign-up | Shop then account are created in two steps (not one transaction); a rare race could leave a shop with no owner. | Low | Recommended: wrap in a DB transaction/RPC in real mode. |
| 5 | Passwords | Minimum length is 6. | Low | Recommended: raise to 8+ and consider a breached-password check. |
| 6 | Testing | No automated test suite (manual + runtime tested). | Process | Recommended: add unit/integration tests. |

### Checked and found GOOD (no issue)
- **Tenant isolation (multi-tenant safety):** every seller action takes the shop
  from the **logged-in session**, and every owner DB query **also** filters by
  `shop_id`. Verified a seller cannot reach another shop's order at runtime. ✅
- **IDOR on orders:** public order pages use an **unguessable token**, not the
  sequential number. ✅
- **Privilege escalation:** sign-up always creates a **seller**; "admin" can't be
  requested via the form (role is set server-side). ✅
- **Injection / mass assignment:** inputs are parsed field-by-field (trimmed,
  length-capped, typed); form data is never blindly spread into the database.
  Supabase's client uses parameterized queries. ✅
- **Price tampering:** the server **re-prices every order line** from the
  database; the browser's prices are ignored. ✅
- **Secret handling:** the Supabase **service-role key is server-only**
  (`import "server-only"`), so it can't be bundled into the browser; the
  credentials table (`app_users`) has row-level security with no public policies. ✅
- **CSRF:** Next.js Server Actions include built-in origin checks; the one
  cookie-authenticated custom route (`/api/uploads`) only stores an image and
  performs no destructive action. ✅
- **Accessibility floor:** visible keyboard focus + reduced-motion respected. ✅

---

## 4. Known limitations (by design / for later)
- **Demo mode is in-memory** — orders, uploaded images, and admin changes reset
  when the server restarts. Real persistence comes with Supabase.
- **Admin revenue/MRR are estimates** from plan price, not real payment records.
- **No online payments or automatic WhatsApp yet** — M4 Parts 2–3 (COD + a manual
  WhatsApp link work today).
- **Not yet run on a live database or deployed** — see verdict.

---

## 5. Verdict — is it ready?
**As a codebase:** yes — the core product (buyer + seller + admin + photos) is
complete, builds clean, lints clean, and **passed a full runtime security audit
in demo mode**, with the one high-severity issue fixed.

**As a live business:** not yet. Before a public launch:
1. **Set `SESSION_SECRET`** (now required in production).
2. **Connect and test against a real Supabase database** (run `schema.sql`, create
   the public `product-images` bucket, add keys) — this is the first untested
   real-world step.
3. **Add rate limiting** to the public order endpoint.
4. **Deploy** (Vercel + domain).
5. Either **launch COD-only** now, or finish **payments + WhatsApp automation**
   (M4 Parts 2–4) first.

Nothing blocking was found in the code. The remaining work is integration with
real services and deployment, not fixing the application.
