"use server";

import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { requireSeller } from "../auth/current-seller";
import { createProduct, listShopProducts } from "../services/product-service";
import { planLimits } from "../plans";
import { cleanRichText } from "../sanitize";

export interface ImportState {
  ok?: boolean;
  error?: string;
  message?: string;
}

export async function importProductsAction(
  _prev: ImportState,
  formData: FormData
): Promise<ImportState> {
  const { shop } = await requireSeller();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a CSV file." };
  }
  if (file.size > 2_000_000) {
    return { error: "That file is too large (max 2 MB)." };
  }
  let text = "";
  try {
    text = await file.text();
  } catch {
    return { error: "Could not read that file." };
  }

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  const rows = parsed.data ?? [];
  if (rows.length === 0) {
    return { error: "No rows found. Use the template and include a header row." };
  }

  const limit = planLimits(shop.plan).products;
  let remaining =
    limit === Infinity ? Infinity : Math.max(0, limit - (await listShopProducts(shop.id)).length);

  let added = 0;
  let skipped = 0;
  let stoppedAtLimit = false;

  for (const row of rows) {
    if (remaining <= 0) {
      stoppedAtLimit = true;
      break;
    }
    const name = (row.name ?? "").trim();
    const price = Number(row.price);
    const stock = row.stock !== undefined && row.stock !== "" ? Number(row.stock) : 0;
    if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(stock) || stock < 0) {
      skipped += 1;
      continue;
    }
    try {
      await createProduct(shop.id, {
        name: name.slice(0, 120),
        description: cleanRichText((row.description ?? "").trim().slice(0, 6000)),
        price: Math.round(price),
        compareAtPrice: null,
        stock: Math.round(stock),
        category: (row.category ?? "").trim().slice(0, 60) || null,
        tag: null,
        imageUrls: [],
        isActive: true,
      });
      added += 1;
      if (remaining !== Infinity) remaining -= 1;
    } catch {
      skipped += 1;
    }
  }

  revalidatePath("/dashboard/products");
  const parts = [`${added} product${added === 1 ? "" : "s"} added`];
  if (skipped > 0) parts.push(`${skipped} row${skipped === 1 ? "" : "s"} skipped`);
  if (stoppedAtLimit) parts.push("plan limit reached — upgrade to add more");
  return { ok: true, message: parts.join(" · ") };
}
