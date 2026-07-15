# QA / Lab Test — Milestone 4

M4 turns the app from "works on my machine" into "live and earning." It has four
parts, and three of them (card payments, WhatsApp Cloud API, live deploy) depend
on **external accounts and approvals** that can't be set up or tested from a
sandbox. So M4 is delivered in **tested parts**. This file is appended as each
part lands.

---

## Part 1 — Product image uploads ✅

Sellers can upload real product photos. Storefront and dashboard render them.

**Result: ✅ PASS** — builds clean, lint clean, upload flow verified at runtime.

### How it works
- **Real mode:** photos upload to a **public Supabase Storage bucket**
  (`product-images`) and the public URL is saved on the product.
- **Demo mode (no Supabase):** photos are kept in memory and served from
  `/api/uploads/demo/<id>`, so the whole flow works with no external storage
  (resets on server restart, like demo orders).
- The product form has a **Photos** uploader (add up to 5, remove, first is the
  cover); the storefront product card and product page show them automatically.

### Basic
| Check | Result |
|---|---|
| Build compiles (16 routes incl. upload endpoints) | ✅ 0 errors |
| Lint clean | ✅ |
| Product form shows the photo uploader | ✅ (build-verified wiring) |

### Medium / Expert (security + validation), verified at runtime
- **Uploads require a signed-in seller.** Anonymous `POST /api/uploads` → **401**. ✅
- **Type is checked.** A non-image upload → **400** "Use a JPG, PNG, WEBP or GIF". ✅
- **Size is capped at 4 MB** (server-enforced), max 5 photos per product. ✅
- **A valid image** from a seller → **200** with a URL, and fetching that URL
  returns the stored bytes with the right `image/png` content-type. ✅
- Uploads are namespaced by shop id in real-mode storage paths. ✅

### Known limitations
- Demo images live in memory (reset on restart). Real mode uses Supabase Storage.
- No server-side image re-compression/resizing yet (the 4 MB cap keeps it sane);
  could add thumbnail generation later.
- Requires a **public** `product-images` bucket in Supabase for real mode (one-time
  setup, documented in the README).

---

## Part 2 — Online payments — _planned next_
A complete online-payment flow (order → hosted checkout → confirmation), testable
end-to-end in demo, with a real Pakistani aggregator (e.g. Safepay) as a drop-in
adapter + your merchant keys.

## Part 3 — WhatsApp Cloud API — _planned_
Automatic order notifications via Meta's WhatsApp Cloud API (replacing the manual
click-to-send link), once a verified Meta Business account + template approval are
in place.

## Part 4 — Deployment — _planned_
A production deployment guide (Vercel + domain + env + Supabase), with a
go-live checklist.
