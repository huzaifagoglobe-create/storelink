import Link from "next/link";
import { requireSeller } from "@/server/auth/current-seller";
import { listShopProducts } from "@/server/services/product-service";
import { formatCurrency } from "@/lib/format";
import { ShareCardButton } from "@/components/dashboard/share-card";
import { ProductRowActions } from "@/components/dashboard/product-row-actions";

export default async function ProductsPage() {
  const { shop } = await requireSeller();
  const products = await listShopProducts(shop.id);
  const LOW_STOCK = 3;
  const outCount = products.filter((p) => p.stock === 0).length;
  const lowCount = products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Products</h1>
          <p className="text-sm text-muted">{products.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/products/import"
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:border-primary"
          >
            Import CSV
          </Link>
          <Link
            href="/dashboard/products/new"
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Add product
          </Link>
        </div>
      </div>

      {(outCount > 0 || lowCount > 0) && (
        <div className="rounded-xl border border-[#F0E2C4] bg-[#FBF7EC] px-4 py-3 text-sm text-[#7a5a16]">
          {outCount > 0 && (
            <span>
              {outCount} {outCount === 1 ? "product is" : "products are"} out of stock.{" "}
            </span>
          )}
          {lowCount > 0 && (
            <span>
              {lowCount} {lowCount === 1 ? "product is" : "products are"} running low.
            </span>
          )}
        </div>
      )}

      {products.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-sm text-muted">No products yet.</p>
          <Link
            href="/dashboard/products/new"
            className="mt-3 inline-flex rounded-xl border border-primary px-4 py-2 text-sm font-medium text-primary"
          >
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Product</th>
                <th className="px-4 py-2.5 font-medium">Price</th>
                <th className="px-4 py-2.5 font-medium">Stock</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/products/${p.id}/edit`}
                      className="font-medium text-ink hover:text-primary"
                    >
                      {p.name}
                    </Link>
                    {p.category ? <p className="text-xs text-muted">{p.category}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-ink">{formatCurrency(p.price, shop.currency)}</td>
                  <td className="px-4 py-3">
                    {p.stock === 0 ? (
                      <span className="rounded-full bg-[#FBECEA] px-2 py-0.5 text-xs font-medium text-[#C0362C]">
                        Out of stock
                      </span>
                    ) : p.stock <= LOW_STOCK ? (
                      <span className="rounded-full bg-[#FBF1DD] px-2 py-0.5 text-xs font-medium text-[#9A6A12]">
                        {p.stock} left
                      </span>
                    ) : (
                      <span className="text-ink">{p.stock}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.isActive ? (
                      <span className="rounded-full bg-[#E7F2EC] px-2 py-0.5 text-xs font-medium text-[#2C6B57]">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#ECEFEE] px-2 py-0.5 text-xs font-medium text-[#6E7A75]">
                        Hidden
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <ShareCardButton
                        product={{ id: p.id, name: p.name, price: p.price, image: p.imageUrls[0] ?? null }}
                        shopName={shop.name}
                        shopSlug={shop.slug}
                        accent={shop.themeColor ?? "#43705F"}
                        currency={shop.currency}
                      />
                      <Link
                        href={`/dashboard/products/${p.id}/edit`}
                        className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink hover:bg-[#eef3f0]"
                      >
                        Edit
                      </Link>
                      <ProductRowActions productId={p.id} isActive={p.isActive} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
