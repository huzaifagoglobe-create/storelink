"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "../auth/current-seller";
import { updateShop } from "../services/shop-service";

const FESTIVAL_KITS: Record<string, { heading: string; subtext: string }> = {
  eid: { heading: "Eid Collection ✨", subtext: "Celebrate in style — Cash on Delivery all over Pakistan. Order before Chand Raat!" },
  ramadan: { heading: "Ramadan Kareem 🌙", subtext: "Special Ramadan picks, delivered to your door. Cash on Delivery." },
  wedding: { heading: "Shaadi Season 💍", subtext: "Wedding-ready looks and gifts — order now, tracked delivery nationwide." },
  sale: { heading: "SALE SALE SALE 🔥", subtext: "Biggest prices drop of the season — grab yours before it's gone." },
  eleven: { heading: "11.11 Mega Deals 🛍️", subtext: "Once-a-year prices. Cash on Delivery all over Pakistan." },
};

/** Start or update the storewide flash sale (percent off until an end time). */
export async function setFlashSaleAction(formData: FormData): Promise<void> {
  const { shop } = await requireSeller();
  const percent = Math.round(Number(formData.get("percent")));
  const endsRaw = String(formData.get("endsAt") ?? "");
  const ends = endsRaw ? new Date(endsRaw) : null;
  if (
    Number.isFinite(percent) &&
    percent >= 1 &&
    percent <= 90 &&
    ends &&
    !Number.isNaN(ends.getTime()) &&
    ends.getTime() > Date.now()
  ) {
    await updateShop(shop.id, { salePercent: percent, saleEndsAt: ends.toISOString() });
  }
  revalidatePath("/dashboard/discounts");
  revalidatePath(`/${shop.slug}`);
}

/** End the sale immediately. */
export async function endFlashSaleAction(): Promise<void> {
  const { shop } = await requireSeller();
  await updateShop(shop.id, { salePercent: null, saleEndsAt: null });
  revalidatePath("/dashboard/discounts");
  revalidatePath(`/${shop.slug}`);
}

/** Turn the referral program on (Rs amount) or off (0/empty). */
export async function setReferralAction(formData: FormData): Promise<void> {
  const { shop } = await requireSeller();
  const amt = Math.round(Number(formData.get("referralAmount")));
  await updateShop(shop.id, {
    referralAmount: Number.isFinite(amt) && amt >= 10 && amt <= 5000 ? amt : null,
  });
  revalidatePath("/dashboard/discounts");
  revalidatePath(`/${shop.slug}`);
}

/** One-tap festival kit: applies a themed banner heading + subtext instantly. */
export async function applyFestivalKitAction(formData: FormData): Promise<void> {
  const { shop } = await requireSeller();
  const kit = FESTIVAL_KITS[String(formData.get("kit") ?? "")];
  if (kit) {
    await updateShop(shop.id, { bannerHeading: kit.heading, bannerSubtext: kit.subtext });
  }
  revalidatePath("/dashboard/storefront");
  revalidatePath(`/${shop.slug}`);
}
