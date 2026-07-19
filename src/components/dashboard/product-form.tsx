"use client";


import { useState, useActionState } from "react";
import { Field, inputClass, FormError } from "./field";
import { SubmitButton } from "./submit-button";
import { ImageUploader } from "./image-uploader";
import { ProductOptionsEditor } from "./product-options-editor";
import type { Product } from "@/server/types";
import type { ProductState } from "@/server/actions/product-actions";

type Action = (prev: ProductState, fd: FormData) => Promise<ProductState>;

export function ProductForm({
  action,
  product,
  submitLabel,
  categories,
  products,
  shopSlug,
}: {
  action: Action;
  product?: Product;
  submitLabel: string;
  categories: { name: string; slug: string }[];
  products: { id: string; name: string }[];
  shopSlug: string;
}) {
  const [state, formAction] = useActionState<ProductState, FormData>(action, {});
  const [description, setDescription] = useState(product?.description ?? "");
  const [longDescription, setLongDescription] = useState(product?.longDescription ?? "");
  // Collapsed by default: most sellers only want the short pitch, and an empty
  // giant box makes the form look like homework.
  const [showLong, setShowLong] = useState(Boolean(product?.longDescription));
  const [rewriting, setRewriting] = useState(false);
  const [rewriteMsg, setRewriteMsg] = useState<string | null>(null);
  const currentCategory = product?.category ?? "";

  async function handleRewrite() {
    setRewriteMsg(null);
    setRewriting(true);
    try {
      const nameEl = document.getElementById("name") as HTMLInputElement | null;
      const res = await fetch("/api/products/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameEl?.value ?? product?.name ?? "",
          description,
          category: currentCategory || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not rewrite.");
      setDescription(data.description as string);
      setRewriteMsg("Rewritten ✓ — review it and edit anything before saving.");
    } catch (e) {
      setRewriteMsg(e instanceof Error ? e.message : "Could not rewrite right now.");
    } finally {
      setRewriting(false);
    }
  }

  const categoryNames = categories.map((c) => c.name);
  const categoryOptions =
    currentCategory && !categoryNames.includes(currentCategory)
      ? [currentCategory, ...categoryNames]
      : categoryNames;
  return (
    <form action={formAction} className="space-y-4">
      {product ? <input type="hidden" name="productId" value={product.id} /> : null}
      <FormError message={state.error} />

      <Field label="Product name" htmlFor="name">
        <input
          id="name"
          name="name"
          defaultValue={product?.name ?? ""}
          className={inputClass}
          placeholder="e.g. Lawn Suit (3pc)"
        />
      </Field>

      <Field label="Photos" hint="Buyers see these on your storefront.">
        <ImageUploader initial={product?.imageUrls ?? []} />
      </Field>

      <Field label="Description" htmlFor="description" hint="Optional">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-xs text-muted">Make it yours so it stands out on Google.</span>
          <button
            type="button"
            onClick={handleRewrite}
            disabled={rewriting}
            className="rounded-lg border border-primary px-2.5 py-1 text-xs font-medium text-primary transition hover:bg-[#F3F8F5] disabled:opacity-50"
          >
            {rewriting ? "Rewriting…" : "✨ Make it unique"}
          </button>
        </div>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={6000}
          className={inputClass}
          placeholder="Describe your product — sizes, fabric, fit, colours, care instructions…"
        />
        {rewriteMsg && <p className="mt-1 text-xs text-primary">{rewriteMsg}</p>}
      </Field>

      {/* Optional long write-up. Kept out of the way until asked for. */}
      <div className="rounded-xl border border-line bg-[#f7f9f7] p-3">
        {!showLong ? (
          <button
            type="button"
            onClick={() => setShowLong(true)}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <span>
              <span className="block text-sm font-medium text-ink">+ Add a longer description</span>
              <span className="mt-0.5 block text-xs text-muted">
                Optional. More words on the page = more chances Google shows your product.
              </span>
            </span>
            <span className="text-muted">▾</span>
          </button>
        ) : (
          <>
            <div className="mb-1.5 flex items-start justify-between gap-2">
              <span>
                <span className="block text-sm font-medium text-ink">Longer description (optional)</span>
                <span className="mt-0.5 block text-xs text-muted">
                  Shows in its own tab on your product page. Write like you&apos;re talking to a customer:
                  the fabric, the fit, how to wash it, why you love it. Google reads this.
                </span>
              </span>
              <button
                type="button"
                onClick={() => setShowLong(false)}
                className="flex-none text-xs font-medium text-muted hover:text-ink"
              >
                Hide
              </button>
            </div>
            <textarea
              id="longDescription"
              name="longDescription"
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              rows={8}
              maxLength={20000}
              className={inputClass}
              placeholder={"Tell the full story…\n\nFabric: premium lawn, soft and breathable.\nFit: unstitched, 3 pieces.\nCare: hand wash cold, dry in shade.\nWhy we love it: the print is block-printed by hand in Multan."}
            />
            <p className="mt-1 text-xs text-muted">{longDescription.length.toLocaleString()} / 20,000 characters</p>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (Rs)" htmlFor="price">
          <input
            id="price"
            name="price"
            inputMode="numeric"
            defaultValue={product ? String(product.price) : ""}
            className={inputClass}
            placeholder="4500"
          />
        </Field>
        <Field label="Compare-at (Rs)" htmlFor="compareAtPrice" hint="Optional old price">
          <input
            id="compareAtPrice"
            name="compareAtPrice"
            inputMode="numeric"
            defaultValue={product?.compareAtPrice != null ? String(product.compareAtPrice) : ""}
            className={inputClass}
            placeholder="5500"
          />
        </Field>
        <Field label="Cost price (Rs)" htmlFor="costPrice" hint="Private — powers your profit report">
          <input
            id="costPrice"
            name="costPrice"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.costPrice != null ? String(product.costPrice) : ""}
            className={inputClass}
            placeholder="What this item costs you"
          />
        </Field>
      </div>

      <Field
        label="Video link (optional)"
        htmlFor="videoUrl"
        hint="Paste a YouTube, TikTok or Instagram reel of this product. YouTube plays right on the page; TikTok/Instagram open in a new tab."
      >
        <input
          id="videoUrl"
          name="videoUrl"
          type="url"
          defaultValue={product?.videoUrl ?? ""}
          className={inputClass}
          placeholder="https://youtube.com/… or https://tiktok.com/…"
        />
      </Field>

      <Field
        label="Size chart (optional)"
        htmlFor="sizeChart"
        hint="One image of your size/measurement table — buyers see a 'Size chart' button on the product page. Kills the #1 question before ordering."
      >
        <ImageUploader name="sizeChartUrl" initial={product?.sizeChartUrl ? [product.sizeChartUrl] : []} max={1} />
      </Field>

      <Field
        label="Schedule a drop (optional)"
        htmlFor="dropAt"
        hint="Pick a date & time and this product shows as 'Dropping soon' with a countdown — buyers can tap 'Notify me' and nobody can order it early. Leave empty to sell right away."
      >
        <input
          id="dropAt"
          name="dropAt"
          type="datetime-local"
          defaultValue={product?.dropAt ? new Date(product.dropAt).toISOString().slice(0, 16) : ""}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Stock — how many do you have?" htmlFor="stock" hint="At 0 buyers see 'out of stock' automatically; under 10 they see 'only X left'">
          <input
            id="stock"
            name="stock"
            inputMode="numeric"
            defaultValue={product ? String(product.stock) : "0"}
            className={inputClass}
            placeholder="10"
          />
        </Field>
        <Field label="Category" htmlFor="category" hint="Optional">
          {categoryOptions.length > 0 ? (
            <select
              id="category"
              name="category"
              defaultValue={currentCategory}
              className={inputClass}
            >
              <option value="">No category</option>
              {categoryOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="category"
              name="category"
              defaultValue={currentCategory}
              className={inputClass}
              placeholder="Add categories in the Categories tab"
            />
          )}
        </Field>
      </div>

      <Field label="Highlight" htmlFor="tag" hint="Show a badge on this product (optional)">
        <select
          id="tag"
          name="tag"
          defaultValue={product?.tag ?? ""}
          className={inputClass}
        >
          <option value="">None</option>
          <option value="hot">Hot</option>
          <option value="bestseller">Best seller</option>
          <option value="new">New</option>
        </select>
      </Field>

      <Field label="Options & variants" htmlFor="options" hint="Optional — e.g. Size: S, M, L. You can set stock per variant.">
        <ProductOptionsEditor initial={product?.options ?? []} initialVariantStock={product?.variantStock ?? null} />
      </Field>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={product ? product.isActive : true}
          className="h-4 w-4 rounded border-line"
        />
        Active (visible in your shop)
      </label>

      <SubmitButton className="w-full" pendingText="Saving…">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
