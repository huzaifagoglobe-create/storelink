# QA / Lab Test — Milestone 1

A structured review of the Milestone 1 build (foundation + buyer storefront)
across **basic**, **medium**, and **expert** levels, covering frontend, backend,
database, security, and code quality. Every issue found was fixed and the build
was re-verified.

**Result: ✅ PASS** — clean production build, no type errors, lint clean.

---

## Scope reviewed
- Database schema, indexes, security policies (`db/`)
- Backend services, API route, types, WhatsApp builder (`src/server`, `src/app/api`)
- Frontend storefront flow: shop → product → cart → checkout → order (`src/app`, `src/components`)
- Shared libs (`src/lib`)
- Build, types, and linting

---

## Basic level (does it work / obvious bugs)

| Check | Result |
|---|---|
| Production build compiles | ✅ Pass (`next build`, 0 errors) |
| TypeScript types valid | ✅ Pass |
| ESLint configured and clean | ✅ Added config, `next lint` clean |
| All routes generate | ✅ 7 routes |
| Buyer flow works end to end (demo data) | ✅ shop → product → cart → checkout → order → WhatsApp |
| Currency + totals format correctly | ✅ `Rs 4,500` style |

---

## Medium level (correctness / robustness / UX)

**Issues found and fixed:**

1. **Cart "empty" flash before localStorage loads.**
   The cart/checkout pages rendered "Your cart is empty" for a split second on
   first paint, before the saved cart was read.
   → **Fix:** the cart context now exposes a `ready` flag; cart and checkout
   wait for it before deciding what to show.

2. **Out-of-stock / over-quantity ordering.**
   The order API checked that a product was active but not that it was in stock,
   and didn't cap quantity to available stock.
   → **Fix:** `createOrder` now skips unavailable items and clamps each line's
   quantity to the available stock.

3. **Orphan order on partial DB failure (real mode).**
   If the order row saved but its items failed to insert, an order with no items
   could be left behind.
   → **Fix:** a compensating delete removes the order if the items insert fails,
   and the error is logged.

4. **WhatsApp link robustness.**
   A seller phone number containing `+`, spaces, or dashes would produce a
   broken `wa.me` link.
   → **Fix:** the phone is stripped to digits when the link is built.

---

## Expert level (security / privacy / hardening)

**Issues found and fixed:**

1. **🔴 Customer PII exposed via guessable order URLs (most important).**
   The order confirmation page was reached by the sequential order number
   (e.g. `/zara/order/1043`). Because the numbers are sequential, anyone could
   increment the URL and read other customers' **name, phone, and address**.
   → **Fix:** every order now has an **unguessable `public_token`** (random
   UUID). The confirmation URL uses that token; the human order number is only
   shown on the page, never used to look orders up. Route renamed
   `order/[orderId]` → `order/[token]`.

2. **Open order endpoint abuse.**
   The public POST `/api/orders` had no input bounds, so it could be flooded
   with huge payloads.
   → **Fix:** limits added — max 50 items, max quantity 100 per item, and length
   caps on name/phone/address/city. (Network-level rate limiting is planned for
   the deployment phase, M4.)

3. **Service-role key leakage risk.**
   The Supabase admin client uses the service-role key (bypasses row-level
   security) and must never reach the browser.
   → **Fix:** added `import "server-only"` to that module, which makes the build
   **fail** if it is ever imported into client code.

4. **Server-side price authority (verified, kept).**
   Prices and totals are always recomputed on the server from the database; the
   browser's prices are ignored. ✅

5. **Accessibility hardening.**
   → **Fix:** added a visible keyboard-focus outline on all interactive elements
   and a `prefers-reduced-motion` rule.

---

## Database review
- Tables, enums, indexes, `updated_at` triggers present. ✅
- Row-Level Security policies defined (public reads only active shops/products;
  writes restricted). ✅
- Added `public_token uuid` + unique index to `orders` (see expert fix #1). ✅

---

## Known limitations (by design for M1, not bugs)
- Demo mode keeps orders in memory (they reset on dev-server restart). Real
  persistence comes with Supabase credentials.
- Stock is validated but not decremented at order time (COD orders are often
  cancelled; reservation logic is deferred).
- No seller/admin authentication yet — that is Milestone 2.
- Product images use URLs/placeholders; uploads come in Milestone 4.

---

## Verification after fixes
- `npm run build` → ✅ compiled successfully, types valid
- `npm run lint` → ✅ clean
