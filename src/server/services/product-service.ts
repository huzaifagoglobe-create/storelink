// Product data access. Falls back to demo data when Supabase is not configured.
import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";
import { mockProducts } from "../mock-data";
import type { Product, ProductInput } from "../types";

function rowToProduct(r: any): Product {
  return {
    id: r.id,
    shopId: r.shop_id,
    name: r.name,
    description: r.description,
    price: Number(r.price),
    compareAtPrice: r.compare_at_price === null ? null : Number(r.compare_at_price),
    costPrice: r.cost_price === null || r.cost_price === undefined ? null : Number(r.cost_price),
    videoUrl: r.video_url ?? null,
    sizeChartUrl: r.size_chart_url ?? null,
    dropAt: r.drop_at ?? null,
    stock: r.stock,
    category: r.category,
    tag: r.tag ?? null,
    imageUrls: r.image_urls ?? [],
    options: Array.isArray(r.options) ? r.options : [],
    variantStock: r.variant_stock ?? null,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

/** Storefront: only ACTIVE products, oldest first. */
export async function getProductsByShop(shopId: string): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return mockProducts.filter((p) => p.shopId === shopId && p.isActive);
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(rowToProduct);
}

/** Storefront single product (used on the product page + order pricing). */
export async function getProductById(
  shopId: string,
  productId: string
): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return mockProducts.find((p) => p.id === productId && p.shopId === shopId) ?? null;
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("shop_id", shopId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToProduct(data);
}

// --------------------------- Dashboard (owner) -----------------------------

/** All products for the owner's dashboard (incl. inactive), newest first. */
export async function listShopProducts(shopId: string): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return mockProducts
      .filter((p) => p.shopId === shopId)
      .slice()
      .reverse();
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToProduct);
}

/** Owner single product (any status) for the edit page. */
export async function getShopProduct(shopId: string, productId: string) {
  return getProductById(shopId, productId);
}

export async function createProduct(shopId: string, input: ProductInput): Promise<Product> {
  if (!isSupabaseConfigured()) {
    const product: Product = {
      id: `p-${Date.now()}`,
      shopId,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      compareAtPrice: input.compareAtPrice ?? null,
      costPrice: input.costPrice ?? null,
      videoUrl: input.videoUrl ?? null,
      sizeChartUrl: input.sizeChartUrl ?? null,
      dropAt: input.dropAt ?? null,
      stock: input.stock,
      category: input.category ?? null,
      tag: input.tag ?? null,
      imageUrls: input.imageUrls ?? [],
      options: input.options ?? [],
      variantStock: input.variantStock ?? null,
      isActive: input.isActive ?? true,
      createdAt: new Date().toISOString(),
    };
    mockProducts.push(product);
    return product;
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .insert({
      shop_id: shopId,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      compare_at_price: input.compareAtPrice ?? null,
      cost_price: input.costPrice ?? null,
      video_url: input.videoUrl ?? null,
      size_chart_url: input.sizeChartUrl ?? null,
      drop_at: input.dropAt ?? null,
      stock: input.stock,
      category: input.category ?? null,
      tag: input.tag ?? null,
      image_urls: input.imageUrls ?? [],
      options: input.options ?? [],
      variant_stock: input.variantStock ?? null,
      is_active: input.isActive ?? true,
    })
    .select("*")
    .single();
  if (error || !data) {
    console.error("createProduct:", error);
    throw new Error("Could not save the product. Please try again.");
  }
  return rowToProduct(data);
}

export async function updateProduct(
  shopId: string,
  productId: string,
  patch: Partial<ProductInput>
): Promise<Product> {
  if (!isSupabaseConfigured()) {
    const p = mockProducts.find((x) => x.id === productId && x.shopId === shopId);
    if (!p) throw new Error("Product not found.");
    Object.assign(p, {
      name: patch.name ?? p.name,
      description: patch.description === undefined ? p.description : patch.description,
      price: patch.price ?? p.price,
      compareAtPrice:
        patch.compareAtPrice === undefined ? p.compareAtPrice : patch.compareAtPrice,
      costPrice: patch.costPrice === undefined ? p.costPrice : patch.costPrice,
      videoUrl: patch.videoUrl === undefined ? p.videoUrl : patch.videoUrl,
      sizeChartUrl: patch.sizeChartUrl === undefined ? p.sizeChartUrl : patch.sizeChartUrl,
      dropAt: patch.dropAt === undefined ? p.dropAt : patch.dropAt,
      stock: patch.stock ?? p.stock,
      category: patch.category === undefined ? p.category : patch.category,
      tag: patch.tag === undefined ? p.tag : patch.tag,
      imageUrls: patch.imageUrls ?? p.imageUrls,
      options: patch.options ?? p.options,
      variantStock: patch.variantStock === undefined ? p.variantStock : patch.variantStock,
      isActive: patch.isActive ?? p.isActive,
    });
    return p;
  }
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.price !== undefined) row.price = patch.price;
  if (patch.compareAtPrice !== undefined) row.compare_at_price = patch.compareAtPrice;
  if (patch.costPrice !== undefined) row.cost_price = patch.costPrice;
  if (patch.videoUrl !== undefined) row.video_url = patch.videoUrl;
  if (patch.sizeChartUrl !== undefined) row.size_chart_url = patch.sizeChartUrl;
  if (patch.dropAt !== undefined) row.drop_at = patch.dropAt;
  if (patch.stock !== undefined) row.stock = patch.stock;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.tag !== undefined) row.tag = patch.tag;
  if (patch.imageUrls !== undefined) row.image_urls = patch.imageUrls;
  if (patch.options !== undefined) row.options = patch.options;
  if (patch.variantStock !== undefined) row.variant_stock = patch.variantStock;
  if (patch.isActive !== undefined) row.is_active = patch.isActive;

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .update(row)
    .eq("id", productId)
    .eq("shop_id", shopId)
    .select("*")
    .single();
  if (error || !data) {
    console.error("updateProduct:", error);
    throw new Error("Could not save your changes. Please try again.");
  }
  return rowToProduct(data);
}

