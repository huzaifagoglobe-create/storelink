"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "../auth/current-seller";
import { updateShop, isSlugTaken } from "../services/shop-service";
import { pingIndexNow } from "../indexnow";
import { SITE_URL } from "@/lib/site";
import { str, optStr, optNum, num, bool, normalizeSlug, normalizePhone } from "../validate";

export interface ShopState {
  error?: string;
  ok?: boolean;
}

export async function updateShopAction(_prev: ShopState, formData: FormData): Promise<ShopState> {
  const { shop } = await requireSeller();
  const name = str(formData.get("name"), 80);
  const slug = normalizeSlug(str(formData.get("slug"), 60));
  const whatsapp = normalizePhone(str(formData.get("whatsapp"), 40));
  const deliveryFee = num(formData.get("deliveryFee"));

  if (!name) return { error: "Shop name is required." };
  if (slug.length < 3) return { error: "Your shop link must be at least 3 characters." };
  if (whatsapp.length < 8) return { error: "Please enter a valid WhatsApp number." };
  if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
    return { error: "Enter a valid delivery fee." };
  }
  if (slug !== shop.slug && (await isSlugTaken(slug, shop.id))) {
    return { error: "That shop link is already taken. Try another." };
  }

  let deliveryZones: { city: string; fee: number }[] | undefined;
  try {
    const raw = formData.get("deliveryZones");
    if (typeof raw === "string" && raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        deliveryZones = arr
          .map((z) => ({
            city: String(z?.city ?? "").trim().slice(0, 60),
            fee: Math.max(0, Math.round(Number(z?.fee))),
          }))
          .filter((z) => z.city && Number.isFinite(z.fee));
      }
    }
  } catch {
    /* ignore malformed zones */
  }

  try {
  // Marketing tracking IDs — strict formats so broken snippets can't be injected.
  const fbRaw = optStr(formData.get("fbPixelId"), 30);
  const fbPixelId = fbRaw && /^\d{5,20}$/.test(fbRaw) ? fbRaw : null;
  if (fbRaw && !fbPixelId) return { error: "Facebook Pixel ID should be just numbers (find it in Meta Events Manager)." };
  const gaRaw = optStr(formData.get("gaMeasurementId"), 20);
  const gaMeasurementId = gaRaw && /^G-[A-Z0-9]{4,14}$/i.test(gaRaw) ? gaRaw.toUpperCase() : null;
  if (gaRaw && !gaMeasurementId) return { error: "Google Analytics ID looks like G-XXXXXXXXXX (find it in GA4 Admin → Data Streams)." };

    await updateShop(shop.id, {
      fbPixelId,
      gaMeasurementId,
      seoTitle: optStr(formData.get("seoTitle"), 70),
      seoDescription: optStr(formData.get("seoDescription"), 170),
      name,
      slug,
      tagline: optStr(formData.get("tagline"), 120),
      address: optStr(formData.get("address"), 200),
      logoText: optStr(formData.get("logoText"), 8),
      whatsapp,
      paymentNote: optStr(formData.get("paymentNote"), 300),
      freeDeliveryOver: optNum(formData.get("freeDeliveryOver")),
      deliveryFee,
      deliveryZones,
      instagramUrl: optStr(formData.get("instagramUrl"), 200),
      facebookUrl: optStr(formData.get("facebookUrl"), 200),
      tiktokUrl: optStr(formData.get("tiktokUrl"), 200),
      youtubeUrl: optStr(formData.get("youtubeUrl"), 200),
      isActive: bool(formData.get("isActive")),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save your changes." };
  }
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  pingIndexNow(`${SITE_URL}/${slug}`);
  return { ok: true };
}
