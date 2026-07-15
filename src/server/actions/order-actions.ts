"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSeller } from "../auth/current-seller";
import { updateOrderStatus, updateOrderDetails, setOrderTracking, setCodCollected } from "../services/order-service";
import { str, optStr } from "../validate";
import type { OrderStatus } from "../types";

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  const { shop } = await requireSeller();
  const orderNumber = str(formData.get("orderNumber"), 30);
  const status = str(formData.get("status"), 20) as OrderStatus;
  if (orderNumber && status) {
    try {
      await updateOrderStatus(shop.id, orderNumber, status);
    } catch (e) {
      console.error(e);
    }
  }
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderNumber}`);
  redirect(`/dashboard/orders/${orderNumber}`);
}

export interface TrackingState { error?: string; ok?: boolean; }

export async function setOrderTrackingAction(
  _prev: TrackingState,
  formData: FormData
): Promise<TrackingState> {
  const { shop } = await requireSeller();
  const orderNumber = str(formData.get("orderNumber"), 30);
  if (!orderNumber) return { error: "Missing order." };
  const courier = optStr(formData.get("courier"), 60);
  const trackingNumber = optStr(formData.get("trackingNumber"), 80);
  try {
    const updated = await setOrderTracking(shop.id, orderNumber, courier, trackingNumber);
    if (!updated) return { error: "Order not found." };
    revalidatePath(`/dashboard/orders/${orderNumber}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save tracking." };
  }
}

export interface OrderEditState { error?: string; ok?: boolean; }

export async function updateOrderDetailsAction(
  _prev: OrderEditState,
  formData: FormData
): Promise<OrderEditState> {
  const { shop } = await requireSeller();
  const orderNumber = String(formData.get("orderNumber") ?? "");
  if (!orderNumber) return { error: "Missing order." };

  const ids = formData.getAll("itemId").map(String);
  const qtys = formData.getAll("itemQty").map((v) => Number(v));
  const items = ids.map((id, i) => ({ id, quantity: qtys[i] ?? 0 }));

  try {
    const updated = await updateOrderDetails(shop.id, orderNumber, {
      customerName: String(formData.get("customerName") ?? ""),
      customerPhone: String(formData.get("customerPhone") ?? ""),
      customerEmail: (String(formData.get("customerEmail") ?? "").trim() || null),
      address: String(formData.get("address") ?? ""),
      city: String(formData.get("city") ?? ""),
      items,
    });
    if (!updated) return { error: "Order not found." };
    revalidatePath(`/dashboard/orders/${orderNumber}`);
    revalidatePath("/dashboard/orders");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save the order." };
  }
}

export async function toggleCodCollectedAction(formData: FormData): Promise<void> {
  const { shop } = await requireSeller();
  const orderNumber = str(formData.get("orderNumber"), 30);
  const collected = String(formData.get("collected")) === "true";
  if (orderNumber) {
    try {
      await setCodCollected(shop.id, orderNumber, collected);
    } catch (e) {
      console.error(e);
    }
  }
  revalidatePath(`/dashboard/orders/${orderNumber}`);
  revalidatePath("/dashboard/orders");
}
