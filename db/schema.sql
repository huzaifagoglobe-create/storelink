-- ============================================================================
-- StoreLink — Database schema (PostgreSQL / Supabase)
-- ============================================================================
-- Run this in the Supabase SQL editor (or psql) to create all tables,
-- indexes, row-level-security policies and triggers.
--
-- Multi-tenancy rule: almost everything is tagged with shop_id. That tag is
-- how one database safely holds thousands of separate shops.
-- ============================================================================

-- ---------- Enums -----------------------------------------------------------
-- Plan names must match PLAN_TIERS in src/server/plans.ts exactly. They were
-- renamed (starter/growth -> basic/pro/premium) and the enum was left behind,
-- so every admin plan change failed with "invalid input value for enum".
do $$ begin
  create type plan_tier      as enum ('trial', 'basic', 'pro', 'premium');
exception when duplicate_object then null; end $$;

-- For databases created before that rename: add the current values. (Old
-- 'starter'/'growth' values stay behind harmlessly — Postgres cannot drop enum
-- values, and nothing uses them.)
alter type plan_tier add value if not exists 'basic';
alter type plan_tier add value if not exists 'pro';
alter type plan_tier add value if not exists 'premium';

do $$ begin
  create type order_status   as enum ('new', 'confirmed', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('cod', 'online');
exception when duplicate_object then null; end $$;

-- ---------- Helper: keep updated_at fresh -----------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------- profiles (one row per logged-in user) ---------------------------
-- A profile links a Supabase auth user to a role. Sellers own one shop.
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'seller' check (role in ('seller', 'admin')),
  created_at  timestamptz not null default now()
);

