import { randomUUID } from "crypto";
import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";
import { getShopBySlug } from "./shop-service";
import { shopHasAccess } from "../billing";
import { getProductById, decrementStock, restoreStock } from "./product-service";
import { getOwnerEmailByShopId } from "../auth/user-service";
import { sendEmail } from "../email";
import { SITE_URL } from "@/lib/site";
import { getActiveDiscountByCode, discountAmount } from "./discount-service";
import { clearAbandonedCart } from "./abandoned-cart-service";
import { salePrice } from "@/lib/sale";
import { getResellerByCode } from "./reseller-service";
import { mockOrders as seedOrders } from "../mock-data";
import type { CreateOrderInput, Order, OrderStatus, Shop } from "../types";

// Guards for the public (anonymous) order endpoint — basic anti-abuse.
const MAX_ITEMS = 50;
const MAX_QTY_PER_ITEM = 100;
const LIMITS = { name: 120, phone: 30, address: 300, city: 80, email: 120 };

// Demo-mode store (in memory), seeded from mock-data, keyed by public token.
// Stored on globalThis so every route bundle shares ONE instance in a
// production build — otherwise a write in one route (e.g. saving tracking in a
// server action) wouldn't be visible when another route (the order page) reads
// it. In real mode this store is unused; Postgres is the shared source of truth.
const g = globalThis as unknown as {
  __wsbOrderStore?: Map<string, Order>;
  __wsbOrderCounter?: number;
};
if (!g.__wsbOrderStore) {
  g.__wsbOrderStore = new Map<string, Order>();
  seedOrders.forEach((o) => g.__wsbOrderStore!.set(o.publicToken, o));
}
const orderStore = g.__wsbOrderStore;
if (g.__wsbOrderCounter === undefined) g.__wsbOrderCounter = 1045;

function nextOrderNumber(): number {
  g.__wsbOrderCounter = (g.__wsbOrderCounter ?? 1045) + 1;
  return g.__wsbOrderCounter;
}

function clampText(value: string, max: number): string {
  return (value ?? "").trim().slice(0, max);
}

function deliveryFeeFor(subtotal: number, shop: Shop, city: string): number {
  if (shop.freeDeliveryOver !== null && subtotal >= shop.freeDeliveryOver) return 0;
  const c = (city ?? "").trim().toLowerCase();
  const zone = shop.deliveryZones?.find((z) => z.city.trim().toLowerCase() === c);
  if (zone) return Math.max(0, Math.round(zone.fee));
  return shop.deliveryFee;
}

function rowToOrder(o: any, itemRows: any[]): Order {
  const id = String(o.order_number);
  return {
    id,
    publicToken: o.public_token,
    shopId: o.shop_id,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    customerEmail: o.customer_email ?? null,
    address: o.address,
    city: o.city,
    paymentMethod: o.payment_method,
    subtotal: Number(o.subtotal),
    deliveryFee: Number(o.delivery_fee),
    total: Number(o.total),
    discount: Number(o.discount ?? 0),
    discountCode: o.discount_code ?? null,
    courier: o.courier ?? null,
    trackingNumber: o.tracking_number ?? null,
    paymentState: o.payment_state ?? "none",
    gateway: o.gateway ?? null,
    gatewayRef: o.gateway_ref ?? null,
    codCollected: o.cod_collected ?? false,
    referredBy: o.referred_by ?? null,
    referralRewarded: o.referral_rewarded ?? false,
    resellerCode: o.reseller_code ?? null,
    status: o.status,
    createdAt: o.created_at,
    items: (itemRows ?? []).map((it) => ({
      cost: it.cost === null || it.cost === undefined ? null : Number(it.cost),
      id: it.id,
      orderId: id,
      productId: it.product_id,
      name: it.name,
      price: Number(it.price),
      quantity: it.quantity,
      variant: it.variant ?? null,
    })),
  };
}

