import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSeller } from "@/server/auth/current-seller";
import { getShopProduct, getProductsByShop } from "@/server/services/product-service";
import { updateProductAction } from "@/server/actions/product-actions";
import { ProductForm } from "@/components/dashboard/product-form";
import { MessageBuyers } from "@/components/dashboard/message-buyers";
import { listCategories } from "@/server/services/category-service";
import { listProductBuyers } from "@/server/services/customer-service";

export default async function EditProductPage({ params: _p }: { params: Promise<{ id: string }> }) {
  const params = await _p;
  const { shop } = await requireSeller();
  const product = await getShopProduct(shop.id, params.id);
  if (!product) notFound();
  const [categories, all, buyers] = await Promise.all([
    listCategories(shop.id),
    getProductsByShop(shop.id),
    listProductBuyers(shop.id, params.id),
  ]);
  const products = all.filter((p) => p.id !== product.id).map((p) => ({ id: p.id, name: p.name }));
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/dashboard/products" className="text-sm text-primary">
        ← Back to products
      </Link>
      <h1 className="text-lg font-semibold text-ink">Edit product</h1>
      <div className="rounded-2xl border border-line bg-surface p-5">
        <ProductForm
          action={updateProductAction}
          product={product}
          categories={categories}
          products={products}
          shopSlug={shop.slug}
          submitLabel="Save changes"
        />
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-base font-semibold text-ink">Message buyers of this product</h2>
        <p className="mb-3 text-xs text-muted">
          Reach everyone who ordered <span className="font-medium text-ink">{product.name}</span> — perfect for restock alerts, review requests, or repeat-order nudges.
        </p>
        <MessageBuyers buyers={buyers} productName={product.name} shopName={shop.name} shopSlug={shop.slug} />
      </div>
    </div>
  );
}
