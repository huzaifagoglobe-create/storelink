"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "../auth/current-seller";
import { deleteReview } from "../services/review-service";
import { str } from "../validate";

export async function deleteReviewAction(formData: FormData): Promise<void> {
  const { shop } = await requireSeller();
  const id = str(formData.get("id"), 60);
  if (id) {
    try {
      await deleteReview(shop.id, id);
    } catch (e) {
      console.error(e);
    }
  }
  revalidatePath("/dashboard/reviews");
}
