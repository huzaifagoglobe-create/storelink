import Link from "next/link";
import { readEmailToken, } from "@/server/auth/email-verify";
import { setEmailVerified } from "@/server/auth/user-service";

export const metadata = { title: "Verify email" };

export default async function VerifyEmailPage({
  searchParams: _sp,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const searchParams = await _sp;
  const uid = readEmailToken(searchParams.token ?? "");
  if (uid) await setEmailVerified(uid);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className={"flex h-14 w-14 items-center justify-center rounded-full " + (uid ? "bg-[#E1ECE6] text-primary" : "bg-[#FBECEA] text-[#8a2c22]")}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {uid ? <path d="M20 6 9 17l-5-5" /> : <path d="M18 6 6 18M6 6l12 12" />}
        </svg>
      </div>
      <h1 className="mt-3 text-lg font-semibold text-ink">
        {uid ? "Email verified" : "Link expired or invalid"}
      </h1>
      <p className="mt-1 max-w-sm text-sm text-muted">
        {uid
          ? "Thanks — your email is confirmed."
          : "This verification link is invalid or has expired. You can resend it from your dashboard."}
      </p>
      <Link href="/dashboard" className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">
        Go to dashboard
      </Link>
    </main>
  );
}
