import "server-only";
import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";
import { mockShops } from "../mock-data";
import { listAllShops } from "./shop-service";
import { encryptField } from "../crypto";
import type { Shop } from "../types";

export interface VerificationSubmission {
  cnicNumber: string;
  cnicImageUrl: string | null;
  selfieImageUrl: string | null;
  payoutMethod: string;
  payoutAccountName: string;
  payoutAccountNumber: string;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
}

export async function submitVerification(
  shopId: string,
  data: VerificationSubmission
): Promise<void> {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured()) {
    const s = mockShops.find((x) => x.id === shopId);
    if (!s) throw new Error("Shop not found.");
    s.verificationStatus = "pending";
    s.cnicNumber = data.cnicNumber;
    s.cnicImageUrl = data.cnicImageUrl;
    s.selfieImageUrl = data.selfieImageUrl;
    s.payoutMethod = data.payoutMethod;
    s.payoutAccountName = data.payoutAccountName;
    s.payoutAccountNumber = data.payoutAccountNumber;
    if (data.instagramUrl !== undefined) s.instagramUrl = data.instagramUrl;
    if (data.tiktokUrl !== undefined) s.tiktokUrl = data.tiktokUrl;
    s.verificationSubmittedAt = now;
    s.verificationReviewedAt = null;
    s.verificationNote = null;
    return;
  }
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("shops")
    .update({
      verification_status: "pending",
      cnic_number: encryptField(data.cnicNumber),
      cnic_image_url: data.cnicImageUrl,
      selfie_image_url: data.selfieImageUrl,
      payout_method: data.payoutMethod,
      payout_account_name: data.payoutAccountName,
      payout_account_number: encryptField(data.payoutAccountNumber),
      instagram_url: data.instagramUrl ?? null,
      tiktok_url: data.tiktokUrl ?? null,
      verification_submitted_at: now,
      verification_reviewed_at: null,
      verification_note: null,
    })
    .eq("id", shopId);
  if (error) {
    console.error("submitVerification:", error);
    throw new Error("Could not submit your verification. Please try again.");
  }
}

export async function reviewVerification(
  shopId: string,
  approve: boolean,
  note?: string
): Promise<void> {
  const now = new Date().toISOString();
  const status = approve ? "verified" : "rejected";
  if (!isSupabaseConfigured()) {
    const s = mockShops.find((x) => x.id === shopId);
    if (!s) throw new Error("Shop not found.");
    s.verificationStatus = status;
    s.verificationReviewedAt = now;
    s.verificationNote = note ?? null;
    return;
  }
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("shops")
    .update({ verification_status: status, verification_reviewed_at: now, verification_note: note ?? null })
    .eq("id", shopId);
  if (error) {
    console.error("reviewVerification:", error);
    throw new Error("Could not update verification.");
  }
}

/** Shops awaiting admin review (works in demo + Supabase via listAllShops). */
export async function listPendingVerifications(): Promise<Shop[]> {
  const all = await listAllShops();
  return all.filter((s) => s.verificationStatus === "pending");
}
