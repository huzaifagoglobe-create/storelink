import Link from "next/link";
import type { Metadata } from "next";
import { listStories } from "@/server/services/growth-services";

export const metadata: Metadata = {
  title: "Seller stories — real Pakistani sellers on StoreLink",
  description: "How real sellers went from Instagram DMs to running proper online shops. Real names, real numbers.",
};
export const revalidate = 600;

export default async function StoriesPage() {
  const stories = await listStories(true);
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">Seller stories</h1>
      <p className="mt-1 text-sm text-muted">Real sellers, real numbers — how they did it.</p>
      {stories.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Stories coming soon — we&apos;re writing up our first sellers now.
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {stories.map((s) => (
            <Link key={s.id} href={`/stories/${s.slug}`} className="block rounded-2xl border border-line bg-surface p-5 transition hover:border-primary">
              <p className="text-base font-semibold text-ink">{s.title}</p>
              <p className="mt-1 text-xs text-muted">
                {s.sellerName} · {new Date(s.createdAt).toLocaleDateString("en-PK", { month: "long", year: "numeric" })}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-muted">{s.body.slice(0, 180)}…</p>
            </Link>
          ))}
        </div>
      )}
      <p className="mt-10 text-center text-sm text-muted">
        Want to be a story? <Link href="/signup?src=stories" className="font-medium text-primary hover:underline">Start your shop free →</Link>
      </p>
    </div>
  );
}
