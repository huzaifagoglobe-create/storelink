"use client";

import { useActionState } from "react";
import { resetSellerPinAction, type PinResetState } from "@/server/actions/admin-actions";

/** Support tool: one tap → new 6-digit PIN for the shop owner, shown ONCE. */
export function PinReset({ shopId, whatsapp, shopName }: { shopId: string; whatsapp: string; shopName: string }) {
  const [state, action] = useActionState<PinResetState, FormData>(resetSellerPinAction, {});
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-sm font-medium text-ink">Support: reset owner&apos;s PIN</p>
      <p className="mt-1 text-xs text-muted">
        For &quot;I forgot my PIN&quot; requests. Generates a new PIN and logs them out everywhere — send it to them on
        WhatsApp. It shows only once.
      </p>
      {state.error && <p className="mt-2 text-xs text-[#C0362C]">{state.error}</p>}
      {state.ok && state.newPin ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <code className="rounded-lg bg-[#f3f5f2] px-4 py-2 text-lg font-bold tracking-widest text-ink">{state.newPin}</code>
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Assalam o Alaikum! It's StoreLink support. Your new login PIN for "${shopName}" is: ${state.newPin}\nLog in at storelink.pk/login — you can change it any time in Settings. 💚`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-whatsapp px-3 py-2 text-xs font-medium text-whatsapp-foreground"
          >
            💬 Send it to them
          </a>
        </div>
      ) : (
        <form action={action} className="mt-3">
          <input type="hidden" name="shopId" value={shopId} />
          <button type="submit" className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-primary">
            Generate new PIN
          </button>
        </form>
      )}
    </div>
  );
}
