"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { tr, type Lang } from "@/lib/i18n";

type PaymentMethod = "cod" | "online" | "gateway";

export type PayOnline = {
  method: string | null;
  accountName: string | null;
  accountNumber: string | null;
  whatsapp: string;
} | null;

export type PayGateway = { label: string } | null;

export type DeliveryConfig = {
  fee: number;
  freeOver: number | null;
  zones: { city: string; fee: number }[];
};

type PlacedOrder = {
  id: string;
  publicToken: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  discountCode: string | null;
  total: number;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string;
  city: string;
  createdAt: string;
  items: { id: string; name: string; price: number; quantity: number; variant: string | null }[];
};

const METHOD_LABEL: Record<string, string> = {
  easypaisa: "Easypaisa",
  jazzcash: "JazzCash",
  sadapay: "SadaPay",
  nayapay: "NayaPay",
  bank: "Bank account",
};
const methodLabel = (m: string | null) => (m ? METHOD_LABEL[m] ?? m : "Online");

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

export function CheckoutClient({
  lang,
  slug,
  shopName,
  whatsapp,
  currency,
  payOnline,
  payGateway,
  delivery,
}: {
  lang: Lang;
  slug: string;
  shopName: string;
  whatsapp: string;
  currency: string;
  payOnline: PayOnline;
  payGateway: PayGateway;
  delivery: DeliveryConfig;
}) {
  const { ready, items, subtotal, clear } = useCart();

  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", email: "" });
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountMsg, setDiscountMsg] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [copiedAcct, setCopiedAcct] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  // Remember buyer details across visits (their own device only) so returning
  // customers don't retype name/phone/address every time. Not tied to a shop —
  // the same person reuses it anywhere on StoreLink.
  const SAVED_KEY = "wsb-buyer";
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setForm((f) => ({
          name: s.name || f.name,
          phone: s.phone || f.phone,
          address: s.address || f.address,
          city: s.city || f.city,
          email: s.email || f.email,
        }));
      }
    } catch {
      /* ignore corrupt/unavailable storage */
    }
  }, []);

  const money = (n: number) => formatCurrency(n, currency);

  const phoneDigits = form.phone.replace(/\D/g, "");
  const phoneOk = phoneDigits.length === 11;

  // Abandoned-cart capture: once the buyer has a valid phone and items in the
  // cart (and hasn't placed the order), quietly save the cart after a short
  // pause so the seller can follow up on WhatsApp if they don't complete.
  useEffect(() => {
    if (placed || !phoneOk || items.length === 0) return;
    const t = setTimeout(() => {
      fetch("/api/abandoned-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopSlug: slug,
          customerName: form.name.trim() || null,
          customerPhone: form.phone,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            variant: i.variant,
          })),
        }),
        keepalive: true,
      }).catch(() => {});
    }, 4000);
    return () => clearTimeout(t);
  }, [placed, phoneOk, items, form.name, form.phone, slug]);

  const phoneError =
    phoneDigits.length === 0
      ? null
      : phoneDigits.length < 11
        ? tr(lang, "phoneIncomplete")
        : phoneDigits.length > 11
          ? tr(lang, "phoneTooLong")
          : null;
  const emailTrim = form.email.trim();
  const emailError =
    emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)
      ? tr(lang, "emailInvalid")
      : null;
  const update =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  function downloadSlip(o: PlacedOrder) {
    const rows = o.items
      .map(
        (i) =>
          `<tr><td>${esc(i.name)}${i.variant ? " · " + esc(i.variant) : ""} × ${i.quantity}</td><td style="text-align:right">${esc(money(i.price * i.quantity))}</td></tr>`
      )
      .join("");
    const when = new Date(o.createdAt).toLocaleString();
    const html =
      `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<title>Order #${esc(o.id)} — ${esc(shopName)}</title>` +
      `<style>body{font-family:system-ui,Arial,sans-serif;color:#232C28;max-width:440px;margin:24px auto;padding:0 16px}` +
      `h1{font-size:18px;margin:0 0 2px}.m{color:#6E7A75;font-size:13px;margin:2px 0}hr{border:0;border-top:1px solid #e6ede9;margin:12px 0}` +
      `table{width:100%;border-collapse:collapse;font-size:14px}td{padding:5px 0;border-bottom:1px solid #eef3f0}` +
      `.t{display:flex;justify-content:space-between;font-size:14px;padding:3px 0}.tot{font-weight:600;border-top:1px solid #ccc;margin-top:6px;padding-top:6px}` +
      `@media print{body{margin:0}}</style></head><body>` +
      `<h1>${esc(shopName)}</h1><p class="m">Order #${esc(o.id)} · ${esc(when)}</p><hr>` +
      `<p class="m">${esc(o.customerName)} · ${esc(o.customerPhone)}${o.customerEmail ? " · " + esc(o.customerEmail) : ""}<br>${esc(o.address)}, ${esc(o.city)}</p>` +
      `<table>${rows}</table>` +
      `<div style="margin-top:10px">` +
      `<div class="t"><span>Subtotal</span><span>${esc(money(o.subtotal))}</span></div>` +
      `<div class="t"><span>Delivery</span><span>${o.deliveryFee === 0 ? "Free" : esc(money(o.deliveryFee))}</span></div>` +
      (o.discount > 0
        ? `<div class="t"><span>Discount${o.discountCode ? " (" + esc(o.discountCode) + ")" : ""}</span><span>− ${esc(money(o.discount))}</span></div>`
        : "") +
      `<div class="t tot"><span>Total</span><span>${esc(money(o.total))}</span></div>` +
      `<div class="t"><span>Payment</span><span>${o.paymentMethod === "cod" ? "Cash on Delivery" : "Pay online"}</span></div>` +
      `</div><p class="m" style="margin-top:16px">Thank you for your order. ${esc(shopName)} will contact you to confirm.</p>` +
      `</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-${o.id}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---- Order-placed confirmation popup ----
  if (placed) {
    const waHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi ${shopName}, I just placed order #${placed.id}. Please confirm.`)}`;
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/45 p-4 sm:items-center">
        <div className="relative my-auto w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
          <button
            type="button"
            onClick={() => downloadSlip(placed)}
            className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink transition hover:border-primary"
          >
            ↓ {tr(lang, "downloadSlip")}
          </button>

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FBF1E0] text-primary">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 className="mt-3 text-center text-lg font-semibold text-ink">{tr(lang, "orderPlaced")}</h2>
          <p className="text-center text-sm text-muted">{tr(lang, "order")} #{placed.id}</p>

          <div className="mt-4 rounded-xl border border-line p-3 text-sm">
            <ul className="space-y-1">
              {placed.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span className="text-muted">
                    {i.name} x{i.quantity}
                    {i.variant ? " · " + i.variant : ""}
                  </span>
                  <span className="text-ink">{money(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 space-y-1 border-t border-line pt-2">
              <div className="flex justify-between"><span className="text-muted">{tr(lang, "subtotal")}</span><span className="text-ink">{money(placed.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted">{tr(lang, "delivery")}</span><span className="text-ink">{placed.deliveryFee === 0 ? tr(lang, "free") : money(placed.deliveryFee)}</span></div>
              {placed.discount > 0 && (
                <div className="flex justify-between"><span className="text-muted">{tr(lang, "discount")}</span><span className="text-primary">− {money(placed.discount)}</span></div>
              )}
              <div className="flex justify-between border-t border-line pt-1 font-medium text-ink"><span>{tr(lang, "total")}</span><span>{money(placed.total)}</span></div>
            </div>
          </div>

          <p className="mt-3 rounded-xl bg-[#FAEEF3] p-3 text-center text-sm text-ink">
            {shopName} {tr(lang, "sellerWillContact")}
          </p>
          <p className="mt-2 text-center text-sm text-muted">{tr(lang, "thankYou")} {shopName}!</p>

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 py-3 text-sm font-medium text-whatsapp-foreground"
          >
            {tr(lang, "messageOnWhatsapp")}
          </a>
          <div className="mt-3 flex items-center justify-center gap-5 text-sm">
            <Link href={`/${slug}/order/${placed.publicToken}`} className="font-medium text-primary hover:underline">
              {tr(lang, "viewFullOrder")}
            </Link>
            <Link href={`/${slug}`} className="text-muted hover:text-ink">
              {tr(lang, "continueShopping")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return <div className="py-16" aria-hidden />;
  }
  if (items.length === 0 && !submitting) {
    // Was a dead end: a line of grey text and no way back to the shop.
    return (
      <div className="py-16 text-center">
        <h1 className="text-lg font-semibold text-ink">{tr(lang, "checkout")}</h1>
        <p className="mt-2 text-sm text-muted">{tr(lang, "cartEmpty")}</p>
        <a
          href={`/${slug}`}
          className="mt-4 inline-flex rounded-xl border border-primary px-4 py-2.5 text-sm font-medium text-primary"
        >
          {tr(lang, "browseProducts")}
        </a>
      </div>
    );
  }

  async function applyCode() {
    const c = code.trim();
    if (!c) return;
    setApplying(true);
    setDiscountMsg(null);
    try {
      const res = await fetch(
        `/api/discount?slug=${encodeURIComponent(slug)}&code=${encodeURIComponent(c)}&subtotal=${subtotal}`
      );
      const data = await res.json();
      if (data.valid) {
        setDiscount(data.discount);
        setDiscountMsg(lang === "ur" ? `کوڈ لاگو ہو گیا — آپ ${money(data.discount)} بچاتے ہیں۔` : `Code applied — you save ${money(data.discount)}.`);
      } else {
        setDiscount(0);
        setDiscountMsg(data.message ?? (lang === "ur" ? "غلط کوڈ۔" : "Invalid code."));
      }
    } catch {
      setDiscount(0);
      setDiscountMsg(lang === "ur" ? "کوڈ چیک نہیں ہو سکا۔" : "Could not check that code.");
    } finally {
      setApplying(false);
    }
  }

  async function copyAcct() {
    if (!payOnline?.accountNumber) return;
    try {
      await navigator.clipboard.writeText(payOnline.accountNumber);
      setCopiedAcct(true);
      setTimeout(() => setCopiedAcct(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  }

  async function placeOrder() {
    setError(null);
    if (!phoneOk) {
      setError(lang === "ur" ? "براہِ کرم درست 11 ہندسوں کا فون نمبر درج کریں۔" : "Please enter a valid 11-digit phone number.");
      return;
    }
    if (emailError) {
      setError(lang === "ur" ? "درست ای میل درج کریں، یا خالی چھوڑ دیں۔" : "Please enter a valid email address, or leave it blank.");
      return;
    }
    setSubmitting(true);
    try {
      // Referral / reseller attribution captured when the buyer arrived.
      let ref: string | null = null;
      let rs: string | null = null;
      try {
        ref = localStorage.getItem(`wsb-ref-${slug}`);
        rs = localStorage.getItem(`wsb-rs-${slug}`);
      } catch {
        /* private mode etc. */
      }
      const orderBody = {
        shopSlug: slug,
        ref: ref || undefined,
        resellerCode: rs || undefined,
        customerName: form.name,
        customerPhone: form.phone,
        customerEmail: form.email.trim() || undefined,
        address: form.address,
        city: form.city,
        discountCode: code.trim() || undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, variant: i.variant ?? null })),
      };
      // Save buyer details for next time regardless of path.
      try {
        localStorage.setItem(
          SAVED_KEY,
          JSON.stringify({ name: form.name, phone: form.phone, address: form.address, city: form.city, email: form.email })
        );
      } catch {
        /* ignore storage errors */
      }

      // Card/wallet gateway: create a pending order and hand off to the gateway.
      if (payment === "gateway") {
        const res = await fetch("/api/pay/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderBody),
        });
        const data = await res.json();
        if (!res.ok || !data.redirectUrl) throw new Error(data.error ?? "Could not start payment.");
        clear();
        window.location.href = data.redirectUrl as string;
        return;
      }

      // COD or manual online transfer: place the order directly.
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...orderBody, paymentMethod: payment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not place the order.");
      clear();
      setPlaced(data.order as PlacedOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  // Delivery preview — mirrors the server's deliveryFeeFor (city zone, free-over, flat).
  const deliveryFee = (() => {
    if (delivery.freeOver !== null && subtotal >= delivery.freeOver) return 0;
    const c = form.city.trim().toLowerCase();
    const z = delivery.zones.find((x) => x.city.trim().toLowerCase() === c);
    if (z) return Math.max(0, Math.round(z.fee));
    return delivery.fee;
  })();
  const total = subtotal - discount + deliveryFee;

  const inputClass =
    "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary";

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-lg font-semibold text-ink">{tr(lang, "checkout")}</h1>

      <div className="space-y-3">
        <Field label={tr(lang, "fullName")}>
          <input className={inputClass} value={form.name} onChange={update("name")} placeholder={tr(lang, "yourName")} />
        </Field>
        <div>
          <Field label={tr(lang, "phone")}>
            <input className={inputClass} value={form.phone} onChange={update("phone")} placeholder="03xx xxxxxxx" inputMode="tel" />
          </Field>
          <p className="mt-1 text-xs text-muted">{tr(lang, "whatsappHint")}</p>
          {phoneError && <p className="mt-1 text-xs text-[#b3261e]">{phoneError}</p>}
        </div>
        <div>
          <Field label={tr(lang, "emailOptional")}>
            <input className={inputClass} value={form.email} onChange={update("email")} placeholder="you@email.com" inputMode="email" />
          </Field>
          {emailError && <p className="mt-1 text-xs text-[#b3261e]">{emailError}</p>}
        </div>
        <Field label={tr(lang, "deliveryAddress")}>
          <textarea className={inputClass} rows={2} value={form.address} onChange={update("address")} placeholder={tr(lang, "addressPlaceholder")} />
        </Field>
        <Field label={tr(lang, "city")}>
          <input className={inputClass} value={form.city} onChange={update("city")} placeholder={tr(lang, "city")} />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-xs text-muted">{tr(lang, "paymentMethod")}</p>
        <div className="space-y-2">
          <PaymentOption label={tr(lang, "cod")} hint={tr(lang, "codHint")} selected={payment === "cod"} onClick={() => setPayment("cod")} />
          {payGateway && (
            <PaymentOption
              label={payGateway.label}
              hint="Pay now by card or mobile wallet — instant confirmation"
              selected={payment === "gateway"}
              onClick={() => setPayment("gateway")}
            />
          )}
          {payOnline && (
            <PaymentOption
              label={tr(lang, "payOnline")}
              hint={`${methodLabel(payOnline.method)} — verified account`}
              selected={payment === "online"}
              onClick={() => {
                setPayment("online");
                setShowPay(true);
              }}
            />
          )}
        </div>
        {payment === "online" && payOnline && (
          <button
            type="button"
            onClick={() => setShowPay(true)}
            className="mt-2 w-full rounded-xl border border-primary bg-[#FAEEF3] px-3.5 py-2.5 text-left text-xs text-ink"
          >
            Pay to {methodLabel(payOnline.method)} · {payOnline.accountName}.{" "}
            <span className="font-medium text-primary">View payment details →</span>
          </button>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted">{tr(lang, "discountCode")}</label>
        <div className="flex gap-2">
          <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. WELCOME10" />
          <Button variant="outline" onClick={applyCode} disabled={applying || !code.trim()}>
            {applying ? "…" : tr(lang, "apply")}
          </Button>
        </div>
        {discountMsg && (
          <p className={"mt-1 text-xs " + (discount > 0 ? "text-primary" : "text-[#b3261e]")}>{discountMsg}</p>
        )}
      </div>

      <div className="border-t border-line pt-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">{tr(lang, "subtotal")}</span>
          <span className="text-ink">{money(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="mt-1 flex justify-between">
            <span className="text-muted">{tr(lang, "discount")}</span>
            <span className="text-primary">− {money(discount)}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between">
          <span className="text-muted">{tr(lang, "delivery")}</span>
          <span className="text-ink">{deliveryFee === 0 ? tr(lang, "free") : money(deliveryFee)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-line pt-2 text-base font-medium text-ink">
          <span>{tr(lang, "total")}</span>
          <span>{money(total)}</span>
        </div>
        {delivery.freeOver !== null && subtotal < delivery.freeOver && (
          <p className="mt-1.5 text-xs text-muted">{tr(lang, "freeDeliveryOverAmount")} {money(delivery.freeOver)}.</p>
        )}
        {delivery.zones.length > 0 && (
          <p className="mt-1 text-xs text-muted">{tr(lang, "deliveryByCity")}</p>
        )}
      </div>

      {error && <p className="text-sm text-[#b3261e]">{error}</p>}

      <Button className="w-full" onClick={placeOrder} disabled={submitting}>
        {submitting ? tr(lang, "placingOrder") : tr(lang, "placeOrder")}
      </Button>

      {showPay && payOnline && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setShowPay(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-base font-semibold text-ink">Pay online</p>
            <p className="mt-1 text-sm text-muted">Send your payment to this verified account:</p>
            <div className="mt-3 space-y-2 rounded-xl border border-line p-3 text-sm">
              <div className="flex items-center justify-between gap-2"><span className="text-xs text-muted">Method</span><span className="text-ink">{methodLabel(payOnline.method)}</span></div>
              <div className="flex items-center justify-between gap-2"><span className="text-xs text-muted">Account name</span><span className="text-ink">{payOnline.accountName ?? "—"}</span></div>
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-xs text-muted">Account number</p>
                  <p className="font-medium text-ink">{payOnline.accountNumber}</p>
                </div>
                <button type="button" onClick={copyAcct} className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink transition hover:border-primary">
                  {copiedAcct ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div className="mt-3 rounded-xl bg-[#FBF1DD] p-3 text-xs text-[#7a5a16]">
              After paying, send the payment screenshot to the seller on WhatsApp. Your order is only confirmed once they receive it.
            </div>
            <a href={`https://wa.me/${payOnline.whatsapp}?text=${encodeURIComponent("Hi, I placed an order and paid online. Here's my payment screenshot.")}`} target="_blank" rel="noopener noreferrer" className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-whatsapp px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
              Send screenshot on WhatsApp
            </a>
            <button type="button" onClick={() => setShowPay(false)} className="mt-2 w-full rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted">{label}</label>
      {children}
    </div>
  );
}

function PaymentOption({
  label,
  hint,
  selected,
  onClick,
}: {
  label: string;
  hint: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition " +
        (selected ? "border-primary bg-[#FAEEF3]" : "border-line bg-surface")
      }
    >
      <span className={"flex h-4 w-4 items-center justify-center rounded-full border " + (selected ? "border-primary" : "border-[#C9C3BB]")}>
        {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </button>
  );
}
