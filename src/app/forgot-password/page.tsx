import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSeller } from "@/server/auth/current-seller";
import { getCurrentAdmin } from "@/server/auth/current-admin";
import { ForgotPasswordForm } from "@/components/dashboard/forgot-password-form";
import { AuthAside } from "@/components/dashboard/auth-aside";

export const metadata = { title: "Forgot PIN" };

export default async function ForgotPasswordPage() {
  if (await getCurrentAdmin()) redirect("/admin");
  if (await getCurrentSeller()) redirect("/dashboard");
  return (
    <main className="min-h-screen bg-background md:grid md:grid-cols-[1.05fr_1fr] lg:grid-cols-[1.1fr_1fr]">
      <AuthAside
        heading="Forgot your PIN?"
        sub="No problem. Enter your email and we’ll send you a link to set a new one."
        points={["Reset link valid for 30 minutes", "Your shop and orders stay safe", "Back to selling in minutes"]}
      />
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Reset your PIN</h1>
          <p className="mt-1 text-sm text-muted">We’ll email you a secure link to set a new PIN.</p>
          <div className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
            <ForgotPasswordForm />
          </div>
          <p className="mt-4 text-center text-sm text-muted">
            Remembered it?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
