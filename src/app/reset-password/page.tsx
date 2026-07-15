import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSeller } from "@/server/auth/current-seller";
import { getCurrentAdmin } from "@/server/auth/current-admin";
import { peekPasswordReset } from "@/server/services/password-reset-service";
import { ResetPasswordForm } from "@/components/dashboard/reset-password-form";
import { AuthAside } from "@/components/dashboard/auth-aside";

export const metadata = { title: "Set a new PIN" };

export default async function ResetPasswordPage({
  searchParams: _sp,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  if (await getCurrentAdmin()) redirect("/admin");
  if (await getCurrentSeller()) redirect("/dashboard");
  const searchParams = await _sp;
  const token = typeof searchParams.token === "string" ? searchParams.token : "";
  const valid = token ? await peekPasswordReset(token) : false;

  return (
    <main className="min-h-screen bg-background md:grid md:grid-cols-[1.05fr_1fr] lg:grid-cols-[1.1fr_1fr]">
      <AuthAside
        heading="Almost there."
        sub="Choose a new PIN for your shop account and you’re back in."
        points={["Pick something you’ll remember", "4–6 digits", "Then sign in as usual"]}
      />
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Set a new PIN</h1>
          {valid ? (
            <>
              <p className="mt-1 text-sm text-muted">Enter a new 4–6 digit PIN you’ll remember.</p>
              <div className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
                <ResetPasswordForm token={token} />
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
              <p className="text-sm font-medium text-ink">This link is invalid or has expired.</p>
              <p className="mt-1 text-sm text-muted">
                Reset links last 30 minutes and can be used once. Please request a new one.
              </p>
              <Link
                href="/forgot-password"
                className="mt-4 inline-flex rounded-xl border border-primary px-4 py-2.5 text-sm font-medium text-primary"
              >
                Request a new link
              </Link>
            </div>
          )}
          <p className="mt-4 text-center text-sm text-muted">
            <Link href="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
