"use client";

import { useActionState } from "react";
import { createCategoryAction, type CategoryState } from "@/server/actions/category-actions";
import { inputClass, FormError } from "./field";
import { SubmitButton } from "./submit-button";

export function CategoryCreateForm() {
  const [state, action] = useActionState<CategoryState, FormData>(createCategoryAction, {});
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <input name="name" className={inputClass} placeholder="e.g. Dresses" aria-label="New category name" />
        <FormError message={state.error} />
      </div>
      <SubmitButton pendingText="Adding…">Add category</SubmitButton>
    </form>
  );
}
