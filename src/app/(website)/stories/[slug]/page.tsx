import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStory } from "@/server/services/growth-services";

export const revalidate = 600;

export async function generateMetadata({ params: _p }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await _p;
  const s = await getStory(slug);
  if (!s) return {};
  return { title: `${s.title} — StoreLink seller stories`, description: s.body.slice(0, 155) };
}

export default async function StoryPage({ params: _p }: { params: Promise<{ slug: string }> }) {
  const { slug } = await _p;
  const s = await getStory(slug);
  if (!s) notFound();
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/stories" className="text-xs text-muted hover:text-primary">← All stories</Link>
      <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">{s.title}</h1>
      <p className="mt-2 text-sm text-muted">
        {s.sellerName} · {new Date(s.createdAt).toLocaleDateString("en-PK", { month: "long", year: "numeric" })}
      </p>
      <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-ink">
        {s.body.split(/\n\s*\n/).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="mt-12 rounded-2xl border border-line bg-surface p-6 text-center">
        <p className="text-base font-semibold text-ink">Your story could be next</p>
        <p className="mt-1 text-sm text-muted">Free to start, Cash on Delivery ready, your shop live in minutes.</p>
        <Link href="/signup?src=story" className="mt-4 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
          Start your shop free →
        </Link>
      </div>
    </article>
  );
}
