"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "../auth/current-seller";
import { updateShop } from "../services/shop-service";
import { str, optStr } from "../validate";
import { TEMPLATE_IDS } from "../storefront-templates";
import { isAllowedProductImageUrl } from "../services/upload-service";
import { pingIndexNow } from "../indexnow";
import { SITE_URL } from "@/lib/site";

export interface StorefrontState {
  error?: string;
  ok?: boolean;
}

export async function updateStorefrontAction(
  _prev: StorefrontState,
  formData: FormData
): Promise<StorefrontState> {
  const { shop } = await requireSeller();
  const themeColorRaw = optStr(formData.get("themeColor"), 9);
  const themeColor = themeColorRaw && /^#[0-9a-fA-F]{6}$/.test(themeColorRaw) ? themeColorRaw : null;
  const bannerStyleRaw = str(formData.get("bannerStyle"), 10);
  const bannerStyle = bannerStyleRaw === "color" || bannerStyleRaw === "image" ? bannerStyleRaw : "none";
  const templateRaw = str(formData.get("template"), 20);
  const template = (TEMPLATE_IDS as string[]).includes(templateRaw) ? templateRaw : "classic";
  // Only accept a banner image that is one of OUR uploads (same-origin or
  // Supabase), never an arbitrary external URL.
  const bannerRaw = optStr(formData.get("bannerImage"), 400);
  const bannerImage = bannerRaw && isAllowedProductImageUrl(bannerRaw) ? bannerRaw : null;
  const logoRaw = optStr(formData.get("logoUrl"), 400);
  const logoUrl = logoRaw && isAllowedProductImageUrl(logoRaw) ? logoRaw : null;
  try {
    await updateShop(shop.id, {
      themeColor,
      bannerStyle,
      bannerImage,
      logoUrl,
      bannerHeading: optStr(formData.get("bannerHeading"), 80),
      bannerSubtext: optStr(formData.get("bannerSubtext"), 160),
      template,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save your storefront." };
  }
  revalidatePath("/dashboard/storefront");
  revalidatePath(`/${shop.slug}`);
  pingIndexNow(`${SITE_URL}/${shop.slug}`);
  return { ok: true };
}
