"use server";

import { redirect } from "next/navigation";
import { getCurrentSeller, requireOwner } from "../auth/current-seller";
import { clearSessionCookie } from "../auth/session";
import { deleteShop } from "../services/shop-service";
import { purgeShopStorage } from "../services/upload-service";
import { deleteUser } from "../auth/user-service";
import { str } from "../validate";

export interface DeleteState {
  error?: string;
}

// Deletes the seller's shop (and all its data via FK cascade) and their account.
export async function deleteAccountAction(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  // Owner-only: staff must never be able to delete the shop, even by POSTing
  // this action's id directly (the Danger Zone is only hidden from them in UI).
  const session = await requireOwner();
  const confirm = str(formData.get("confirm"), 120);
  if (confirm !== session.shop.slug) {
    return { error: "Type your shop link exactly to confirm." };
  }
  await purgeShopStorage(session.shop.id); // remove CNIC/selfie + product images from storage
  await deleteShop(session.shop.id); // cascades products, orders, etc.
  await deleteUser(session.user.id);
  await clearSessionCookie();
  redirect("/?deleted=1");
}
