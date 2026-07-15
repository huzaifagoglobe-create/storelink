"use client";

import {
  deleteProductAction,
  toggleProductActiveAction,
} from "@/server/actions/product-actions";

export function ProductRowActions({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <form action={toggleProductActiveAction}>
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="next" value={isActive ? "false" : "true"} />
        <button
          type="submit"
          className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink hover:bg-[#eef3f0]"
        >
          {isActive ? "Hide" : "Show"}
        </button>
      </form>
      <form
        action={deleteProductAction}
        onSubmit={(e) => {
          if (!window.confirm("Delete this product? This cannot be undone.")) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="productId" value={productId} />
        <button
          type="submit"
          className="rounded-lg border border-line px-2.5 py-1 text-xs text-[#8f231b] hover:bg-[#FBEAE8]"
        >
          Delete
        </button>
      </form>
    </div>
  );
}