-- ---------- shops (the tenants) ---------------------------------------------
create table if not exists shops (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid references profiles(id) on delete set null,
  slug               text not null unique,             -- the "zara" in ourapp.pk/zara
  name               text not null,
  tagline            text,
  industry text,
  logo_text          text,                             -- initials shown in the logo circle
  whatsapp           text not null,                    -- digits only, e.g. 923001234567
  payment_note       text,                             -- seller's own JazzCash/Easypaisa/Raast info
  free_delivery_over numeric(12,2),                    -- null = no free-delivery threshold
  delivery_fee       numeric(12,2) not null default 0,
  currency           text not null default 'PKR',
  plan               plan_tier not null default 'trial',
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists trg_shops_updated_at on shops;
create trigger trg_shops_updated_at
  before update on shops
  for each row execute function set_updated_at();

-- ---------- products --------------------------------------------------------
create table if not exists products (
  id                uuid primary key default gen_random_uuid(),
  shop_id           uuid not null references shops(id) on delete cascade,
  name              text not null,
  description       text,
  price             numeric(12,2) not null check (price >= 0),
  compare_at_price  numeric(12,2),                     -- old/struck-through price
  stock             integer not null default 0 check (stock >= 0),
  category          text,
  image_urls        text[] not null default '{}',
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ---------- orders ----------------------------------------------------------
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    bigserial unique,                    -- human-friendly id (e.g. #1043)
  public_token    uuid not null default gen_random_uuid(),  -- unguessable id for the public order URL
  shop_id         uuid not null references shops(id) on delete cascade,
  customer_name   text not null,
  customer_phone  text not null,
  customer_email  text,
  address         text not null,
  city            text not null,
  payment_method  payment_method not null default 'cod',
  subtotal        numeric(12,2) not null,
  delivery_fee    numeric(12,2) not null default 0,
  total           numeric(12,2) not null,
  status          order_status not null default 'new',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ---------- order_items -----------------------------------------------------
create table if not exists order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  name        text not null,                           -- snapshot at purchase time
  price       numeric(12,2) not null,                  -- snapshot at purchase time
  quantity    integer not null check (quantity > 0)
);

-- ---------- subscriptions (platform billing — used in admin, later) ---------
create table if not exists subscriptions (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references shops(id) on delete cascade,
  plan         plan_tier not null default 'trial',
  amount       numeric(12,2) not null default 0,        -- monthly fee in PKR
  is_active    boolean not null default true,
  renews_at    date,
  created_at   timestamptz not null default now()
);

-- ---------- Indexes (keep look-ups fast at scale) ---------------------------
create index if not exists idx_shops_slug         on shops (slug);
create index if not exists idx_shops_owner         on shops (owner_id);
create index if not exists idx_products_shop       on products (shop_id);
create index if not exists idx_products_shop_active on products (shop_id, is_active);
create index if not exists idx_orders_shop         on orders (shop_id, created_at desc);
create unique index if not exists idx_orders_public_token on orders (public_token);
create index if not exists idx_order_items_order   on order_items (order_id);
create index if not exists idx_subscriptions_shop  on subscriptions (shop_id);

-- ============================================================================
-- Row-Level Security (RLS)
-- ----------------------------------------------------------------------------
-- The storefront reads with the public (anon) key, so active shops/products
-- must be publicly readable. Everything a seller manages is locked to the
-- shop they own. The server uses the service-role key, which bypasses RLS.
-- ============================================================================
alter table profiles      enable row level security;
alter table shops         enable row level security;
alter table products      enable row level security;
alter table orders        enable row level security;
alter table order_items   enable row level security;
alter table subscriptions enable row level security;

-- profiles: a user can see/update only their own profile
drop policy if exists "own profile - select" on profiles;
create policy "own profile - select" on profiles for select using (auth.uid() = id);
drop policy if exists "own profile - update" on profiles;
create policy "own profile - update" on profiles for update using (auth.uid() = id);

-- shops: anyone can read ACTIVE shops; owners manage their own
drop policy if exists "public read active shops" on shops;
create policy "public read active shops" on shops
  for select using (is_active = true);
drop policy if exists "owner manages shop" on shops;
create policy "owner manages shop" on shops
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- products: anyone can read ACTIVE products of ACTIVE shops; owners manage theirs
drop policy if exists "public read active products" on products;
create policy "public read active products" on products
  for select using (
    is_active = true
    and exists (select 1 from shops s where s.id = products.shop_id and s.is_active = true)
  );
drop policy if exists "owner manages products" on products;
create policy "owner manages products" on products
  for all using (
    exists (select 1 from shops s where s.id = products.shop_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from shops s where s.id = products.shop_id and s.owner_id = auth.uid())
  );

-- orders: a buyer (anon) may CREATE an order; only the shop owner may read them
drop policy if exists "anyone can place an order" on orders;
create policy "anyone can place an order" on orders
  for insert with check (true);
drop policy if exists "owner reads shop orders" on orders;
create policy "owner reads shop orders" on orders
  for select using (
    exists (select 1 from shops s where s.id = orders.shop_id and s.owner_id = auth.uid())
  );
drop policy if exists "owner updates shop orders" on orders;
create policy "owner updates shop orders" on orders
  for update using (
    exists (select 1 from shops s where s.id = orders.shop_id and s.owner_id = auth.uid())
  );

-- order_items: insert allowed with the order; readable by the shop owner
drop policy if exists "anyone can add order items" on order_items;
create policy "anyone can add order items" on order_items
  for insert with check (true);
drop policy if exists "owner reads order items" on order_items;
create policy "owner reads order items" on order_items
  for select using (
    exists (
      select 1 from orders o join shops s on s.id = o.shop_id
      where o.id = order_items.order_id and s.owner_id = auth.uid()
    )
  );

-- subscriptions: owner reads their own (admin handled via service-role server-side)
drop policy if exists "owner reads subscription" on subscriptions;
create policy "owner reads subscription" on subscriptions
  for select using (
    exists (select 1 from shops s where s.id = subscriptions.shop_id and s.owner_id = auth.uid())
  );

-- ---------- app_users (custom email + password auth) ------------------------
-- Self-contained seller/admin auth (NOT Supabase Auth). Passwords are
-- scrypt-hashed. This table is read/written only via the service-role key on
-- the server; RLS is enabled with no policies, so nothing else can touch it.
create table if not exists app_users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  full_name     text,
  shop_id       uuid references shops(id) on delete set null,
  -- 'staff' is used by the Team feature (owner adds up to 5 staff logins).
  -- It was missing from this check, so addStaffAction() failed on a real database.
  role          text not null default 'seller' check (role in ('seller','staff','admin')),
  created_at    timestamptz not null default now()
);
create unique index if not exists idx_app_users_email on app_users (lower(email));
alter table app_users enable row level security;
-- (intentionally no policies → only the service-role key may access it)

-- Categories (managed per shop; products link by category name)
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (shop_id, slug)
);
create index if not exists categories_shop_idx on categories(shop_id);

