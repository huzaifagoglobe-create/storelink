import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSeller } from "@/server/auth/current-seller";
import { getCurrentAdmin } from "@/server/auth/current-admin";
import { LoginForm } from "@/components/dashboard/login-form";
import { isSupabaseConfigured } from "@/server/supabase/server";
import { AuthAside } from "@/components/dashboard/auth-aside";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");
  if (await getCurrentSeller()) redirect("/dashboard");
  return (
    <main className="min-h-screen bg-background md:grid md:grid-cols-[1.05fr_1fr] lg:grid-cols-[1.1fr_1fr]">
      <AuthAside
        heading="Welcome back."
        sub="Manage your products, track orders, and message customers — all from one place."
        points={[
          "See new orders the moment they arrive",
          "Update products and stock in seconds",
          "Message any customer on WhatsApp",
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
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Manage your shop, products and orders.</p>

          <div className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
            <LoginForm />
          </div>

          <p className="mt-4 text-center text-sm text-muted">
            New here?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">Create your shop</Link>
          </p>

          {/* Demo accounts only exist in demo mode (no database configured).
              Once a real database is connected they do not exist at all, so
              showing them would hand every visitor a set of admin-looking
              credentials and advertise the admin panel for nothing. */}
          {!isSupabaseConfigured() && (
            <div className="mt-6 rounded-xl bg-[#EAF3EE] p-3 text-xs">
              <p className="font-medium text-ink">Demo logins</p>
              <p className="mt-0.5 text-muted">Seller — demo@shop.pk · PIN 1234</p>
              <p className="mt-0.5 text-muted">Admin — admin@shop.pk · PIN 4321</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
