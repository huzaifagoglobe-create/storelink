# QA / Lab Test — Milestone 3 (Admin panel)

Review of the platform-owner admin panel: a god-view across every shop, with
plan and status controls. Checked at **basic**, **medium**, and **expert**
levels, focused on **role separation** (a seller must never reach admin, and an
admin must never land in a seller's dashboard).

**Result: ✅ PASS** — builds clean, lint clean, and role separation verified at
runtime in all four cases (admin / seller / cross / guest).

---

## What Milestone 3 adds
- **`/admin` overview** — totals across the whole platform: number of shops,
  active vs paused, total orders, order revenue, estimated monthly recurring
  revenue (MRR), and a plan breakdown.
- **`/admin/shops`** — a table of every shop with plan, status, order count and
  revenue.
- **`/admin/shops/[id]`** — one shop's detail with **plan control** (change the
  subscription tier) and **status control** (pause / activate the storefront),
  plus its recent orders.
- **Admin login routing** — an admin account is sent to `/admin` on login;
  sellers still go to `/dashboard`.
- **Plan pricing config** (`src/server/plans.ts`) — Trial / Starter / Growth with
  monthly prices, used to compute MRR. Change these to your real prices.

Demo admin login: **admin@shop.pk / PIN 4321** (the demo data also seeds a few
extra shops so the panel looks real).

---

## Basic level (does it work)
| Check | Result |
|---|---|
| Production build compiles | ✅ 14 routes (3 new admin), 0 errors |
| Lint clean | ✅ no warnings or errors |
| `/admin` renders platform overview (MRR, shop list) | ✅ runtime 200 |
| `/admin/shops` renders the shops table | ✅ runtime 200 |
| `/admin/shops/[id]` renders detail + controls | ✅ runtime 200 |
| Storefront + seller dashboard still work | ✅ runtime 200 |

---

## Medium level (correctness)
- **Stats are computed in one pass.** All orders are grouped by shop once to get
  per-shop counts and revenue, then the platform totals are summed from those
  rows (no repeated scans). ✅
- **Revenue excludes cancelled orders.** Cancelled orders are counted in the
  order count but not in revenue or MRR. ✅
- **MRR = active shops only.** Paused shops don't count toward recurring revenue. ✅
- **Plan changes are allow-listed.** Only `trial / starter / growth` are accepted. ✅
- **Status control is contextual.** A live shop shows "Pause shop"; a paused shop
  shows "Activate shop" (verified at runtime on the paused demo shop). ✅

---

## Expert level (security / role separation)
The whole point of an admin panel is elevated access, so the guard is what
matters most. Verified at runtime with forged-but-valid session cookies:

1. **Admin pages require an admin session.** `requireAdmin()` runs at the top of
   every `/admin` page and action.
   - Guest → `/admin` redirected to `/login`. ✅
   - Seller → `/admin` redirected to `/dashboard` (not shown the panel). ✅
   - Admin → `/dashboard` redirected to `/login` (admins have no shop). ✅
2. **No privilege escalation.** Sign-up always creates a **seller** (role is set
   on the server; the form can't request "admin"). Becoming an admin requires
   changing the role directly in the database. ✅
3. **Admin reads use the server's service-role key** (the intended god-view) and
   sit entirely behind the admin guard, so cross-shop data is never exposed to a
   seller. ✅
4. **Admin writes (plan / status)** are admin-guarded and take the shop id from
   the form but only ever change the `plan` / `is_active` columns. ✅

---

## Known limitations (acceptable for v1)
- **Demo-mode admin changes are in memory** — pausing a shop or changing a plan
  persists until the server restarts (same as demo orders).
- **MRR is estimated from plan price**, not from real payment records. The
  `subscriptions` table exists for precise billing in a later milestone.
- **No admin-side audit log** yet (who changed what, when).
- At very large scale the overview would move to SQL aggregation instead of
  loading all orders; fine for now.

---

## Verification summary
- `npm run build` → ✅ 14 routes, types valid
- `npm run lint` → ✅ clean
- Runtime role matrix → admin ✓ sees panel; seller ✓ blocked → dashboard;
  admin ✓ blocked from dashboard → login; guest ✓ → login
- Runtime content → overview MRR + shops, shops table, shop detail with working
  plan + pause/activate controls all render ✓
