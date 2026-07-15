import Link from "next/link";
import { requireSeller } from "@/server/auth/current-seller";
import { listCategories } from "@/server/services/category-service";
import { updateCategoryAction, deleteCategoryAction } from "@/server/actions/category-actions";
import { CategoryCreateForm } from "@/components/dashboard/category-create-form";
import { inputClass } from "@/components/dashboard/field";

export default async function CategoriesPage() {
  const { shop } = await requireSeller();
  const categories = await listCategories(shop.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-ink">Categories</h1>
        <p className="text-sm text-muted">
          Group your products so customers can browse by type. {categories.length}{" "}
          {categories.length === 1 ? "category" : "categories"}.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <CategoryCreateForm />
      </div>

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
          No categories yet. Add one above — then pick it when adding or editing a product.
        </p>
      ) : (
        <ul className="space-y-2">
          {categories.map((c) => (
            <li key={c.id} className="rounded-xl border border-line bg-surface p-3">
              <div className="flex flex-wrap items-center gap-2">
                <form action={updateCategoryAction} className="flex flex-1 items-center gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input name="name" defaultValue={c.name} className={inputClass} aria-label="Category name" />
                  <button
                    type="submit"
                    className="flex-none rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition hover:bg-[#eef3f0]"
                  >
                    Save
                  </button>
                </form>
                <Link
                  href={`/${shop.slug}/category/${c.slug}`}
                  target="_blank"
                  className="flex-none text-xs font-medium text-primary"
                >
                  /{c.slug} ↗
                </Link>
                <form action={deleteCategoryAction} className="flex-none">
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-[#C0362C] transition hover:bg-[#FBECEA]"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
