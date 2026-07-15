import "server-only";
import { randomUUID } from "crypto";
import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";
import type { Expense } from "../types";

// Demo store pinned to globalThis so every route bundle shares one copy.
const g = globalThis as unknown as { __wsbExpenses?: Expense[] };
g.__wsbExpenses ??= [];
const store = g.__wsbExpenses;

export const EXPENSE_CATEGORIES = [
  "Stock purchase",
  "Packaging",
  "Courier",
  "Ads / marketing",
  "Rent & bills",
  "Other",
] as const;

function rowToExpense(r: any): Expense {
  return {
    id: r.id,
    shopId: r.shop_id,
    amount: Number(r.amount),
    category: r.category,
    note: r.note ?? null,
    spentOn: r.spent_on,
    createdAt: r.created_at,
  };
}

/** Expenses for one month (month = "YYYY-MM"), newest first. */
export async function listExpenses(shopId: string, month: string): Promise<Expense[]> {
  if (!isSupabaseConfigured()) {
    return store
      .filter((e) => e.shopId === shopId && e.spentOn.startsWith(month))
      .sort((a, b) => (a.spentOn < b.spentOn ? 1 : -1));
  }
  const supabase = getServerSupabase();
  const start = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const end = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("shop_id", shopId)
    .gte("spent_on", start)
    .lt("spent_on", end)
    .order("spent_on", { ascending: false });
  if (error) {
    console.error("listExpenses:", error.message);
    return [];
  }
  return (data ?? []).map(rowToExpense);
}

export async function createExpense(
  shopId: string,
  input: { amount: number; category: string; note: string | null; spentOn: string }
): Promise<Expense> {
  if (!isSupabaseConfigured()) {
    const e: Expense = {
      id: randomUUID(),
      shopId,
      amount: input.amount,
      category: input.category,
      note: input.note,
      spentOn: input.spentOn,
      createdAt: new Date().toISOString(),
    };
    store.push(e);
    return e;
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("expenses")
    .insert({ shop_id: shopId, amount: input.amount, category: input.category, note: input.note, spent_on: input.spentOn })
    .select()
    .single();
  if (error) throw new Error("Could not save the expense: " + error.message);
  return rowToExpense(data);
}

export async function deleteExpense(shopId: string, id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const i = store.findIndex((e) => e.shopId === shopId && e.id === id);
    if (i >= 0) store.splice(i, 1);
    return;
  }
  const supabase = getServerSupabase();
  await supabase.from("expenses").delete().eq("shop_id", shopId).eq("id", id);
}
