import Link from "next/link";
import { requireSeller } from "@/server/auth/current-seller";
import { ProductImportForm } from "@/components/dashboard/product-import-form";

export default async function ImportProductsPage() {
  await requireSeller();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/dashboard/products" className="text-sm text-primary">
        ← Back to products
      </Link>
      <div>
        <h1 className="text-lg font-semibold text-ink">Import products</h1>
        <p className="text-sm text-muted">Add many products at once from a CSV file.</p>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5">
        <ProductImportForm />
      </div>
    </div>
  );
}
