"use client";

import { useActionState } from "react";
import { importProductsAction, type ImportState } from "@/server/actions/product-import-actions";
import { SubmitButton } from "./submit-button";
import { FormError, FormSuccess } from "./field";

const TEMPLATE =
  "name,price,stock,category,description\nLawn Suit,4500,10,Dresses,Soft cotton 3-piece\nEmbroidered Kurti,2200,5,Tops,";

export function ProductImportForm() {
  const [state, action] = useActionState<ImportState, FormData>(importProductsAction, {});
  const templateHref = "data:text/csv;charset=utf-8," + encodeURIComponent(TEMPLATE);
  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      {state.ok && <FormSuccess message={state.message ?? "Import complete."} />}
      <div>
        <label className="mb-1 block text-xs text-muted">CSV file</label>
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          className="block w-full text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
        />
      </div>
      <p className="text-xs text-muted">
        Columns: <span className="font-medium text-ink">name, price, stock, category, description</span>.
        Only name and price are required.{" "}
        <a href={templateHref} download="products-template.csv" className="text-primary underline">
          Download template
        </a>
      </p>
      <SubmitButton pendingText="Importing…">Import products</SubmitButton>
    </form>
  );
}