async function notifyBuyerOfOrder(shop: Shop, order: Order): Promise<void> {
  try {
    if (!order.customerEmail) return;
    const items = order.items
      .map((i) => `- ${i.quantity} x ${i.name}${i.variant ? ` (${i.variant})` : ""}`)
      .join("\n");
    const track = `${SITE_URL}/${shop.slug}/order/${order.publicToken}`;
    await sendEmail({
      to: order.customerEmail,
      subject: `Your ${shop.name} order #${order.id} is confirmed`,
      text:
        `Thanks for your order from ${shop.name}!\n\n` +
        `Order #${order.id}\n` +
        `Total: Rs ${order.total} (${order.paymentMethod === "cod" ? "Cash on Delivery" : "Pay online"})\n\n` +
        `Items:\n${items}\n\n` +
        `Track your order: ${track}`,
    });
  } catch (e) {
    console.error("notifyBuyerOfOrder:", e);
  }
}

async function notifySellerOfOrder(shop: Shop, order: Order): Promise<void> {
  try {
    const to = await getOwnerEmailByShopId(shop.id);
    if (!to) return;
    const items = order.items
      .map((i) => `- ${i.quantity} x ${i.name}${i.variant ? ` (${i.variant})` : ""}`)
      .join("\n");
    const pay = order.paymentMethod === "cod" ? "Cash on Delivery" : "Pay online";
    await sendEmail({
      to,
      subject: `New order #${order.id} - ${shop.name}`,
      text:
        `You have a new order on ${shop.name}.\n\n` +
        `Order #${order.id}\n` +
        `Customer: ${order.customerName} (${order.customerPhone})\n` +
        `Deliver to: ${order.address}, ${order.city}\n` +
        `Payment: ${pay}\n` +
        `Total: Rs ${order.total}\n\n` +
        `Items:\n${items}\n\n` +
        `Manage this order: ${SITE_URL}/dashboard/orders/${order.id}`,
    });
  } catch (e) {
    console.error("notifySellerOfOrder:", e);
  }
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const name = clampText(input.customerName, LIMITS.name);
  const phone = clampText(input.customerPhone, LIMITS.phone);
  const address = clampText(input.address, LIMITS.address);
  const city = clampText(input.city, LIMITS.city);
  const email = clampText(input.customerEmail ?? "", LIMITS.email) || null;

  if (!name || !phone || !address || !city) {
    throw new Error("Please fill in your name, phone, address and city.");
  }
  if (phone.replace(/\D/g, "").length !== 11) {
    throw new Error("Please enter a valid 11-digit phone number.");
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("Your cart is empty.");
  }
  if (input.items.length > MAX_ITEMS) {
    throw new Error("Too many items in one order.");
  }
  const paymentMethod = input.paymentMethod === "online" ? "online" : "cod";

  const shop = await getShopBySlug(input.shopSlug);
  if (!shop) throw new Error("Shop not found.");
  if (!shop.isActive || !shopHasAccess(shop)) {
    throw new Error("This shop is not accepting orders right now.");
  }

  // Re-price and validate every line on the SERVER. Never trust the browser.
  const items: { productId: string; name: string; price: number; cost: number | null; quantity: number; variant: string | null }[] = [];
  for (const line of input.items) {
    const requested = Math.floor(Number(line?.quantity) || 0);
    if (requested <= 0) continue;
    const product = await getProductById(shop.id, line.productId);
    if (!product || !product.isActive) continue;
    const variant = typeof line.variant === "string" ? line.variant.slice(0, 120) : null;
    const variantAvail =
      variant && product.variantStock && variant in product.variantStock
        ? product.variantStock[variant]
        : null;
    const available = variantAvail !== null ? variantAvail : product.stock;
    if (available <= 0) continue;
    // Live Drops: a product scheduled for the future is not purchasable —
    // enforced HERE on the server so nobody can order early via the API.
    if (product.dropAt && new Date(product.dropAt).getTime() > Date.now()) {
      throw new Error(`"${product.name}" has not dropped yet — check back at drop time!`);
    }
    const quantity = Math.min(requested, available, MAX_QTY_PER_ITEM);
    // Flash sale applies server-side so the charged price always matches the
    // storefront; the seller's cost is snapshotted for profit tracking.
    items.push({
      productId: product.id,
      name: product.name,
      price: salePrice(product.price, shop),
      cost: product.costPrice ?? null,
      quantity,
      variant,
    });
  }
  if (items.length === 0) {
    throw new Error("None of the items in your cart are available right now.");
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = deliveryFeeFor(subtotal, shop, city);

  let discount = 0;
  let discountCode: string | null = null;
  const enteredCode = (input.discountCode ?? "").trim();
  if (enteredCode) {
    const d = await getActiveDiscountByCode(shop.id, enteredCode);
    if (d) {
      const amt = discountAmount(subtotal, d);
      if (amt > 0) {
        discount = amt;
        discountCode = d.code;
      }
    }
  }
  // ---- Referral loop (?ref=): friend of a delivered buyer gets Rs off. The
  // ---- referrer earns their own Rs off, applied automatically on their next
  // ---- order (see referralCredit below). All validated server-side.
  let referredBy: string | null = null;
  let referralDiscount = 0;
  const refToken = (input.ref ?? "").trim();
  if (refToken && shop.referralAmount && shop.referralAmount > 0) {
    const refOrder = await getOrderByToken(refToken);
    if (
      refOrder &&
      refOrder.shopId === shop.id &&
      refOrder.status === "delivered" &&
      refOrder.customerPhone.replace(/\D/g, "") !== phone.replace(/\D/g, "")
    ) {
      referredBy = refToken;
      referralDiscount = Math.min(shop.referralAmount, Math.max(0, subtotal - 1));
    }
  }
  // Referrer reward: if THIS buyer previously referred friends whose orders got
  // delivered (and that referral hasn't been rewarded yet), apply their Rs off
  // now and mark one referral as rewarded.
  let referralCredit = 0;
  let rewardedOrderToken: string | null = null;
  if (shop.referralAmount && shop.referralAmount > 0) {
    const credit = await findUnrewardedReferral(shop.id, phone);
    if (credit) {
      referralCredit = Math.min(shop.referralAmount, Math.max(0, subtotal - 1 - referralDiscount));
      rewardedOrderToken = credit;
    }
  }

  // ---- Reseller attribution (?rs=): tag the order for commission tracking.
  let resellerCode: string | null = null;
  const rsRaw = (input.resellerCode ?? "").trim().toUpperCase();
  if (rsRaw) {
    const rs = await getResellerByCode(shop.id, rsRaw);
    if (rs) resellerCode = rs.code;
  }

  const total = subtotal + deliveryFee - discount;

  // Atomically reserve stock NOW (before finalizing the order). Each decrement
  // only succeeds if enough stock is still available, so two buyers racing for
  // the last item can't both succeed. Any line that loses the race is dropped;
  // if that empties the cart, we roll back what we took and reject the order.
  const reserved: typeof items = [];
  for (const i of items) {
    const okDec = await decrementStock(shop.id, i.productId, i.quantity, i.variant);
    if (okDec) reserved.push(i);
  }
  if (reserved.length === 0) {
    // Nothing could be reserved — put back anything (none succeeded) and stop.
    throw new Error("Sorry, those items just went out of stock. Please refresh and try again.");
  }
  // Continue with only the lines we actually secured.
  items.length = 0;
  items.push(...reserved);
  const finalSubtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const finalDelivery = deliveryFeeFor(finalSubtotal, shop, city);
  let finalDiscount = discount;
  if (discount > 0 && discountCode) {
    // Re-apply the discount to the possibly-reduced subtotal.
    const d2 = await getActiveDiscountByCode(shop.id, discountCode);
    finalDiscount = d2 ? discountAmount(finalSubtotal, d2) : 0;
  }
  // Referral amounts re-capped against the (possibly reduced) subtotal.
  const finalReferral = Math.min(referralDiscount + referralCredit, Math.max(0, finalSubtotal - 1));
  const finalTotal = finalSubtotal + finalDelivery - finalDiscount - finalReferral;

  // Demo mode
  if (!isSupabaseConfigured()) {
    const orderNumber = nextOrderNumber();
    const id = String(orderNumber);
    const publicToken = randomUUID();
    const order: Order = {
      id,
      publicToken,
      shopId: shop.id,
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      address,
      city,
      paymentMethod,
      subtotal: finalSubtotal,
      deliveryFee: finalDelivery,
      total: finalTotal,
      discount: finalDiscount + finalReferral,
      discountCode: discountCode ?? (finalReferral > 0 ? "REFERRAL" : null),
      referredBy,
      referralRewarded: false,
      resellerCode,
      courier: null,
      trackingNumber: null,
      paymentState: paymentMethod === "online" ? "pending" : "none",
      gateway: null,
      gatewayRef: null,
      codCollected: false,
      status: "new",
      createdAt: new Date().toISOString(),
      items: items.map((i, idx) => ({ id: `${id}-${idx}`, orderId: id, ...i })),
    };
    orderStore.set(publicToken, order);
    if (rewardedOrderToken && finalReferral > referralDiscount) await markReferralRewarded(rewardedOrderToken);
    await clearAbandonedCart(shop.id, phone);
    await notifySellerOfOrder(shop, order);
    await notifyBuyerOfOrder(shop, order);
    return order;
  }

  // Real mode (Supabase)
  const supabase = getServerSupabase();
  const { data: orderRow, error: orderErr } = await supabase
    .from("orders")
    .insert({
      shop_id: shop.id,
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      address,
      city,
      payment_method: paymentMethod,
      subtotal: finalSubtotal,
      delivery_fee: finalDelivery,
      total: finalTotal,
      discount: finalDiscount + finalReferral,
      referred_by: referredBy,
      referral_rewarded: false,
      reseller_code: resellerCode,
      discount_code: discountCode ?? (finalReferral > 0 ? "REFERRAL" : null),
      payment_state: paymentMethod === "online" ? "pending" : "none",
      status: "new",
    })
    .select("*")
    .single();
  if (orderErr || !orderRow) {
    console.error("createOrder: failed to insert order", orderErr);
    for (const i of items) await restoreStock(shop.id, i.productId, i.quantity, i.variant);
    throw new Error("Could not save the order. Please try again.");
  }

  const { error: itemsErr } = await supabase.from("order_items").insert(
    items.map((i) => ({
      order_id: orderRow.id,
      product_id: i.productId,
      name: i.name,
      price: i.price,
      cost: i.cost ?? null,
      quantity: i.quantity,
      variant: i.variant,
    }))
  );
  if (itemsErr) {
    await supabase.from("orders").delete().eq("id", orderRow.id);
    for (const i of items) await restoreStock(shop.id, i.productId, i.quantity, i.variant);
    console.error("createOrder: items insert failed, rolled back order", itemsErr);
    throw new Error("Could not save the order items. Please try again.");
  }

  // Stock was already atomically reserved above — no second decrement here.

  const saved = await getOrderByToken(orderRow.public_token);
  if (!saved) throw new Error("Order saved but could not be loaded.");
  if (rewardedOrderToken && finalReferral > referralDiscount) await markReferralRewarded(rewardedOrderToken);
  await clearAbandonedCart(shop.id, phone);
  await notifySellerOfOrder(shop, saved);
  await notifyBuyerOfOrder(shop, saved);
  return saved;
}

/** Buyer's confirmation page — lookup by unguessable token. */
export async function getOrderByToken(token: string): Promise<Order | null> {
  if (!token || token.length < 8) return null;
  if (!isSupabaseConfigured()) {
    return orderStore.get(token) ?? null;
  }
  const supabase = getServerSupabase();
  const { data: o, error } = await supabase
    .from("orders")
    .select("*")
    .eq("public_token", token)
    .maybeSingle();
  if (error) {
    console.error("getOrderByToken:", error);
    return null;
  }
  if (!o) return null;
  const { data: itemRows } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", o.id);
  return rowToOrder(o, itemRows ?? []);
}

// --------------------------- Dashboard (owner) -----------------------------

/** All orders for the owner's shop, newest first. */
export async function listShopOrders(shopId: string): Promise<Order[]> {
  if (!isSupabaseConfigured()) {
    return [...orderStore.values()]
      .filter((o) => o.shopId === shopId)
      .sort((a, b) => Number(b.id) - Number(a.id));
  }
  const supabase = getServerSupabase();
  const { data: orderRows, error } = await supabase
    .from("orders")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  if (error || !orderRows || orderRows.length === 0) return [];

  // One query for all items (avoids N+1), then group by order.
  const ids = orderRows.map((o) => o.id);
  const { data: itemRows } = await supabase
    .from("order_items")
    .select("*")
    .in("order_id", ids);
  const byOrder = new Map<string, any[]>();
  (itemRows ?? []).forEach((it) => {
    const arr = byOrder.get(it.order_id) ?? [];
    arr.push(it);
    byOrder.set(it.order_id, arr);
  });
  return orderRows.map((o) => rowToOrder(o, byOrder.get(o.id) ?? []));
}

/** Owner order detail — looked up by the human order number, scoped to the shop. */
export async function getShopOrderByNumber(
  shopId: string,
  orderNumber: string
): Promise<Order | null> {
  if (!isSupabaseConfigured()) {
    return (
      [...orderStore.values()].find((o) => o.id === orderNumber && o.shopId === shopId) ?? null
    );
  }
  const supabase = getServerSupabase();
  const { data: o, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .eq("shop_id", shopId)
    .maybeSingle();
  if (error || !o) return null;
  const { data: itemRows } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", o.id);
  return rowToOrder(o, itemRows ?? []);
}

export interface OrderEditPatch {
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string;
  city: string;
  items: { id: string; quantity: number }[]; // quantity 0 = remove
}

/** Seller edits an order: customer details + item quantities. Totals are
 *  recomputed on the server (original line prices are kept). */
export async function updateOrderDetails(
  shopId: string,
  orderNumber: string,
  patch: OrderEditPatch
): Promise<Order | null> {
  const order = await getShopOrderByNumber(shopId, orderNumber);
  if (!order) return null;

  const qtyOf = (id: string) => {
    const m = patch.items.find((x) => x.id === id);
    const q = m ? Math.floor(m.quantity) : NaN;
    return Number.isFinite(q) ? Math.max(0, Math.min(100, q)) : NaN;
  };
  const keep = order.items
    .map((it) => ({ ...it, quantity: Number.isNaN(qtyOf(it.id)) ? it.quantity : qtyOf(it.id) }))
    .filter((it) => it.quantity > 0);
  if (keep.length === 0) throw new Error("An order must have at least one item.");

  const subtotal = keep.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const discount = Math.max(0, Math.min(order.discount, subtotal));
  const total = subtotal + order.deliveryFee - discount;

  const name = patch.customerName.trim().slice(0, 80) || order.customerName;
  const phone = patch.customerPhone.replace(/\D/g, "").slice(0, 15) || order.customerPhone;
  const email = patch.customerEmail ? patch.customerEmail.trim().slice(0, 120) : null;
  const address = patch.address.trim().slice(0, 240) || order.address;
  const city = patch.city.trim().slice(0, 80) || order.city;

  if (!isSupabaseConfigured()) {
    const o = [...orderStore.values()].find((x) => x.id === orderNumber && x.shopId === shopId);
    if (!o) return null;
    o.customerName = name; o.customerPhone = phone; o.customerEmail = email;
    o.address = address; o.city = city;
    o.items = keep; o.subtotal = subtotal; o.discount = discount; o.total = total;
    return o;
  }

  const supabase = getServerSupabase();
  const { data: row } = await supabase
    .from("orders").select("id").eq("order_number", orderNumber).eq("shop_id", shopId).maybeSingle();
  if (!row) return null;
  const orderId = row.id;

  const { error: oErr } = await supabase.from("orders").update({
    customer_name: name, customer_phone: phone, customer_email: email,
    address, city, subtotal, discount, total,
  }).eq("id", orderId).eq("shop_id", shopId);
  if (oErr) { console.error("updateOrderDetails order:", oErr); throw new Error("Could not save the order."); }

  // Apply item changes (update kept quantities, delete removed ones).
  const keepIds = new Set(keep.map((k) => k.id));
  for (const it of order.items) {
    if (!keepIds.has(it.id)) {
      await supabase.from("order_items").delete().eq("id", it.id).eq("order_id", orderId);
    } else {
      const q = keep.find((k) => k.id === it.id)!.quantity;
      if (q !== it.quantity) {
        await supabase.from("order_items").update({ quantity: q }).eq("id", it.id).eq("order_id", orderId);
      }
    }
  }
  return getShopOrderByNumber(shopId, orderNumber);
}

const VALID_STATUS: OrderStatus[] = ["new", "confirmed", "delivered", "cancelled"];

export async function updateOrderStatus(
  shopId: string,
  orderNumber: string,
  status: OrderStatus
): Promise<Order | null> {
  if (!VALID_STATUS.includes(status)) throw new Error("Invalid status.");

  if (!isSupabaseConfigured()) {
    const o = [...orderStore.values()].find((x) => x.id === orderNumber && x.shopId === shopId);
    if (!o) return null;
    o.status = status;
    return o;
  }
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("order_number", orderNumber)
    .eq("shop_id", shopId);
  if (error) {
    console.error("updateOrderStatus:", error);
    throw new Error("Could not update the order. Please try again.");
  }
  return getShopOrderByNumber(shopId, orderNumber);
}

/** Seller sets/updates the courier + tracking number for an order. */
export async function setOrderTracking(
  shopId: string,
  orderNumber: string,
  courier: string | null,
  trackingNumber: string | null
): Promise<Order | null> {
  const c = courier?.trim() || null;
  const t = trackingNumber?.trim() || null;

  if (!isSupabaseConfigured()) {
    const o = [...orderStore.values()].find((x) => x.id === orderNumber && x.shopId === shopId);
    if (!o) return null;
    o.courier = c;
    o.trackingNumber = t;
    return o;
  }
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("orders")
    .update({ courier: c, tracking_number: t })
    .eq("order_number", orderNumber)
    .eq("shop_id", shopId);
  if (error) {
    console.error("setOrderTracking:", error);
    throw new Error("Could not save tracking. Please try again.");
  }
  return getShopOrderByNumber(shopId, orderNumber);
}

/** Seller marks whether the COD cash for a delivered order has been collected. */
export async function setCodCollected(
  shopId: string,
  orderNumber: string,
  collected: boolean
): Promise<Order | null> {
  if (!isSupabaseConfigured()) {
    const o = [...orderStore.values()].find((x) => x.id === orderNumber && x.shopId === shopId);
    if (!o) return null;
    o.codCollected = collected;
    return o;
  }
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("orders")
    .update({ cod_collected: collected })
    .eq("order_number", orderNumber)
    .eq("shop_id", shopId);
  if (error) {
    console.error("setCodCollected:", error.message);
    throw new Error("Could not update payment status.");
  }
  return getShopOrderByNumber(shopId, orderNumber);
}

/** Look up an order by its internal id (used by the payment flow). */
export async function getOrderById(id: string): Promise<Order | null> {
  if (!isSupabaseConfigured()) {
    return [...orderStore.values()].find((o) => o.id === id) ?? null;
  }
  const supabase = getServerSupabase();
  const { data } = await supabase.from("orders").select("public_token").eq("id", id).maybeSingle();
  if (!data) return null;
  return getOrderByToken(data.public_token);
}

/**
 * Mark an order's payment as paid/failed after the gateway confirms it. Records
 * which gateway + reference processed it. Idempotent: re-confirming a paid order
 * is a no-op.
 */
export async function markOrderPayment(
  orderId: string,
  state: "paid" | "failed",
  gateway: string,
  gatewayRef: string
): Promise<Order | null> {
  if (!isSupabaseConfigured()) {
    const o = [...orderStore.values()].find((x) => x.id === orderId);
    if (!o) return null;
    if (o.paymentState === "paid") return o; // idempotent
    o.paymentState = state;
    o.gateway = gateway;
    o.gatewayRef = gatewayRef;
    return o;
  }
  const supabase = getServerSupabase();
  const { data: existing } = await supabase
    .from("orders")
    .select("public_token, payment_state")
    .eq("id", orderId)
    .maybeSingle();
  if (!existing) return null;
  if (existing.payment_state !== "paid") {
    await supabase
      .from("orders")
      .update({ payment_state: state, gateway, gateway_ref: gatewayRef })
      .eq("id", orderId);
  }
  return getOrderByToken(existing.public_token);
}

/** Admin-only: every order across all shops (newest first). */
export async function listAllOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured()) {
    return [...orderStore.values()].sort((a, b) => Number(b.id) - Number(a.id));
  }
  const supabase = getServerSupabase();
  const { data: orderRows, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !orderRows || orderRows.length === 0) return [];
  const ids = orderRows.map((o) => o.id);
  const { data: itemRows } = await supabase
    .from("order_items")
    .select("*")
    .in("order_id", ids);
  const byOrder = new Map<string, any[]>();
  (itemRows ?? []).forEach((it) => {
    const arr = byOrder.get(it.order_id) ?? [];
    arr.push(it);
    byOrder.set(it.order_id, arr);
  });
  return orderRows.map((o) => rowToOrder(o, byOrder.get(o.id) ?? []));
}