-- Discount codes
create table if not exists discounts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  code text not null,
  type text not null default 'percent',
  value numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (shop_id, code)
);
create index if not exists discounts_shop_idx on discounts(shop_id);
alter table orders add column if not exists discount numeric not null default 0;
alter table orders add column if not exists discount_code text;
alter table orders add column if not exists courier text;
alter table orders add column if not exists tracking_number text;
-- Online payment tracking. payment_state: 'none' (COD), 'pending' (awaiting
-- gateway), 'paid' (confirmed), 'failed'. gateway/gateway_ref identify the
-- transaction with whichever provider processed it.
alter table orders add column if not exists payment_state text not null default 'none';
alter table orders add column if not exists gateway text;
alter table orders add column if not exists gateway_ref text;
-- COD reconciliation: has the seller actually received the cash for this
-- delivered Cash-on-Delivery order? Lets sellers track money owed vs collected.
alter table orders add column if not exists cod_collected boolean not null default false;

-- Profit tracking: the seller's private cost per item. Snapshotted onto order
-- items at purchase time so later cost changes don't rewrite history.
alter table products add column if not exists cost_price numeric(12,2);
alter table order_items add column if not exists cost numeric(12,2);

-- Brand logo image (optional). Falls back to initials when not set.
alter table shops add column if not exists logo_url text;

-- Seller "Pages": short about text + a return-policy choice. Terms & Privacy
-- pages are generated automatically from shop details (no columns needed).
alter table shops add column if not exists about_text text;
alter table shops add column if not exists return_policy text;       -- '7day' | 'exchange' | 'none'
alter table shops add column if not exists return_policy_note text;  -- optional extra lines

-- Product video (YouTube/TikTok/Instagram link) + scheduled "Live Drop" time.
alter table products add column if not exists video_url text;
alter table products add column if not exists drop_at timestamptz;

-- Where a new shop came from (?src= tracking: tiktok, storefront, codcalc…).
alter table shops add column if not exists signup_source text;

-- Seller success stories (written by admin, public at /stories).
create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  shop_id uuid references shops(id) on delete set null,
  body text not null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Acquisition machine: where signups come from + seller-refers-seller.
-- Shop street address (shown on the storefront / used in LocalBusiness schema).
alter table shops add column if not exists address text;
alter table shops add column if not exists signup_source text;      -- ?src= tag (tiktok, storefront…)
alter table shops add column if not exists promo_code text;         -- promo code used at signup
alter table shops add column if not exists referred_by_shop text;   -- slug of the referring shop
alter table shops add column if not exists referrer_rewarded boolean not null default false;

-- Prospect leads ("Get your shop built free" form) — the founder's pipeline.
create table if not exists seller_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text not null,
  selling text,
  source text,
  status text not null default 'new', -- new | contacted | won | lost
  created_at timestamptz not null default now()
);

-- Promo codes: longer trials for campaigns (EID45 = 45-day trial).
create table if not exists promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  trial_days int not null default 30,
  is_active boolean not null default true,
  uses int not null default 0,
  created_at timestamptz not null default now()
);

-- Seller success stories (published at /stories).
create table if not exists seller_stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  seller_name text not null,
  body text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Bazaar curation: featured shops pin to the top of the Bazaar.
alter table shops add column if not exists featured boolean not null default false;

-- Platform announcements: shown as a banner in every seller dashboard.
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Marketing tracking + custom SEO (per shop) + product size charts.
alter table shops add column if not exists fb_pixel_id text;
alter table shops add column if not exists ga_measurement_id text;
alter table shops add column if not exists seo_title text;
alter table shops add column if not exists seo_description text;
alter table products add column if not exists size_chart_url text;

-- Khata: the seller's expense ledger (stock, packaging, courier, ads, bills).
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  amount numeric(12,2) not null,
  category text not null,
  note text,
  spent_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists idx_expenses_shop on expenses (shop_id, spent_on desc);

-- Staff accounts: extra logins that manage the SAME shop (role 'staff' on
-- app_users, sharing the owner's shop_id). Owners keep Plan/Team/Danger zone.

-- Referral loop: buyers share a link after delivery; the friend's order gets
-- Rs off and records who referred it. referral_rewarded marks that the
-- referrer has been given their own reward for this referral.
alter table shops add column if not exists referral_amount int; -- Rs off (null/0 = program off)
alter table orders add column if not exists referred_by text;   -- publicToken of the referrer's order
alter table orders add column if not exists referral_rewarded boolean not null default false;

-- Reseller network: sellers give resellers a tagged link; orders carry the tag.
create table if not exists resellers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null,
  phone text not null,
  code text not null,
  commission_percent int not null default 10,
  created_at timestamptz not null default now(),
  unique (shop_id, code)
);
alter table orders add column if not exists reseller_code text;

