"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "../auth/current-seller";
import { countCategories } from "../services/category-service";
import { planLimits } from "../plans";
import { createCategory, updateCategory, deleteCategory } from "../services/category-service";
import { str } from "../validate";

export interface CategoryState {
  error?: string;
}

export async function createCategoryAction(
  _prev: CategoryState,
  formData: FormData
): Promise<CategoryState> {
  const { shop } = await requireSeller();
  const limit = planLimits(shop.plan).categories;
  if (limit === 0) {
    return { error: "Categories aren't included on the Free trial. Upgrade to use them." };
  }
  if (limit !== Infinity && (await countCategories(shop.id)) >= limit) {
    return {
      error: `You've reached your plan's limit of ${limit} categories. Upgrade to add more.`,
    };
  }
  const name = str(formData.get("name"), 60);
  if (!name) return { error: "Category name is required." };
  try {
    await createCategory(shop.id, { name });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create the category." };
  }
  revalidatePath("/dashboard/categories");
  return {};
}

export async function updateCategoryAction(formData: FormData): Promise<void> {
  const { shop } = await requireSeller();
  const id = str(formData.get("id"), 60);
  const name = str(formData.get("name"), 60);
  if (id && name) {
    try {
      await updateCategory(shop.id, id, { name });
    } catch (e) {
      console.error(e);
    }
  }
  revalidatePath("/dashboard/categories");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const { shop } = await requireSeller();
  const id = str(formData.get("id"), 60);
  if (id) {
    try {
      await deleteCategory(shop.id, id);
    } catch (e) {
      console.error(e);
    }
  }
  revalidatePath("/dashboard/categories");
}