export async function deleteProduct(shopId: string, productId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const i = mockProducts.findIndex((x) => x.id === productId && x.shopId === shopId);
    if (i >= 0) mockProducts.splice(i, 1);
    return;
  }
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("shop_id", shopId);
  if (error) {
    console.error("deleteProduct:", error);
    throw new Error("Could not delete the product. Please try again.");
  }
}

/** Reduce stock after a sale. Returns true if the full quantity was in stock and
 *  decremented, false if there wasn't enough (so the caller can reject the line).
 *  Atomic & conditional in real mode — the DB only decrements when stock >= qty,
 *  which prevents two concurrent orders from overselling the last item.
 *  If the product tracks per-variant stock and a variant is given, that variant
 *  is decremented; otherwise the product total is. */
export async function decrementStock(
  shopId: string,
  productId: string,
  qty: number,
  variant?: string | null
): Promise<boolean> {
  if (qty <= 0) return true;

  if (!isSupabaseConfigured()) {
    const p = mockProducts.find((x) => x.id === productId && x.shopId === shopId);
    if (!p) return false;
    if (variant && p.variantStock && variant in p.variantStock) {
      const have = p.variantStock[variant] ?? 0;
      if (have < qty) return false;
      p.variantStock = { ...p.variantStock, [variant]: have - qty };
      return true;
    }
    if (p.stock < qty) return false;
    p.stock = p.stock - qty;
    return true;
  }

  const supabase = getServerSupabase();
  if (variant) {
    // Only touch variant stock if this product actually tracks this variant.
    const { data } = await supabase.from("products").select("variant_stock").eq("id", productId).eq("shop_id", shopId).maybeSingle();
    const vs = (data?.variant_stock ?? null) as Record<string, number> | null;
    if (vs && variant in vs) {
      const { data: okData, error } = await supabase.rpc("dec_variant_stock", { p_id: productId, p_shop: shopId, p_key: variant, p_qty: qty });
      if (error) {
        console.error("decVariantStock:", error.message);
        return false;
      }
      return okData === true;
    }
  }
  const { data: okData, error } = await supabase.rpc("dec_stock", { p_id: productId, p_shop: shopId, p_qty: qty });
  if (error) {
    console.error("decrementStock:", error.message);
    return false;
  }
  return okData === true;
}

/** Give reserved stock back (used if an order fails after stock was reserved). */
export async function restoreStock(
  shopId: string,
  productId: string,
  qty: number,
  variant?: string | null
): Promise<void> {
  if (qty <= 0) return;
  if (!isSupabaseConfigured()) {
    const p = mockProducts.find((x) => x.id === productId && x.shopId === shopId);
    if (!p) return;
    if (variant && p.variantStock && variant in p.variantStock) {
      p.variantStock = { ...p.variantStock, [variant]: (p.variantStock[variant] ?? 0) + qty };
    } else {
      p.stock = p.stock + qty;
    }
    return;
  }
  const supabase = getServerSupabase();
  if (variant) {
    const { data } = await supabase.from("products").select("variant_stock").eq("id", productId).eq("shop_id", shopId).maybeSingle();
    const vs = (data?.variant_stock ?? null) as Record<string, number> | null;
    if (vs && variant in vs) {
      // Negative qty on the conditional decrement adds stock back.
      await supabase.rpc("dec_variant_stock", { p_id: productId, p_shop: shopId, p_key: variant, p_qty: -qty });
      return;
    }
  }
  await supabase.rpc("dec_stock", { p_id: productId, p_shop: shopId, p_qty: -qty });
}

/** Storefront product search by name/description (active products only). */
export async function searchActiveProducts(shopId: string, q: string): Promise<Product[]> {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  if (!isSupabaseConfigured()) {
    return mockProducts.filter(
      (p) =>
        p.shopId === shopId &&
        p.isActive &&
        (p.name.toLowerCase().includes(query) ||
          (p.description ?? "").toLowerCase().includes(query))
    );
  }
  // Strip characters that would break PostgREST or()/ilike filter syntax.
  const safe = query.replace(/[%,()*]/g, " ").trim();
  if (!safe) return [];
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .or(`name.ilike.%${safe}%,description.ilike.%${safe}%`)
    .limit(50);
  return (data ?? []).map(rowToProduct);
}
