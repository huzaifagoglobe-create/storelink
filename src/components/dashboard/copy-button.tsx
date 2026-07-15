"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="flex-none rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink transition hover:border-primary"
    >
      {ok ? "Copied ✓" : "Copy"}
    </button>
  );
}
