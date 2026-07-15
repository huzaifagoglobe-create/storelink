"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "../auth/current-seller";
import { createUser, listStaffByShop, deleteStaffUser } from "../auth/user-service";

export interface TeamState {
  ok?: boolean;
  error?: string;
}

const MAX_STAFF = 5;

/** Owner adds a staff login: same shop, everything except Plan/Team/deletion. */
export async function addStaffAction(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const { shop, isOwner } = await requireSeller();
  if (!isOwner) return { error: "Only the shop owner can manage the team." };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const pin = String(formData.get("pin") ?? "").trim();
  if (fullName.length < 2 || fullName.length > 60) return { error: "Enter the person's name (2–60 characters)." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email — they'll log in with it." };
  if (!/^\d{4,8}$/.test(pin)) return { error: "PIN must be 4–8 digits — they'll log in with it." };

  const existing = await listStaffByShop(shop.id);
  if (existing.length >= MAX_STAFF) return { error: `You can have up to ${MAX_STAFF} staff logins.` };

  try {
    await createUser({ email, password: pin, fullName, shopId: shop.id, role: "staff" });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create the staff login." };
  }
  revalidatePath("/dashboard/team");
  return { ok: true };
}

export async function removeStaffAction(formData: FormData): Promise<void> {
  const { shop, isOwner } = await requireSeller();
  if (!isOwner) return;
  const id = String(formData.get("id") ?? "");
  if (id) await deleteStaffUser(shop.id, id);
  revalidatePath("/dashboard/team");
}
