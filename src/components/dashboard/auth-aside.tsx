import Link from "next/link";

function BagIcon({ size = 17 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export function AuthAside({
  heading,
  sub,
  points,
}: {
  heading: string;
  sub: string;
  points: string[];
}) {
  return (
    <aside className="relative hidden overflow-hidden bg-primary px-10 py-12 text-primary-foreground md:flex md:flex-col md:justify-between">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

      <Link href="/" className="relative flex items-center gap-2 text-lg font-semibold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
          <BagIcon />
        </span>
        StoreLink
      </Link>

      <div className="relative max-w-sm">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight">{heading}</h2>
        <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80">{sub}</p>
        <ul className="mt-7 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-sm">
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white/15">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span className="text-primary-foreground/90">{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-primary-foreground/70">
        Free to start · No commission on your sales
      </p>
    </aside>
  );
}
