# StoreLink — Pakistan

A simple online shop for WhatsApp & Instagram sellers. Each seller gets their
own storefront link (e.g. `/zara`), a cart, **Cash-on-Delivery** checkout, local
payment options, and every order opens in their **WhatsApp**.

Built with **Next.js + Supabase**. One codebase, **clearly separated** into
database / backend / frontend — never a single file.

---

## ✅ Buyer storefront (Milestone 1)

The full **buyer storefront**, end to end:

`/[slug]` storefront → product page → cart → checkout → **place order (COD or online)** → order confirmation → **Confirm on WhatsApp**

- **Multi-tenant**: one app serves every shop, found by its `slug` in the URL.
- **Money goes straight to the seller** — the platform holds nothing (COD, or the
  seller's own JazzCash/Easypaisa/Raast note shown at checkout).
- **Prices and totals are verified on the server**, never trusted from the browser.
- Runs **instantly with built-in demo data** — no account needed to see it.

> Coming next: **M3** admin panel · **M4** online-payment aggregator + WhatsApp
> Cloud API. (See the roadmap below.)

---

## ✅ Seller dashboard (Milestone 2)

Sellers can now run their shop:

`/signup` (create account + shop) → `/login` → `/dashboard` (overview, **products**, **orders**, **settings**)

- **Sign-up / login / logout** — self-contained email + password auth
  (scrypt-hashed passwords, a signed httpOnly session cookie). No external auth service.
- **Products** — add, edit, **upload photos**, set price / stock / category, hide/show, delete.
- **Orders** — see every order, open the details, **update status**
  (new → confirmed → delivered / cancelled), and message the customer on WhatsApp.
- **Settings** — shop name, link (slug), WhatsApp number, payment note, delivery fees.
- Pages under `/dashboard` are **protected** — signed-out visitors are sent to `/login`.

**Try it in demo mode:** open `/login` and use **demo@shop.pk / PIN 1234**,
or create a brand-new shop at `/signup`.

## ✅ Admin panel (Milestone 3)

The platform owner gets a god-view across every shop at **`/admin`**:

- **Overview** — total shops, active vs paused, total orders, order revenue, and
  estimated **MRR** (monthly recurring revenue) with a plan breakdown.
- **Shops** — a table of every shop with its plan, status, orders and revenue.
- **Shop detail** — change a shop's **subscription plan** (Trial / Starter /
  Growth) and **pause or activate** its storefront.

Admins sign in at the same `/login`; an admin account is routed to `/admin`,
sellers to `/dashboard`. Plan prices live in `src/server/plans.ts` — change them
to your real numbers.

**Try it in demo mode:** sign in at `/login` with **admin@shop.pk / PIN 4321**.

---

---

## 🚀 Run it (2 minutes, no database needed)

```bash
npm install
npm run dev
```

Open **http://localhost:3000** → click "Open the demo shop", or go straight to
**http://localhost:3000/zara**. Add items, check out, and place an order — you'll
get a working "Confirm on WhatsApp" link with the order pre-filled.

To see the **seller side**, open **http://localhost:3000/login** and sign in with
the demo account **demo@shop.pk / PIN 1234** — or create your own at **/signup**.

This works because, when Supabase isn't configured, the app falls back to
built-in demo data (`src/server/mock-data.ts`). Orders are kept in memory in this
mode (they reset when the dev server restarts).

---

## 🗂️ Project structure — backend, frontend & database are separate

```
storelink/
├── db/                         ← DATABASE (separate)
│   ├── schema.sql              · all tables, indexes, security (RLS), triggers
│   ├── seed.sql                · sample shop + products
│   └── README.md
│
├── src/
│   ├── server/                 ← BACKEND (no UI here)
│   │   ├── types.ts            · domain types (Shop, Product, Order, AppUser…)
│   │   ├── supabase/server.ts  · server-only DB client (+ demo fallback switch)
│   │   ├── mock-data.ts        · built-in demo data (shop, products, orders)
│   │   ├── whatsapp.ts         · builds wa.me links (to shop + to customer)
│   │   ├── validate.ts         · form parsing / validation helpers
│   │   ├── auth/               · custom email + password auth
│   │   │   ├── password.ts        · scrypt hashing
│   │   │   ├── session.ts         · signed httpOnly session cookie
│   │   │   ├── user-service.ts    · user records (+ demo seller)
│   │   │   └── current-seller.ts  · session → seller + shop, route guard
│   │   ├── services/           · ALL data access + business logic
│   │   │   ├── shop-service.ts
│   │   │   ├── product-service.ts
│   │   │   └── order-service.ts    (verifies prices, creates orders)
│   │   └── actions/            · server actions (write layer the forms call)
│   │       ├── auth-actions.ts     · sign up / in / out
│   │       ├── product-actions.ts
│   │       ├── order-actions.ts
│   │       └── shop-actions.ts
│   │
│   ├── app/
│   │   ├── api/orders/route.ts ← BACKEND API endpoint (thin; calls a service)
│   │   ├── layout.tsx          ← FRONTEND (root)
│   │   ├── page.tsx            · landing page
│   │   ├── login/  signup/     · seller auth pages
│   │   ├── [slug]/             · the storefront (one per shop)
│   │   │   ├── layout.tsx · page.tsx (grid) · product/[productId]
│   │   │   ├── cart/ · checkout/
│   │   │   └── order/[token]/   · confirmation (unguessable link)
│   │   └── dashboard/          · the seller dashboard (PROTECTED)
│   │       ├── layout.tsx          · auth guard + nav
│   │       ├── page.tsx            · overview
│   │       ├── products/           · list · new · [id]/edit
│   │       ├── orders/             · list · [orderNumber] (detail + status)
│   │       └── settings/
│   │
│   ├── components/             ← FRONTEND (UI building blocks, Sage-styled)
│   │   ├── ui/button.tsx
│   │   ├── storefront/ (product-card, shop-header, add-to-cart, …)
│   │   └── dashboard/ (forms, nav, status-badge, submit-button, …)
│   │
│   └── lib/                    ← shared helpers (format, cart, cn)
│
└── (config: package.json, tsconfig, tailwind, next, postcss, .env.example)
```

