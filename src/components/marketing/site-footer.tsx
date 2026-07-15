import Link from "next/link";
import Image from "next/image";

const COLS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "All features" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/demo", label: "Live demo" },
      { href: "/compare", label: "Compare vs others" },
      { href: "/stats", label: "Live platform stats" },
    ],
  },
  {
    title: "For buyers",
    links: [
      { href: "/bazaar", label: "Browse the Bazaar" },
      { href: "/orders", label: "Track my orders" },
      { href: "/verify/zara", label: "Verify a shop" },
    ],
  },
  {
    title: "Free resources",
    links: [
      { href: "/learn", label: "Learn to sell" },
      { href: "/learn/start-selling-online-pakistan", label: "Start selling guide" },
      { href: "/learn/reduce-cod-parcel-refusals", label: "Reduce COD refusals" },
      { href: "/tools/cod-calculator", label: "COD loss calculator" },
      { href: "/tools/caption-generator", label: "Caption generator" },
      { href: "/stories", label: "Seller stories" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "FAQ" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

/** Mega footer: the whole website reachable from every page. */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-[#0B1F17] text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-6">
          <div className="md:col-span-2">
            <Image src="/logo.svg" alt="StoreLink" width={158} height={34} className="brightness-0 invert" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
              The all-in-one shop platform for Pakistani sellers. COD-first, phone-first, honest.
            </p>
            <Link
              href="/signup"
              className="mt-5 inline-block rounded-xl bg-[#2EAF7D] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Start your shop free →
            </Link>
          </div>
          {COLS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className="text-sm font-semibold text-white/90">{c.title}</p>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-white/55 transition hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row">
          <p>© {new Date().getFullYear()} StoreLink · Made with 💚 in Pakistan</p>
          <p>Free to start · Cash on Delivery ready · Your data stays yours</p>
        </div>
      </div>
    </footer>
  );
}
