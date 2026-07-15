"use client";

import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { deleteAccountAction, type DeleteState } from "@/server/actions/account-actions";

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-[#C0362C] px-3 py-2 text-sm font-medium text-[#C0362C] transition hover:bg-[#FBECEA] disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete my account"}
    </button>
  );
}

export function DangerZone({ slug }: { slug: string }) {
  const [state, action] = useActionState<DeleteState, FormData>(deleteAccountAction, {});
  return (
    <div className="mt-8 rounded-2xl border border-[#E7B8B2] bg-[#FDF6F5] p-5">
      <p className="text-sm font-semibold text-[#8a2c22]">Delete account</p>
      <p className="mt-1 text-sm text-[#8a2c22]">
        This permanently deletes your shop <b>/{slug}</b> and all its products, orders, and data.
        This cannot be undone.
      </p>
      <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
        <input
          name="confirm"
          placeholder={`Type "${slug}" to confirm`}
          className="rounded-lg border border-line px-3 py-2 text-sm"
          autoComplete="off"
        />
        <DeleteButton />
      </form>
      {state.error && <p className="mt-2 text-xs text-[#C0362C]">{state.error}</p>}
    </div>
  );
}
