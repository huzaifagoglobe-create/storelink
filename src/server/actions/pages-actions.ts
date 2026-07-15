"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "../auth/current-seller";
import { updateShop } from "../services/shop-service";
import { RETURN_POLICIES } from "@/lib/shop-pages";

export interface PagesState {
  ok?: boolean;
  error?: string;
}

/** Save the seller "Pages": about text + return-policy choice. */
export async function updatePagesAction(_prev: PagesState, formData: FormData): Promise<PagesState> {
  const { shop } = await requireSeller();

  const aboutRaw = String(formData.get("aboutText") ?? "").trim();
  if (aboutRaw.length > 2000) return { error: "About text is too long (max 2000 characters)." };

  const policyRaw = String(formData.get("returnPolicy") ?? "");
  const returnPolicy = policyRaw && policyRaw in RETURN_POLICIES ? policyRaw : null;

  const noteRaw = String(formData.get("returnPolicyNote") ?? "").trim();
  if (noteRaw.length > 600) return { error: "Return-policy note is too long (max 600 characters)." };

  try {
    await updateShop(shop.id, {
      aboutText: aboutRaw || null,
      returnPolicy,
      returnPolicyNote: returnPolicy ? noteRaw || null : null,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save your pages." };
  }
  revalidatePath("/dashboard/pages");
  for (const pg of ["", "/about", "/returns", "/terms", "/privacy", "/contact"]) revalidatePath(`/${shop.slug}${pg}`);
  return { ok: true };
}
