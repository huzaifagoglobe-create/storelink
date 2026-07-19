"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/revenue", label: "Revenue" },
  { href: "/admin/growth", label: "Growth" },
  { href: "/admin/radar", label: "Radar" },
  { href: "/admin/shops", label: "Shops" },
  { href: "/admin/verifications", label: "Verifications" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/promos", label: "Promos" },
  { href: "/admin/stories", label: "Stories" },
  { href: "/admin/announcements", label: "Announcements" },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    // 11 links do not fit on a phone. Instead of letting them push the whole
    // admin page sideways, the row scrolls on its own. The negative margin +
    // padding lets the strip bleed to the screen edges so it looks intentional
    // rather than clipped, and the scrollbar is hidden (it is swiped, not
    // dragged, on the devices where this matters).
    <nav
      className="-mx-4 flex gap-1 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Admin sections"
    >
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={isActive(l.href) ? "page" : undefined}
          className={
            "shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition " +
            (isActive(l.href)
              ? "bg-white text-ink"
              : "text-[#9DB0A8] hover:bg-[#2c3833] hover:text-white")
          }
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
