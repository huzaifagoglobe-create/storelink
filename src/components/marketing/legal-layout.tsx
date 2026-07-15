import Link from "next/link";

export type LegalSection = { h: string; p?: string[]; ul?: string[] };

export function LegalSections({ sections }: { sections: LegalSection[] }) {
  return (
    <>
      {sections.map((s, i) => (
        <section key={i}>
          <h2>{s.h}</h2>
          {s.p?.map((t, j) => (
            <p key={j}>{t}</p>
          ))}
          {s.ul && (
            <ul>
              {s.ul.map((t, j) => (
                <li key={j}>{t}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </span>
            <span>StoreLink</span>
          </Link>
          <Link href="/" className="text-sm text-muted hover:text-ink">← Back to home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 text-xs text-muted">Last updated: {updated}</p>
        <div className="legal mt-6">{children}</div>
        <div className="mt-12 flex gap-4 border-t border-line pt-6 text-xs text-muted">
          <Link href="/privacy" className="hover:text-ink">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-ink">Terms &amp; Conditions</Link>
        </div>
      </main>
    </div>
  );
}
