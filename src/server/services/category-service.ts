// Category data access. Categories are a managed list per shop; products link
// to them by category NAME (kept in sync on rename/delete). Demo-data fallback.
import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";
import { mockCategories, mockProducts } from "../mock-data";
import { normalizeSlug } from "../validate";
import type { Category, CategoryInput } from "../types";

function rowToCategory(r: any): Category {
  return {
    id: r.id,
    shopId: r.shop_id,
    name: r.name,
    slug: r.slug,
    sortOrder: r.sort_order ?? 0,
    createdAt: r.created_at,
  };
}

function bySort(a: Category, b: Category) {
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
}

export async function listCategories(shopId: string): Promise<Category[]> {
  if (!isSupabaseConfigured()) {
    return mockCategories.filter((c) => c.shopId === shopId).slice().sort(bySort);
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("shop_id", shopId)
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data.map(rowToCategory);
}

export async function getCategoryBySlug(shopId: string, slug: string): Promise<Category | null> {
  if (!isSupabaseConfigured()) {
    return mockCategories.find((c) => c.shopId === shopId && c.slug === slug) ?? null;
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("shop_id", shopId)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return rowToCategory(data);
}

export async function countCategories(shopId: string): Promise<number> {
  if (!isSupabaseConfigured()) return mockCategories.filter((c) => c.shopId === shopId).length;
  const supabase = getServerSupabase();
  const { count } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("shop_id", shopId);
  return count ?? 0;
}

function uniqueSlug(shopId: string, base: string, exceptId?: string): string {
  const root = base || "category";
  let slug = root;
  let n = 1;
  const taken = (s: string) =>
    mockCategories.some((c) => c.shopId === shopId && c.slug === s && c.id !== exceptId);
  while (taken(slug)) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

export async function createCategory(shopId: string, input: CategoryInput): Promise<Category> {
  const name = input.name.trim();
  if (!name) throw new Error("Category name is required.");
  const base = normalizeSlug(name);
  if (!isSupabaseConfigured()) {
    const cat: Category = {
      id: `cat-${Date.now()}`,
      shopId,
      name,
      slug: uniqueSlug(shopId, base),
      sortOrder: input.sortOrder ?? mockCategories.filter((c) => c.shopId === shopId).length,
      createdAt: new Date().toISOString(),
    };
    mockCategories.push(cat);
    return cat;
  }
  const supabase = getServerSupabase();
  for (let attempt = 0; attempt < 6; attempt++) {
    const slug = attempt === 0 ? base || "category" : `${base || "category"}-${attempt + 1}`;
    const { data, error } = await supabase
      .from("categories")
      .insert({ shop_id: shopId, name, slug, sort_order: input.sortOrder ?? 0 })
      .select("*")
      .single();
    if (!error && data) return rowToCategory(data);
    if (error && (error as { code?: string }).code !== "23505") {
      console.error("createCategory:", error);
      throw new Error("Could not create the category. Please try again.");
    }
  }
  throw new Error("Could not create a unique link for this category.");
}

export async function updateCategory(
  shopId: string,
  id: string,
  input: CategoryInput
): Promise<Category> {
  const name = input.name.trim();
  if (!name) throw new Error("Category name is required.");
  if (!isSupabaseConfigured()) {
    const cat = mockCategories.find((c) => c.id === id && c.shopId === shopId);
    if (!cat) throw new Error("Category not found.");
    const oldName = cat.name;
    cat.name = name;
    cat.slug = uniqueSlug(shopId, normalizeSlug(name), id);
    if (input.sortOrder !== undefined) cat.sortOrder = input.sortOrder;
    for (const p of mockProducts) {
      if (p.shopId === shopId && p.category === oldName) p.category = name;
    }
    return cat;
  }
  const supabase = getServerSupabase();
  const { data: existing } = await supabase
    .from("categories")
    .select("name")
    .eq("id", id)
    .eq("shop_id", shopId)
    .maybeSingle();
  const { data, error } = await supabase
    .from("categories")
    .update({ name, ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}) })
    .eq("id", id)
    .eq("shop_id", shopId)
    .select("*")
    .single();
  if (error || !data) {
    console.error("updateCategory:", error);
    throw new Error("Could not save the category. Please try again.");
  }
  if (existing?.name && existing.name !== name) {
    await supabase
      .from("products")
      .update({ category: name })
      .eq("shop_id", shopId)
      .eq("category", existing.name);
  }
  return rowToCategory(data);
}

export async function deleteCategory(shopId: string, id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const i = mockCategories.findIndex((c) => c.id === id && c.shopId === shopId);
    if (i >= 0) {
      const name = mockCategories[i].name;
      mockCategories.splice(i, 1);
      for (const p of mockProducts) {
        if (p.shopId === shopId && p.category === name) p.category = null;
      }
    }
    return;
  }
  const supabase = getServerSupabase();
  const { data: cat } = await supabase
    .from("categories")
    .select("name")
    .eq("id", id)
    .eq("shop_id", shopId)
    .maybeSingle();
  await supabase.from("categories").delete().eq("id", id).eq("shop_id", shopId);
  if (cat?.name) {
    await supabase
      .from("products")
      .update({ category: null })
      .eq("shop_id", shopId)
      .eq("category", cat.name);
  }
}
