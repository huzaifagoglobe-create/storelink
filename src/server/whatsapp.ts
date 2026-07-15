// Builds click-to-chat wa.me links. This is the free, v1 WhatsApp integration.
import { formatCurrency } from "@/lib/format";
import type { Order, Shop } from "./types";

/** Normalise a phone to international digits (handles common PK 03xx format). */
function toIntlDigits(raw: string): string {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "92" + digits.slice(1); // 03xx... -> 923xx...
  return digits;
}

/** Buyer's confirmation page → opens the SHOP's WhatsApp with the order. */
export function buildOrderWhatsappLink(shop: Shop, order: Order): string {
  const phone = toIntlDigits(shop.whatsapp);
  const lines = [
    `*New order — ${shop.name}*`,
    `Order #${order.id}`,
    "",
    ...order.items.map(
      (i) => `• ${i.name} x${i.quantity} — ${formatCurrency(i.price * i.quantity, shop.currency)}`
    ),
    "",
    `Subtotal: ${formatCurrency(order.subtotal, shop.currency)}`,
    `Delivery: ${formatCurrency(order.deliveryFee, shop.currency)}`,
    `Total: ${formatCurrency(order.total, shop.currency)}`,
    `Payment: ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Paid online"}`,
    "",
    `Name: ${order.customerName}`,
    `Phone: ${order.customerPhone}`,
    ...(order.customerEmail ? [`Email: ${order.customerEmail}`] : []),
    `Address: ${order.address}, ${order.city}`,
  ];
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

/** Dashboard order detail → lets the seller message the CUSTOMER. */
export function buildCustomerWhatsappLink(order: Order, shopName: string): string {
  const phone = toIntlDigits(order.customerPhone);
  const text = `Hi ${order.customerName}, this is ${shopName} regarding your order #${order.id}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