/** How many units of a product have been DELIVERED (honest social proof). */
export async function productSoldCount(shopId: string, productId: string): Promise<number> {
  const orders = await listShopOrders(shopId);
  let n = 0;
  for (const o of orders) {
    if (o.status !== "delivered") continue;
    for (const it of o.items) if (it.productId === productId) n += it.quantity;
  }
  return n;
}

/** Buyer "My Orders" lookup: all their recent orders across EVERY StoreLink
 *  shop. Requires the phone AND one of their order numbers (so a phone number
 *  alone can't unlock someone else's order history). */
export async function listOrdersByPhone(
  phone: string,
  proofOrderNumber: string
): Promise<Order[] | null> {
  const p = (phone || "").replace(/\D/g, "");
  if (p.length < 10 || !proofOrderNumber) return null;
  const since = Date.now() - 90 * 86400000;

  let mine: Order[] = [];
  if (!isSupabaseConfigured()) {
    mine = [...orderStore.values()].filter(
      (o) => o.customerPhone.replace(/\D/g, "") === p && new Date(o.createdAt).getTime() >= since
    );
  } else {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("customer_phone", phone)
      .gte("created_at", new Date(since).toISOString())
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.error("listOrdersByPhone:", error.message);
      return null;
    }
    mine = (data ?? []).map((r) => rowToOrder(r, r.order_items ?? []));
  }
  // Proof check: the given order number must belong to this phone.
  if (!mine.some((o) => o.id === proofOrderNumber.trim())) return null;
  return mine.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Find one delivered order that THIS phone referred and hasn't been rewarded
 *  for yet. Returns that order's publicToken (to mark rewarded) or null. */
