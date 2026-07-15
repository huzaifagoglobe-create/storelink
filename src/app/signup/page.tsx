import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSeller } from "@/server/auth/current-seller";
import { SignupForm } from "@/components/dashboard/signup-form";
import { AuthAside } from "@/components/dashboard/auth-aside";

export const metadata = { title: "Create your shop" };

export default async function SignupPage() {
  if (await getCurrentSeller()) redirect("/dashboard");
  return (
    <main className="min-h-screen bg-background md:grid md:grid-cols-[1.05fr_1fr] lg:grid-cols-[1.1fr_1fr]">
      <AuthAside
        heading="Your own online shop — no website needed."
        sub="Set it up in under a minute. Pick your link, add your products, and start taking orders today."
        points={[
          "A branded link customers can browse",
          "Cash on Delivery built in",
          "Every order straight to your WhatsApp",
        ]}
      />
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 font-semibold text-ink md:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </span>
            StoreLink
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Create your shop</h1>
          <p className="mt-1 text-sm text-muted">It&apos;s free to start — no card needed.</p>

          <div className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
            <SignupForm />
          </div>

          <p className="mt-4 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
