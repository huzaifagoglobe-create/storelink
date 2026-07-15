import Link from "next/link";
import { requireSeller } from "@/server/auth/current-seller";
import { createProductAction } from "@/server/actions/product-actions";
import { ProductForm } from "@/components/dashboard/product-form";
import { listCategories } from "@/server/services/category-service";
import { getProductsByShop } from "@/server/services/product-service";

export default async function NewProductPage() {
  const { shop } = await requireSeller();
  const [categories, products] = await Promise.all([
    listCategories(shop.id),
    getProductsByShop(shop.id),
  ]);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/dashboard/products" className="text-sm text-primary">
        ← Back to products
      </Link>
      <h1 className="text-lg font-semibold text-ink">Add product</h1>
      <div className="rounded-2xl border border-line bg-surface p-5">
        <ProductForm
          action={createProductAction}
          categories={categories}
          products={products.map((p) => ({ id: p.id, name: p.name }))}
          shopSlug={shop.slug}
          submitLabel="Add product"
        />
      </div>
    </div>
  );
}