async function findUnrewardedReferral(shopId: string, phone: string): Promise<string | null> {
  const p = phone.replace(/\D/g, "");
  if (!isSupabaseConfigured()) {
    const all = [...orderStore.values()].filter((o) => o.shopId === shopId);
    const myTokens = new Set(all.filter((o) => o.customerPhone.replace(/\D/g, "") === p).map((o) => o.publicToken));
    const hit = all.find(
      (o) => o.referredBy && myTokens.has(o.referredBy) && o.status === "delivered" && !o.referralRewarded
    );
    return hit ? hit.publicToken : null;
  }
  const supabase = getServerSupabase();
  const { data: mine } = await supabase
    .from("orders")
    .select("public_token")
    .eq("shop_id", shopId)
    .eq("customer_phone", phone)
    .limit(200);
  const tokens = (mine ?? []).map((r) => r.public_token);
  if (tokens.length === 0) return null;
  const { data: hit } = await supabase
    .from("orders")
    .select("public_token")
    .eq("shop_id", shopId)
    .eq("status", "delivered")
    .eq("referral_rewarded", false)
    .in("referred_by", tokens)
    .limit(1)
    .maybeSingle();
  return hit ? hit.public_token : null;
}

/** Mark a referred order as rewarded (its referrer just used their credit). */
async function markReferralRewarded(token: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const o = orderStore.get(token);
    if (o) o.referralRewarded = true;
    return;
  }
  const supabase = getServerSupabase();
  await supabase.from("orders").update({ referral_rewarded: true }).eq("public_token", token);
}
