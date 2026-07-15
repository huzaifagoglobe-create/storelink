# StoreLink — Deployment Guide

Built directly from the current code, so the env vars, bucket names, and steps
below are exact (not guesses). Follow top to bottom.

---

## 1. Supabase (database + file storage)

1. Create a Supabase project.
2. Open the **SQL Editor** and run the entire `db/schema.sql` file. (Safe to re-run any time you update StoreLink — every statement is `if not exists`, so upgrades just add the new tables/columns like `resellers` and the referral fields.)
   - Safe to re-run anytime — it uses `add column if not exists`.
   - **If you deployed before:** re-run it now. This version adds `courier` and
     `tracking_number` to the orders table for the parcel-tracking feature; without
     re-running, tracking silently won't save.
3. Create **two Storage buckets** (Storage → New bucket):
   - `product-images` → **Public** (product photos and shop banners).
   - `verification-docs` → **Private** (CNIC photos + selfies; never public).
4. From Project Settings → API, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose).

---

## 2. Environment variables

Set these in your host (Vercel → Project → Settings → Environment Variables).

### Required — the app won't work correctly without these
| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (secret) |
| `SESSION_SECRET` | Long random string for signing login sessions. In production the app refuses to run without it. Generate: `openssl rand -base64 48` |
| `NEXT_PUBLIC_SITE_URL` | Your live URL, e.g. `https://storelink.pk` (used for links, sitemap, SEO) |

### Required for email (password reset, order emails)
| Variable | What it is |
|---|---|
| `RESEND_API_KEY` | Resend API key. **Without it, in production email sending fails loudly** (it will not silently log messages). |
| `EMAIL_FROM` | From-address, e.g. `StoreLink <noreply@storelink.pk>` (must be a verified Resend domain) |

### Recommended
| Variable | What it is |
|---|---|
| `FIELD_ENCRYPTION_KEY` | Separate key for encrypting CNIC/payout numbers. Falls back to `SESSION_SECRET`, but set this separately so rotating the session secret doesn't make stored CNIC/payout data unreadable. Generate: `openssl rand -base64 48` |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | Your support WhatsApp in international format, digits only, e.g. `923390331975`. Every "contact us / upgrade" button opens a chat to this number. |

### Optional
| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Fallback support email if no WhatsApp set |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 ID (e.g. `G-XXXXXXX`) — analytics only load if set |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Plausible domain if you use Plausible instead of GA |
| `INDEXNOW_KEY` | Key for IndexNow (fast Bing/ChatGPT indexing). A built-in default works out of the box. **Only if you set a custom value:** also rename the file `src/app/<key>.txt/route.ts` and the string it returns to match. |
| `PAYMENT_GATEWAY` | Turns on online card/wallet payments and selects the provider. Leave unset to keep online payment off (COD + manual transfer still work). Set to `sandbox` to demo the full pay flow, or to a real provider name once you've added its adapter + keys in `src/server/payments/gateway.ts`. Only verified shops can accept it. |
| `AI_API_KEY` | **Optional upgrade** for the "Make it unique" button. **Leave this unset and the button works for free** using a built-in (no-AI) rewrite. If you later want higher-quality rewrites, set this to a key from any OpenAI-compatible provider (OpenRouter, Google Gemini, Groq, NVIDIA — most have free tiers), plus `AI_BASE_URL` (e.g. `https://openrouter.ai/api/v1`) and `AI_MODEL` (the model id). No code change needed to switch on later. |
| `BILLING_GATE` | `1` turns on paid-subscription gating (paused/pending shops see the "pay to activate" screen). Off by default. |
| `BILLING_PAY_FIRST` | `1` makes new signups pay before going live. Off by default (recommended: let them build on the trial first). |
| `BILLING_WEBHOOK_SECRET` | Only needed when you connect a real payment gateway to `/api/billing/webhook`. Inert until set. |

---

## 3. Deploy on Vercel

1. Push the code to a Git repo and import it in Vercel (framework auto-detects Next.js).
2. Add all env vars from Section 2.
3. **Use the Vercel Pro plan once you charge sellers** — the free Hobby plan
   prohibits commercial use.
4. Deploy.

### IndexNow verification (for fast Bing / ChatGPT indexing)
After the site is live, confirm `https://<your-domain>/<key>.txt` loads and shows
the key (default key is already wired). This lets Bing verify IndexNow pings, which
fire automatically when products/shops change.

---

## 4. DNS (custom domain)

1. In Vercel, add your domain (e.g. `storelink.pk`).
2. Point DNS at Vercel (Cloudflare works well in front — keep proxy on for the
   free CDN, which offloads traffic from Vercel).
3. For email deliverability, add Resend's SPF/DKIM records to your domain so mail
   doesn't land in spam.

---

## 5. First live smoke test (do this once after deploy)

Run through the real flow on the live site, since everything before this is demo mode:

1. **Sign up** a test shop → you should land on the dashboard on a 14-day trial.
2. **Add a product** with a photo → confirm the image uploads (goes to
   `product-images`) and shows on the storefront.
3. **Open the storefront** at `your-domain.com/your-slug` → add to cart → checkout
   with **Cash on Delivery** → place the order.
4. Confirm the order appears in the seller dashboard, and (if `RESEND_API_KEY` is
   set) the confirmation emails send.
5. As the seller, open the order → set a **courier + tracking number** → open the
   buyer's order link → confirm the "Track your parcel" card + track link show.
6. **Submit verification** (CNIC + selfie) → log in as admin → confirm the
   documents open via short-lived signed URLs (they must NOT be public).
7. Log in as **admin** (your admin account) → confirm you can see shops and use the
   billing "mark paid" controls.

If all seven pass on live data, you're good.

---

## 6. Admin & demo accounts

- Demo mode (no Supabase) seeds test accounts for local clicking:
  seller `demo@shop.pk` / PIN `1234`, admin `admin@shop.pk` / PIN `4321`.
- **In production these seeds are not used** — real accounts come from signups and
  from whoever you mark as admin in the database. Create your own admin account and
  set its role to admin directly in Supabase.

---

## Quick reference — what's automatic vs. what needs you

**Automatic (already coded):** sessions/security headers/CSP, server-side price
recompute, private CNIC bucket + signed URLs, login rate-limiting, stock decrement,
sitemap + SEO metadata + LocalBusiness schema + IndexNow pings, trial countdown,
courier tracking display, wishlist, saved address, customer broadcast, low-stock
alerts.

**Needs you (config, not code):** the env vars above, running `db/schema.sql`,
creating the two buckets, DNS + Resend records, Vercel Pro when you charge, and the
one live smoke test.
