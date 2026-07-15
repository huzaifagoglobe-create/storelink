"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "../auth/current-seller";
import { createReseller, deleteReseller } from "../services/reseller-service";

export interface ResellerState {
  ok?: boolean;
  error?: string;
}

export async function addResellerAction(_prev: ResellerState, formData: FormData): Promise<ResellerState> {
  const { shop } = await requireSeller();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const commission = Number(formData.get("commissionPercent"));
  if (name.length < 2 || name.length > 60) return { error: "Enter the reseller's name (2–60 characters)." };
  if (!/^\+?\d[\d\s-]{8,17}$/.test(phone)) return { error: "Enter a valid phone number." };
  if (!Number.isFinite(commission) || commission < 0 || commission > 50)
    return { error: "Commission must be between 0 and 50 percent." };
  try {
    await createReseller(shop.id, { name, phone, commissionPercent: commission });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not add the reseller." };
  }
  revalidatePath("/dashboard/resellers");
  return { ok: true };
}

export async function removeResellerAction(formData: FormData): Promise<void> {
  const { shop } = await requireSeller();
  const id = String(formData.get("id") ?? "");
  if (id) await deleteReseller(shop.id, id);
  revalidatePath("/dashboard/resellers");
}
