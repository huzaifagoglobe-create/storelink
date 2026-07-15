"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSeller } from "../auth/current-seller";
import { createProduct, updateProduct, deleteProduct, listShopProducts } from "../services/product-service";
import { str, optStr, num, optNum, bool } from "../validate";
import type { ProductInput } from "../types";
import { planLimits, isTrialExpired } from "../plans";
import { cleanRichText } from "../sanitize";
import { isAllowedProductImageUrl } from "../services/upload-service";
import { pingIndexNow } from "../indexnow";
import { SITE_URL } from "@/lib/site";

export interface ProductState {
  error?: string;
}

function parseProduct(formData: FormData): { input?: ProductInput; error?: string } {
  const name = str(formData.get("name"), 120);
  const description = cleanRichText(optStr(formData.get("description"), 6000));
  const price = num(formData.get("price"));
  const stock = Math.floor(num(formData.get("stock")));
  if (!name) return { error: "Product name is required." };
  if (!Number.isFinite(price) || price < 0) return { error: "Enter a valid price." };
  if (!Number.isFinite(stock) || stock < 0) return { error: "Enter a valid stock quantity." };
  const compareAtPrice = optNum(formData.get("compareAtPrice"));
  if (compareAtPrice !== null && compareAtPrice < 0) {
    return { error: "Enter a valid compare-at price." };
  }
  const costPrice = optNum(formData.get("costPrice"));
  if (costPrice !== null && costPrice < 0) {
    return { error: "Enter a valid cost price." };
  }
  // Product video: YouTube / TikTok / Instagram links only.
  const videoRaw = optStr(formData.get("videoUrl"), 300);
  const videoUrl =
    videoRaw && /^https:\/\/(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com|tiktok\.com|www\.tiktok\.com|instagram\.com|www\.instagram\.com)\//.test(videoRaw)
      ? videoRaw
      : null;
  if (videoRaw && !videoUrl) {
    return { error: "Video link must be a YouTube, TikTok, or Instagram URL (starting with https://)." };
  }
  // Size chart image (single, from our own uploads only).
  const sizeChartRaw = formData.getAll("sizeChartUrl").map(String).filter((v) => isAllowedProductImageUrl(v));
  const sizeChartUrl = sizeChartRaw[0] ?? null;

  // Live Drop: optional future datetime.
  const dropRaw = optStr(formData.get("dropAt"), 30);
  let dropAt: string | null = null;
  if (dropRaw) {
    const d = new Date(dropRaw);
    if (Number.isNaN(d.getTime())) return { error: "Drop time is not a valid date." };
    dropAt = d.toISOString();
  }
  const tagRaw = optStr(formData.get("tag"), 20);
  const tag =
    tagRaw === "hot" || tagRaw === "bestseller" || tagRaw === "new" ? tagRaw : null;
  const imageUrls = formData
    .getAll("imageUrls")
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .filter((v) => isAllowedProductImageUrl(v))
    .slice(0, 5);
  let options: { name: string; values: string[] }[] = [];
  try {
    const raw = formData.get("options");
    if (typeof raw === "string" && raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        options = arr
          .map((o) => ({
            name: String(o?.name ?? "").trim().slice(0, 40),
            values: Array.isArray(o?.values)
              ? o.values.map((v: unknown) => String(v).trim().slice(0, 40)).filter(Boolean).slice(0, 20)
              : [],
          }))
          .filter((o) => o.name && o.values.length > 0)
          .slice(0, 5);
      }
    }
  } catch {
    /* ignore malformed options */
  }

  let variantStock: Record<string, number> | null = null;
  try {
    const raw = formData.get("variantStock");
    if (typeof raw === "string" && raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const out: Record<string, number> = {};
        for (const [k, v] of Object.entries(parsed)) {
          const n = Math.floor(Number(v));
          if (k && k.length <= 200 && Number.isFinite(n) && n >= 0) out[k] = Math.min(100000, n);
        }
        if (Object.keys(out).length > 0) variantStock = out;
      }
    }
  } catch {
    /* ignore malformed variant stock */
  }

  return {
    input: {
      name,
      description,
      price,
      compareAtPrice,
      costPrice,
      videoUrl,
      dropAt,
      sizeChartUrl,
      stock,
      category: optStr(formData.get("category"), 60),
      tag,
      imageUrls,
      options,
    variantStock,
      isActive: bool(formData.get("isActive")),
    },
  };
}

export async function createProductAction(
  _prev: ProductState,
  formData: FormData
): Promise<ProductState> {
  const { shop } = await requireSeller();
  if (isTrialExpired(shop.plan, shop.trialEndsAt)) {
    return { error: "Your free trial has ended. Upgrade your plan to add more products." };
  }
  const limit = planLimits(shop.plan).products;
  if (limit !== Infinity && (await listShopProducts(shop.id)).length >= limit) {
    return {
      error: `You've reached your plan's limit of ${limit} products. Upgrade to add more.`,
    };
  }
  const { input, error } = parseProduct(formData);
  if (error) return { error };
  let product;
  try {
    product = await createProduct(shop.id, input!);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save the product." };
  }
  pingIndexNow([`${SITE_URL}/${shop.slug}`, `${SITE_URL}/${shop.slug}/product/${product.id}`]);
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function updateProductAction(
  _prev: ProductState,
  formData: FormData
): Promise<ProductState> {
  const { shop } = await requireSeller();
  const productId = str(formData.get("productId"), 60);
  if (!productId) return { error: "Missing product id." };
  const { input, error } = parseProduct(formData);
  if (error) return { error };
  try {
    await updateProduct(shop.id, productId, input!);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save your changes." };
  }
  pingIndexNow(`${SITE_URL}/${shop.slug}/product/${productId}`);
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const { shop } = await requireSeller();
  const productId = str(formData.get("productId"), 60);
  if (productId) {
    try {
      await deleteProduct(shop.id, productId);
    } catch (e) {
      console.error(e);
    }
  }
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function toggleProductActiveAction(formData: FormData): Promise<void> {
  const { shop } = await requireSeller();
  const productId = str(formData.get("productId"), 60);
  const next = bool(formData.get("next"));
  if (productId) {
    try {
      await updateProduct(shop.id, productId, { isActive: next });
    } catch (e) {
      console.error(e);
    }
  }
  revalidatePath("/dashboard/products");
}
