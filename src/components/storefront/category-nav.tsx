import Link from "next/link";
import type { Category } from "@/server/types";

export function CategoryNav({
  shopSlug,
  categories,
  activeSlug,
}: {
  shopSlug: string;
  categories: Category[];
  activeSlug?: string;
}) {
  if (categories.length === 0) return null;
  const base = "whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition";
  const on = "border-primary bg-primary text-primary-foreground";
  const off = "border-line bg-surface text-muted hover:text-ink";
  return (
    <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <Link href={`/${shopSlug}`} className={`${base} ${!activeSlug ? on : off}`}>
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/${shopSlug}/category/${c.slug}`}
          className={`${base} ${activeSlug === c.slug ? on : off}`}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
