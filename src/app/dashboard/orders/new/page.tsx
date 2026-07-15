import { requireSeller } from "@/server/auth/current-seller";
import { getProductsByShop } from "@/server/services/product-service";
import { PasteOrderClient } from "@/components/dashboard/paste-order-client";

export default async function NewManualOrderPage() {
  const { shop } = await requireSeller();
  const products = (await getProductsByShop(shop.id))
    .filter((p) => p.isActive && p.stock > 0 && (!p.dropAt || new Date(p.dropAt).getTime() <= Date.now()))
    .map((p) => ({ id: p.id, name: p.name, price: p.price, stock: p.stock }));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Add a WhatsApp order</h1>
        <p className="text-sm text-muted">
          Got the order in DMs? Paste the message — we read the details, you confirm, done in 10 seconds.
        </p>
      </div>
      <PasteOrderClient products={products} />
    </div>
  );
}
