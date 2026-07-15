# QA / Lab Test — Milestone 2 (Seller auth + dashboard)

Review of the seller side: sign up, log in, and the dashboard for managing
products, orders, and shop settings. Checked at **basic**, **medium**, and
**expert** levels, with a focus on authentication and multi-tenant safety
(because this is the first milestone with logins and private data).

**Result: ✅ PASS** — builds clean, lint clean, and verified at runtime
(unauthenticated users are redirected; logged-in users see only their own shop).

---

## What Milestone 2 adds
- **Sign up** (`/signup`) — creates a shop + owner account in one step.
- **Log in / log out** (`/login`) — email + password.
- **Dashboard** (`/dashboard`):
  - Overview — product and order counts, recent orders.
  - Products — list, add, edit, hide/show, delete.
  - Orders — list, order detail, change status, message the customer on WhatsApp.
  - Settings — edit shop name, link (slug), WhatsApp, delivery, payment note, pause shop.
- **`app_users` table** — self-contained email + password auth (not tied to any
  external login provider), so the same code runs in demo and real mode.

---

## Basic level (does it work)
| Check | Result |
|---|---|
| Production build compiles | ✅ 18 routes, 0 errors |
| Lint clean | ✅ no warnings or errors |
| Login page renders with demo credentials | ✅ runtime 200 |
| Sign-up page renders | ✅ runtime 200 |
| Storefront (Milestone 1) still works | ✅ runtime 200 |
| All dashboard pages render with data when logged in | ✅ runtime 200 |

Demo login: **demo@shop.pk / PIN 1234**

---

## Medium level (correctness / robustness)
- **Inputs validated and normalized.** Names/notes are trimmed and length-capped;
  prices/stock are checked as valid non-negative numbers; the shop link (slug) is
  normalized to safe characters; phone numbers are normalized (e.g. `03xx` →
  `923xx`). ✅
- **Duplicate guards.** Sign-up rejects an email or shop link that's already
  taken; settings rejects a slug taken by another shop. ✅
- **Order status is allow-listed.** Only `new / confirmed / delivered / cancelled`
  are accepted. ✅
- **Friendly errors.** Forms return readable messages ("That shop link is already
  taken") instead of crashing. ✅

---

## Expert level (security / tenant isolation)
This is the important part for a multi-shop app: **one seller must never be able
to read or change another seller's data.**

1. **Passwords are hashed with scrypt** + a random per-password salt, and compared
   in constant time (`timingSafeEqual`). Plain passwords are never stored. ✅
2. **Sessions are signed httpOnly cookies.** The cookie is an HMAC-SHA256 signed
   token; it's verified (constant-time) before it's trusted, so it can't be
   tampered with. `httpOnly` keeps it away from page scripts; `secure` is on in
   production. ✅
3. **Every protected page calls `requireSeller()`** which redirects to `/login`
   when signed out. Verified at runtime: `/dashboard` and `/dashboard/products`
   returned a redirect with no session. ✅
4. **Tenant isolation is enforced twice (defense in depth):**
   - Server actions always take the shop from the **logged-in session**
     (`shop.id`), never from a hidden form field.
   - The database queries **also** filter every owner read/write by `shop_id`
     (e.g. update product `where id = ? and shop_id = ?`).
   So a forged product or order id from another shop simply doesn't match. ✅
5. **The admin database key stays on the server** (`server-only` guard) and the
   `app_users` table has row-level security with no public policies. ✅

---

## Known limitations (acceptable for v1, to harden later)
- **Sign-up isn't a single transaction.** It creates the shop, then the account.
  If the account step fails on a rare race (e.g. the email is taken in the split
  second between check and insert), a shop with no owner could be left behind.
  Low risk; will wrap in one transaction in real mode later.
- **No password reset / email verification yet** — planned for a later pass.
- **Session age isn't re-checked server-side** beyond the 30-day cookie lifetime.
- Product images are still URL/placeholder based; uploads come in Milestone 4.

---

## Verification summary
- `npm run build` → ✅ compiled, types valid (18 routes)
- `npm run lint` → ✅ clean
- Runtime, no session → `/dashboard*` redirect to `/login` ✅
- Runtime, demo session → overview, products, product add/edit, orders list,
  order detail (+ WhatsApp link), settings all render with the shop's data ✅
