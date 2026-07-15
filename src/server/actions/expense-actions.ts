"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "../auth/current-seller";
import { createExpense, deleteExpense, EXPENSE_CATEGORIES } from "../services/expense-service";

export interface ExpenseState {
  ok?: boolean;
  error?: string;
}

export async function addExpenseAction(_prev: ExpenseState, formData: FormData): Promise<ExpenseState> {
  const { shop } = await requireSeller();
  const amount = Math.round(Number(formData.get("amount")));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) {
    return { error: "Enter the amount in rupees (e.g. 1500)." };
  }
  const category = String(formData.get("category") ?? "");
  if (!(EXPENSE_CATEGORIES as readonly string[]).includes(category)) {
    return { error: "Pick a category." };
  }
  const note = String(formData.get("note") ?? "").trim().slice(0, 120) || null;
  const spentRaw = String(formData.get("spentOn") ?? "").trim();
  const spentOn = /^\d{4}-\d{2}-\d{2}$/.test(spentRaw) ? spentRaw : new Date().toISOString().slice(0, 10);
  try {
    await createExpense(shop.id, { amount, category, note, spentOn });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save the expense." };
  }
  revalidatePath("/dashboard/khata");
  return { ok: true };
}

export async function removeExpenseAction(formData: FormData): Promise<void> {
  const { shop } = await requireSeller();
  const id = String(formData.get("id") ?? "");
  if (id) await deleteExpense(shop.id, id);
  revalidatePath("/dashboard/khata");
}
