import { requireSeller } from "@/server/auth/current-seller";
import { listReviewsForShop } from "@/server/services/review-service";
import { listShopProducts } from "@/server/services/product-service";
import { deleteReviewAction } from "@/server/actions/review-actions";

export default async function ReviewsPage() {
  const { shop } = await requireSeller();
  const [reviews, products] = await Promise.all([
    listReviewsForShop(shop.id),
    listShopProducts(shop.id),
  ]);
  const nameById = new Map(products.map((p) => [p.id, p.name]));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-ink">Reviews</h1>
        <p className="text-sm text-muted">
          Customer reviews on your products. Remove any that break your rules.
        </p>
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
          No reviews yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-start gap-3 rounded-xl border border-line bg-surface p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">{r.author}</span>
                  <span className="text-sm" style={{ color: "#E8A317" }}>
                    {"★".repeat(r.rating)}
                    <span style={{ color: "#D6DEDA" }}>{"★".repeat(5 - r.rating)}</span>
                  </span>
                </div>
                <p className="text-xs text-muted">{nameById.get(r.productId) ?? "Product"}</p>
                {r.comment && <p className="mt-1 text-sm text-ink">{r.comment}</p>}
              </div>
              <form action={deleteReviewAction}>
                <input type="hidden" name="id" value={r.id} />
                <button
                  type="submit"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#C0362C] transition hover:bg-[#FBECEA]"
                >
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
