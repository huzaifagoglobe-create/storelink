"use client";

/** Small client button that opens the browser's print dialog. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
    >
      🖨️ Print
    </button>
  );
}
