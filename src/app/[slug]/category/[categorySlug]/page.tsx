import { notFound } from "next/navigation";
import { getShopBySlug } from "@/server/services/shop-service";
import { getProductsByShop } from "@/server/services/product-service";
import { listCategories, getCategoryBySlug } from "@/server/services/category-service";
import { listReviewsForShop, summarizeByProduct } from "@/server/services/review-service";
import { ProductCard } from "@/components/storefront/product-card";
import { CategoryNav } from "@/components/storefront/category-nav";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getTemplate, headingFontClass } from "@/server/storefront-templates";

export default async function CategoryPage({
  params: _p,
}: {
  params: Promise<{ slug: string; categorySlug: string }>;
}) {
  const params = await _p;
  const shop = await getShopBySlug(params.slug);
  if (!shop) notFound();
  const category = await getCategoryBySlug(shop.id, params.categorySlug);
  if (!category) notFound();

  const [all, categories, reviews] = await Promise.all([
    getProductsByShop(shop.id),
    listCategories(shop.id),
    listReviewsForShop(shop.id),
  ]);
  const ratings = summarizeByProduct(reviews);
  const products = all.filter((p) => p.category === category.name);
  const config = getTemplate(shop.template);

  return (
    <div className="space-y-4">
      <CategoryNav shopSlug={shop.slug} categories={categories} activeSlug={category.slug} />
      <h1 className={"text-base font-semibold text-ink " + headingFontClass(config.headingFont)}>
        {category.name}
      </h1>
      {products.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">No products in this category yet.</p>
      ) : (
        <ProductGrid
          cards={products.map((product) => (
            <ProductCard key={product.id} shop={shop} product={product} rating={ratings.get(product.id)} config={config} />
          ))}
          layout={config.grid === "list" ? "list" : config.grid === "g2gap" ? "g2gap" : "g2"}
        />
      )}
    </div>
  );
}
