# Database

This folder holds the database design. It is **separate** from the backend code
and the frontend on purpose.

- **`schema.sql`** — all tables, indexes, row-level-security (RLS) policies and
  triggers. Run it once in the Supabase SQL editor.
- **`seed.sql`** — sample shop (`zara`) and products for testing. Optional.

## Setup (only when you want a real database)

1. Create a free project at https://supabase.com
2. Open **SQL Editor** → paste `schema.sql` → Run.
3. (Optional) paste `seed.sql` → Run, to get a demo shop.
4. Copy your keys from **Project Settings → API** into `.env` (see `.env.example`).

> Until you do this, the app runs on built-in demo data (`src/server/mock-data.ts`),
> so you can develop the whole frontend before touching Supabase.

## The tables

| Table | Holds |
|---|---|
| `profiles` | logged-in users (seller / admin) |
| `shops` | each seller's shop (the tenants) — keyed by `slug` |
| `products` | products, each tied to a `shop_id` |
| `orders` | orders, each tied to a `shop_id` |
| `order_items` | the line items inside an order |
| `subscriptions` | platform billing (used by the admin panel later) |

Everything is tagged with `shop_id`; that tag + RLS is what keeps each shop's
data private from every other shop.
