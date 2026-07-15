import Link from "next/link";

/**
 * Mock hosted-payment page for the sandbox gateway. Stands in for a real
 * provider's checkout so the online-payment flow is testable end to end. The
 * buyer taps Pay or Cancel; both bounce back to /api/pay/callback with the
 * result and the gateway reference. A real gateway replaces this entirely.
 */
export default async function SandboxPayPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; amount?: string; return?: string }>;
}) {
  const sp = await searchParams;
  const ref = sp.ref ?? "";
  const amount = sp.amount ?? "0";
  const ret = sp.return ?? "/";
  const success = `${ret}?result=success&ref=${encodeURIComponent(ref)}`;
  const cancel = `${ret}?result=cancel&ref=${encodeURIComponent(ref)}`;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-md bg-[#eef3f0] px-2 py-1 text-[11px] font-semibold text-muted">TEST GATEWAY</span>
        </div>
        <h1 className="text-lg font-semibold text-ink">Confirm your payment</h1>
        <p className="mt-1 text-sm text-muted">
          This is a sandbox payment screen for testing. No real money moves. In production this is your payment
          provider&apos;s secure page.
        </p>

        <div className="mt-5 rounded-xl bg-[#f3f5f2] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Amount</span>
            <span className="font-semibold text-ink">Rs {Number(amount).toLocaleString()}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-muted">Reference</span>
            <span className="font-mono text-muted">{ref}</span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Link
            href={success}
            className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground"
          >
            Pay Rs {Number(amount).toLocaleString()}
          </Link>
          <Link
            href={cancel}
            className="rounded-xl border border-line px-4 py-3 text-center text-sm font-medium text-ink"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
