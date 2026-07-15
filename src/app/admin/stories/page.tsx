import Link from "next/link";
import { requireAdmin } from "@/server/auth/current-admin";
import { listStories } from "@/server/services/growth-services";
import { createStoryAction, toggleStoryAction } from "@/server/actions/admin-actions";

/** Seller success stories: proof that sells, SEO that ranks, and the featured
 *  seller shares their own page everywhere. Write in plain paragraphs. */
export default async function AdminStoriesPage() {
  await requireAdmin();
  const stories = await listStories(false);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Seller stories</h1>
        <p className="text-sm text-muted">
          Published at <Link href="/stories" className="text-primary hover:underline">/stories</Link>. Plain paragraphs
          (blank line = new paragraph). Real numbers make the story.
        </p>
      </div>
      <form action={createStoryAction} className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <input name="title" className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary" placeholder='Title — e.g. "How Ayesha went from DMs to 200 orders a month"' required />
        <input name="sellerName" className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary" placeholder="Seller / shop name" required />
        <textarea name="body" rows={8} className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary" placeholder="The story. Where they started, what changed, real numbers. Blank line between paragraphs." required />
        <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Publish story</button>
      </form>
      {stories.length > 0 && (
        <ul className="space-y-2">
          {stories.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
              <div className="min-w-0">
                <Link href={`/stories/${s.slug}`} className={"truncate text-sm font-medium hover:text-primary " + (s.isPublished ? "text-ink" : "text-muted line-through")}>
                  {s.title}
                </Link>
                <p className="text-[11px] text-muted">{s.sellerName}</p>
              </div>
              <form action={toggleStoryAction}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="published" value={s.isPublished ? "false" : "true"} />
                <button type="submit" className="flex-none rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-primary">
                  {s.isPublished ? "Unpublish" : "Publish"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