**The rule:** the frontend (`src/app`, `src/components`) **never** talks to the
database directly. It calls the **backend** (`src/server/services` or the
`/api` route), and only the backend touches the database. This is the clean
boundary that lets you change or scale any layer without rewriting the others.

---

## 🔌 Connect a real database (when you're ready)

1. Create a free project at **https://supabase.com**.
2. **SQL Editor** → paste **`db/schema.sql`** → Run. (Optional: `db/seed.sql`.)
3. **Storage** → *New bucket* → name it **`product-images`** and tick **Public** (so product photos have public URLs).
4. Copy `.env.example` to **`.env`** and fill in your keys from
   **Supabase → Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # server-only secret — never expose this
```

5. Restart `npm run dev`. The app now reads/writes Supabase instead of demo data.
   **No code changes needed** — the service layer switches automatically.

> **Logins in real mode:** the `demo@shop.pk` account exists only in demo mode.
> With Supabase connected, create your account at `/signup` (it inserts your
> seller into `app_users` and creates your shop). Set a strong **`SESSION_SECRET`**
> in `.env` for production — the app **refuses to run auth in production without it**.
>
> **Making an admin:** sign-up always creates a *seller*. To get the `/admin`
> panel in real mode, set that user's `role` to `admin` in the `app_users` table
> (Supabase → Table editor), then sign in again.

---

## 🎨 Design (Sage)

All brand colours live in **one place**: `tailwind.config.ts`.

| Role | Hex |
|---|---|
| Background | `#F5F8F6` |
| Surface | `#FFFFFF` |
| Text (ink) | `#232C28` |
| Muted | `#6E7A75` |
| Primary | `#43705F` |
| Accent | `#8FBAA9` |
| Border (line) | `#E6EDE9` |
| WhatsApp (only for WhatsApp actions) | `#25D366` |

Mobile-first (a centered ~480px column), minimal, calm. WhatsApp green is used
**only** on the "Chat" / "Confirm on WhatsApp" buttons.

---

## 🛡️ Safety choices baked in

- **No money held by the platform** — COD, or the seller's own payment account.
  This avoids needing a payment/EMI licence.
- **Server-verified prices** — `order-service` re-prices every line from the
  database; the browser can't change prices or totals.
- **Unguessable order links** — the order confirmation page is reached by a random token (not the sequential order number), so customer details can't be found by guessing URLs.
- **Anti-abuse limits** — the public order endpoint caps the number of items, the quantity per item, and the length of every text field.
- **Seller logins** use scrypt-hashed passwords and a **signed, httpOnly session
  cookie**; the dashboard sits behind a server-side guard.
- **Row-Level Security** is defined in `schema.sql`, and the `app_users` table
  (credentials) is locked to the server's service-role key only.
- The **service-role key is server-only** and never imported into client code.

---

## 🛣️ Roadmap

| Milestone | Adds |
|---|---|
| **M1 ✅** | Foundation + database + backend + full buyer storefront (COD + WhatsApp) |
| **M2 ✅ (this build)** | Seller **sign-up/login** + **dashboard** (add products, see & manage orders, shop settings) |
| **M3 ✅ (this build)** | **Admin panel** — platform overview, all shops, plan + status controls |
| **M4** (in progress) | Product **photo uploads** ✅ · online payments · WhatsApp Cloud API · live deploy |

---

## Tech stack

Next.js (App Router, TypeScript) · Tailwind CSS · Supabase (PostgreSQL +
Storage + RLS) · custom email/password auth (scrypt + signed httpOnly cookies).
Deploy on Vercel; Cloudflare for DNS/CDN. All free to start.
