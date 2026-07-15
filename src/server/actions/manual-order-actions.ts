"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "../auth/current-seller";
import { createOrder } from "../services/order-service";

export interface ManualOrderState {
  ok?: boolean;
  orderId?: string;
  error?: string;
}

/**
 * Create an order the seller received on WhatsApp/Instagram DMs — so EVERY
 * order lives in StoreLink (analytics, profit, trust history, slips), not just
 * website ones. Uses the same createOrder path as buyers: stock is reserved,
 * sale prices apply, drops are enforced.
 */
export async function createManualOrderAction(_prev: ManualOrderState, formData: FormData): Promise<ManualOrderState> {
  const { shop } = await requireSeller();
  const name = String(formData.get("customerName") ?? "").trim();
  const phone = String(formData.get("customerPhone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  if (name.length < 2) return { error: "Enter the customer's name." };
  if (!/^\+?\d[\d\s-]{8,17}$/.test(phone)) return { error: "Enter a valid phone number." };
  if (address.length < 5) return { error: "Enter the delivery address." };

  const items: { productId: string; quantity: number; variant: string | null }[] = [];
  const raw = String(formData.get("items") ?? "[]");
  try {
    const parsed = JSON.parse(raw) as { productId: string; quantity: number; variant?: string | null }[];
    for (const it of parsed) {
      const q = Math.min(20, Math.max(1, Math.round(Number(it.quantity))));
      if (it.productId && q > 0) items.push({ productId: String(it.productId), quantity: q, variant: it.variant ?? null });
    }
  } catch {
    return { error: "Could not read the selected items — please re-select them." };
  }
  if (items.length === 0) return { error: "Pick at least one product for this order." };

  try {
    const order = await createOrder({
      shopSlug: shop.slug,
      customerName: name,
      customerPhone: phone,
      address,
      city: city || "—",
      paymentMethod: "cod",
      items,
    });
    revalidatePath("/dashboard/orders");
    return { ok: true, orderId: order.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create the order." };
  }
}
