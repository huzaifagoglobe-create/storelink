"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "../auth/current-seller";
import { createDiscount, setDiscountActive, deleteDiscount } from "../services/discount-service";
import { str, num, bool } from "../validate";
import type { DiscountType } from "../types";

export interface DiscountState {
  error?: string;
}

export async function createDiscountAction(
  _prev: DiscountState,
  formData: FormData
): Promise<DiscountState> {
  const { shop } = await requireSeller();
  const code = str(formData.get("code"), 30);
  const typeRaw = str(formData.get("type"), 10);
  const type: DiscountType = typeRaw === "fixed" ? "fixed" : "percent";
  const value = num(formData.get("value"));
  if (!code) return { error: "Enter a code." };
  if (!Number.isFinite(value) || value <= 0) return { error: "Enter an amount greater than zero." };
  if (type === "percent" && value > 100) return { error: "Percent can’t be more than 100." };
  try {
    await createDiscount(shop.id, { code, type, value });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create the code." };
  }
  revalidatePath("/dashboard/discounts");
  return {};
}

export async function toggleDiscountActiveAction(formData: FormData): Promise<void> {
  const { shop } = await requireSeller();
  const id = str(formData.get("id"), 60);
  const next = bool(formData.get("next"));
  if (id) {
    try {
      await setDiscountActive(shop.id, id, next);
    } catch (e) {
      console.error(e);
    }
  }
  revalidatePath("/dashboard/discounts");
}

export async function deleteDiscountAction(formData: FormData): Promise<void> {
  const { shop } = await requireSeller();
  const id = str(formData.get("id"), 60);
  if (id) {
    try {
      await deleteDiscount(shop.id, id);
    } catch (e) {
      console.error(e);
    }
  }
  revalidatePath("/dashboard/discounts");
}
