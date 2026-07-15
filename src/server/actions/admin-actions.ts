"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../auth/current-admin";
import { setShopPlan, setShopActive, activateSubscription, pauseSubscription } from "../services/shop-service";
import { str, bool, num } from "../validate";
import { PLAN_TIERS } from "../plans";
import type { PlanTier } from "../types";

export async function setShopPlanAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const shopId = str(formData.get("shopId"), 60);
  const plan = str(formData.get("plan"), 20) as PlanTier;
  if (shopId && PLAN_TIERS.includes(plan)) {
    try {
      await setShopPlan(shopId, plan);
    } catch (e) {
      console.error(e);
    }
  }
  revalidatePath("/admin");
  revalidatePath("/admin/shops");
  revalidatePath(`/admin/shops/${shopId}`);
  redirect(`/admin/shops/${shopId}`);
}

export async function setShopActiveAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const shopId = str(formData.get("shopId"), 60);
  const next = bool(formData.get("next"));
  if (shopId) {
    try {
      await setShopActive(shopId, next);
    } catch (e) {
      console.error(e);
    }
  }
  revalidatePath("/admin");
  revalidatePath("/admin/shops");
  revalidatePath(`/admin/shops/${shopId}`);
  redirect(`/admin/shops/${shopId}`);
}

export async function recordPaymentAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const shopId = str(formData.get("shopId"), 60);
  const plan = str(formData.get("plan"), 20) as PlanTier;
  const months = Math.max(1, Math.min(36, Math.floor(num(formData.get("months")) || 1)));
  const amount = Math.max(0, num(formData.get("amount")) || 0);
  const reference = str(formData.get("reference"), 120);
  if (shopId && PLAN_TIERS.includes(plan)) {
    try {
      await activateSubscription(shopId, { plan, months, amount, method: "manual", reference, recordedBy: "admin" });
    } catch (e) {
      console.error(e);
    }
  }
  revalidatePath("/admin");
  revalidatePath("/admin/shops");
  revalidatePath(`/admin/shops/${shopId}`);
  redirect(`/admin/shops/${shopId}`);
}

export async function pauseSubscriptionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const shopId = str(formData.get("shopId"), 60);
  if (shopId) {
    try {
      await pauseSubscription(shopId);
    } catch (e) {
      console.error(e);
    }
  }
  revalidatePath("/admin");
  revalidatePath("/admin/shops");
  revalidatePath(`/admin/shops/${shopId}`);
  redirect(`/admin/shops/${shopId}`);
}

// ---------------------------------------------------------------------------
// Back-office wave: featured shops, announcements, seller PIN reset
// ---------------------------------------------------------------------------
import { updateShop as updateShopSvc } from "../services/shop-service";
import { createAnnouncement, setAnnouncementActive } from "../services/announcement-service";
import { getOwnerByShopId, setUserPassword } from "../auth/user-service";

/** Pin/unpin a shop to the top of the Bazaar. */
export async function setFeaturedAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const shopId = str(formData.get("shopId"), 60);
  const featured = String(formData.get("featured")) === "true";
  if (shopId) await updateShopSvc(shopId, { featured });
  revalidatePath(`/admin/shops/${shopId}`);
  revalidatePath("/bazaar");
}

export async function postAnnouncementAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const message = str(formData.get("message"), 240);
  if (message.length >= 5) await createAnnouncement(message);
  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
}

export async function toggleAnnouncementAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData.get("id"), 60);
  const active = String(formData.get("active")) === "true";
  if (id) await setAnnouncementActive(id, active);
  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
}

export interface PinResetState {
  ok?: boolean;
  newPin?: string;
  error?: string;
}

/** Support tool: reset the shop OWNER's login PIN. The new PIN shows once —
 *  send it to the seller on WhatsApp. All their old sessions are logged out. */
export async function resetSellerPinAction(_prev: PinResetState, formData: FormData): Promise<PinResetState> {
  await requireAdmin();
  const shopId = str(formData.get("shopId"), 60);
  const owner = await getOwnerByShopId(shopId);
  if (!owner) return { error: "No owner account found for this shop." };
  const newPin = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  try {
    await setUserPassword(owner.id, newPin);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not reset the PIN." };
  }
  return { ok: true, newPin };
}

// ---------------------------------------------------------------------------
// Acquisition wave: leads, promos, stories, seller-referral rewards
// ---------------------------------------------------------------------------
import { setLeadStatus, createPromoCode, setPromoActive, createStory, setStoryPublished } from "../services/growth-services";
import { getShopBySlug as getShopBySlugSvc } from "../services/shop-service";
import type { SellerLeadStatus } from "../types";

export async function setLeadStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData.get("id"), 60);
  const status = str(formData.get("status"), 12) as SellerLeadStatus;
  if (id && ["new", "contacted", "won", "lost"].includes(status)) await setLeadStatus(id, status);
  revalidatePath("/admin/leads");
}

export async function createPromoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const code = str(formData.get("code"), 20).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const days = Math.min(120, Math.max(7, Math.floor(num(formData.get("trialDays")) || 30)));
  if (code.length >= 3) {
    try {
      await createPromoCode(code, days);
    } catch (e) {
      console.error(e);
    }
  }
  revalidatePath("/admin/promos");
}

export async function togglePromoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData.get("id"), 60);
  const active = String(formData.get("active")) === "true";
  if (id) await setPromoActive(id, active);
  revalidatePath("/admin/promos");
}

export async function createStoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const title = str(formData.get("title"), 90);
  const sellerName = str(formData.get("sellerName"), 60);
  const body = str(formData.get("body"), 6000);
  if (title.length >= 8 && sellerName.length >= 2 && body.length >= 50) {
    await createStory({ title, sellerName, body });
  }
  revalidatePath("/admin/stories");
  revalidatePath("/stories");
  revalidatePath("/sitemap.xml");
}

export async function toggleStoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData.get("id"), 60);
  const published = String(formData.get("published")) === "true";
  if (id) await setStoryPublished(id, published);
  revalidatePath("/admin/stories");
  revalidatePath("/stories");
  revalidatePath("/sitemap.xml");
}

/** Seller-refers-seller payoff: grant the REFERRING shop a free month once
 *  the referred shop becomes a paying customer. Human-in-the-loop by design
 *  (billing is manual), and can only fire once per referred shop. */
export async function grantReferrerRewardAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const referredShopId = str(formData.get("shopId"), 60);
  const referrerSlug = str(formData.get("referrerSlug"), 60);
  const referrer = await getShopBySlugSvc(referrerSlug);
  if (referrer && referredShopId) {
    await activateSubscription(referrer.id, {
      plan: referrer.plan === "trial" ? "basic" : referrer.plan,
      months: 1,
      amount: 0,
      method: "referral-reward",
      reference: `ref-${referredShopId}`,
    });
    await updateShopSvc(referredShopId, { referrerRewarded: true });
  }
  revalidatePath(`/admin/shops/${referredShopId}`);
  revalidatePath("/admin/revenue");
}