-- Storewide flash sale: percent off until sale_ends_at (null/past = no sale).
alter table shops add column if not exists sale_percent int;
alter table shops add column if not exists sale_ends_at timestamptz;

-- Lightweight storefront analytics. One row per visit to a shop or product page.
-- Kept minimal (no PII) — just enough to show sellers traffic + top products.
create table if not exists page_views (
  id         bigserial primary key,
  shop_id    uuid not null references shops(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  kind       text not null,            -- 'shop' | 'product'
  created_at timestamptz not null default now()
);
alter table page_views add column if not exists source text; -- 'instagram' | 'facebook' | ...
create index if not exists idx_pv_shop on page_views (shop_id, created_at desc);
create index if not exists idx_pv_product on page_views (product_id) where product_id is not null;

-- Lead capture: visitors who opt in (notify-me / newsletter) without ordering.
-- Feeds the seller's WhatsApp broadcast so they can grow an audience.
create table if not exists leads (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references shops(id) on delete cascade,
  phone          text not null,
  name           text,
  source         text,                 -- 'notify' | 'newsletter'
  product_id     uuid references products(id) on delete set null,
  created_at     timestamptz not null default now(),
  unique (shop_id, phone)
);
alter table leads enable row level security;
create index if not exists idx_leads_shop on leads (shop_id, created_at desc);

-- Abandoned carts: captured when a buyer reaches checkout and enters a phone
-- but doesn't complete the order. Lets the seller follow up on WhatsApp.
create table if not exists abandoned_carts (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references shops(id) on delete cascade,
  customer_name  text,
  customer_phone text not null,
  items          jsonb not null default '[]'::jsonb,
  subtotal       numeric(12,2) not null default 0,
  recovered      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (shop_id, customer_phone)
);
alter table abandoned_carts enable row level security;
create index if not exists idx_abandoned_shop on abandoned_carts (shop_id, created_at desc);

-- Storefront customization
alter table shops add column if not exists theme_color text;
alter table shops add column if not exists banner_style text not null default 'none';
alter table shops add column if not exists banner_image text;
alter table shops add column if not exists banner_heading text;
alter table shops add column if not exists banner_subtext text;

-- Delivery rates by city
alter table shops add column if not exists delivery_zones jsonb not null default '[]'::jsonb;

-- Product reviews
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  product_id uuid not null,
  rating int not null check (rating between 1 and 5),
  author text not null default 'Anonymous',
  comment text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists reviews_product_idx on reviews(product_id);

-- Review photos: buyers can attach up to 3 image URLs (from our upload endpoint).
-- (Kept as an ALTER so existing databases pick the column up on re-run; it must
--  come AFTER the create table above, or a fresh database has nothing to alter.)
alter table reviews add column if not exists photos jsonb not null default '[]'::jsonb;

-- Product variant options
alter table products add column if not exists options jsonb not null default '[]'::jsonb;

-- Product tag/badge (e.g. "New", "Sale") shown on the product card.
alter table products add column if not exists tag text;

-- Optional long description shown in its own tab on the product page.
-- The short `description` above is the quick pitch; this is for sellers who
-- want to write properly for Google (fabric, care, sizing, story…).
alter table products add column if not exists long_description text;
alter table order_items add column if not exists variant text;

-- ---------- password_resets (forgot-PIN flow) -------------------------------
-- Single-use, time-limited reset tokens. Only the SHA-256 hash is stored, so a
-- database leak never exposes a usable link. Written only via the service role.
create table if not exists password_resets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references app_users(id) on delete cascade,
  token_hash  text not null,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists idx_password_resets_token_hash on password_resets (token_hash);
alter table password_resets enable row level security;
-- (intentionally no policies → only the service-role key may access it)

-- ---------- seller verification + payout (trust system) ---------------------
alter table shops add column if not exists verification_status text not null default 'unverified';
alter table shops add column if not exists cnic_number text;
alter table shops add column if not exists cnic_image_url text;
alter table shops add column if not exists selfie_image_url text;
alter table shops add column if not exists payout_method text;
alter table shops add column if not exists payout_account_name text;
alter table shops add column if not exists payout_account_number text;
alter table shops add column if not exists verification_submitted_at timestamptz;
alter table shops add column if not exists verification_reviewed_at timestamptz;
alter table shops add column if not exists verification_note text;

-- ---------- shop_reports (buyer reports a shop) -----------------------------
create table if not exists shop_reports (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references shops(id) on delete cascade,
  reason      text not null,
  details     text,
  status      text not null default 'open',
  created_at  timestamptz not null default now()
);
create index if not exists idx_shop_reports_status on shop_reports (status);
alter table shop_reports enable row level security;

-- ---------- social links (shown on storefront) ------------------------------
alter table shops add column if not exists instagram_url text;
alter table shops add column if not exists facebook_url text;
alter table shops add column if not exists tiktok_url text;
alter table shops add column if not exists youtube_url text;

-- ---------- storefront template ---------------------------------------------
alter table shops add column if not exists template text not null default 'classic';

-- ---------- session revocation (set on password reset) ----------------------
-- Sessions issued before this timestamp are rejected by the app, so resetting
-- a PIN logs out any existing (possibly stolen) sessions.
alter table app_users add column if not exists sessions_valid_from timestamptz;

-- ---------- shared rate limiting (works across serverless instances) --------
-- Backs rateLimitDb() in the app. Fixed-window counters keyed by bucket+window.
create table if not exists rate_limits (
  bucket      text primary key,
  count       integer not null default 0,
  expires_at  timestamptz not null
);
create index if not exists idx_rate_limits_expires on rate_limits (expires_at);

-- Atomic "register one hit"; returns true if still within the limit.
create or replace function rl_hit(p_key text, p_limit int, p_window_secs int)
returns boolean
language plpgsql
as $$
declare
  v_window bigint := floor(extract(epoch from now()) / p_window_secs);
  v_bucket text := p_key || ':' || v_window;
  v_count  int;
begin
  insert into rate_limits (bucket, count, expires_at)
    values (v_bucket, 1, now() + make_interval(secs => p_window_secs))
  on conflict (bucket)
    do update set count = rate_limits.count + 1
  returning count into v_count;

  -- opportunistic cleanup of old windows
  delete from rate_limits where expires_at < now();

  return v_count <= p_limit;
end;
$$;

-- ---------- verification documents bucket (PRIVATE — CNIC + selfie) ---------
-- IMPORTANT: create a SEPARATE, PRIVATE Storage bucket named 'verification-docs'
-- for CNIC photos and selfies. Do NOT make it public. The app stores only the
-- storage PATH for these and serves them to admins via short-lived signed URLs.
-- (Product images stay in the public 'product-images' bucket.)

-- ---------- atomic stock decrement (on order placement) ---------------------
-- Atomically decrement stock ONLY if enough is available. Returns true on
-- success, false if there wasn't enough (prevents overselling under concurrency).
create or replace function dec_stock(p_id uuid, p_shop uuid, p_qty int)
returns boolean
language plpgsql
as $$
declare
  updated int;
begin
  update products set stock = stock - p_qty
  where id = p_id and shop_id = p_shop and stock >= p_qty;
  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;

-- ---------- free-trial window ----------------------------------------------
alter table shops add column if not exists trial_ends_at timestamptz;

-- ---------- email verification ---------------------------------------------
alter table app_users add column if not exists email_verified_at timestamptz;

-- ---------- per-variant stock ----------------------------------------------
alter table products add column if not exists variant_stock jsonb;

create or replace function dec_variant_stock(p_id uuid, p_shop uuid, p_key text, p_qty int)
returns boolean
language plpgsql
as $$
declare
  updated int;
begin
  update products
  set variant_stock = jsonb_set(
    coalesce(variant_stock, '{}'::jsonb),
    array[p_key],
    to_jsonb(coalesce((variant_stock ->> p_key)::int, 0) - p_qty)
  )
  where id = p_id and shop_id = p_shop
    and coalesce((variant_stock ->> p_key)::int, 0) >= p_qty;
  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;

-- ---------- subscription / manual billing -----------------------------------
alter table shops add column if not exists subscription_status text not null default 'active';

-- Widen app_users.role for databases created before 'staff' was allowed.
do $$ begin
  alter table app_users drop constraint if exists app_users_role_check;
  alter table app_users add constraint app_users_role_check check (role in ('seller','staff','admin'));
exception when undefined_table then null; end $$;
alter table shops add column if not exists plan_expires_at timestamptz;

create table if not exists subscription_payments (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references shops(id) on delete cascade,
  amount       numeric not null,
  plan         text not null,
  months       int not null default 1,
  method       text,            -- 'manual' | 'assanpay' | 'safepay' | ...
  reference    text,            -- gateway ref or admin note
  recorded_by  text,            -- 'admin' | 'webhook'
  created_at   timestamptz not null default now()
);
create index if not exists idx_sub_payments_shop on subscription_payments (shop_id);
