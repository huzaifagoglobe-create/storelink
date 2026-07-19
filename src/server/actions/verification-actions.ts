"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "../auth/current-seller";
import { requireAdmin } from "../auth/current-admin";
import { submitVerification, reviewVerification } from "../services/verification-service";
import { str } from "../validate";
import { isOwnUploadRef } from "../services/upload-service";

export interface VerifyState {
  error?: string;
  done?: boolean;
}

export async function submitVerificationAction(
  _prev: VerifyState,
  formData: FormData
): Promise<VerifyState> {
  // Owner-only: payout account + CNIC belong to the shop owner, never staff.
  const { shop } = await requireOwner();
  const cnicDigits = str(formData.get("cnicNumber"), 20).replace(/\D/g, "");
  const payoutMethod = str(formData.get("payoutMethod"), 30);
  const payoutAccountName = str(formData.get("payoutAccountName"), 80);
  const payoutAccountNumber = str(formData.get("payoutAccountNumber"), 40);
  const cnicImageUrl = formData.getAll("cnicUrls").map(String).filter(Boolean)[0] ?? null;
  const selfieImageUrl = formData.getAll("selfieUrls").map(String).filter(Boolean)[0] ?? null;
  // Only accept references produced by our own upload endpoint.
  if (cnicImageUrl && !isOwnUploadRef(cnicImageUrl)) return { error: "Please re-upload your CNIC photo." };
  if (selfieImageUrl && !isOwnUploadRef(selfieImageUrl)) return { error: "Please re-upload your selfie." };
  const instagramUrl = str(formData.get("instagramUrl"), 200) || null;
  const tiktokUrl = str(formData.get("tiktokUrl"), 200) || null;

  if (cnicDigits.length !== 13) return { error: "Enter a valid 13-digit CNIC number." };
  if (!payoutMethod) return { error: "Choose where you want to receive payments." };
  if (!payoutAccountName) return { error: "Enter the account holder's name (as on the CNIC)." };
  if (!payoutAccountNumber) return { error: "Enter your account or mobile number." };
  if (!cnicImageUrl) return { error: "Please upload a clear photo of your CNIC." };
  if (!selfieImageUrl) return { error: "Please upload a selfie of your face for matching." };
  if (!instagramUrl && !tiktokUrl) {
    return { error: "Add at least one social link (Instagram or TikTok) — it proves your shop is real." };
  }

  await submitVerification(shop.id, {
    cnicNumber: cnicDigits,
    cnicImageUrl,
    selfieImageUrl,
    payoutMethod,
    payoutAccountName,
    payoutAccountNumber,
    instagramUrl,
    tiktokUrl,
  });
  revalidatePath("/dashboard/verification");
  return { done: true };
}

export async function approveVerificationAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const shopId = str(formData.get("shopId"), 60);
  if (shopId) await reviewVerification(shopId, true);
  revalidatePath("/admin/verifications");
}

export async function rejectVerificationAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const shopId = str(formData.get("shopId"), 60);
  const note = str(formData.get("note"), 300);
  if (shopId) await reviewVerification(shopId, false, note || "Details could not be verified.");
  revalidatePath("/admin/verifications");
}
