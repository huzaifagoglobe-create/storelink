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
    <nav className="flex gap-1">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={
            "rounded-lg px-3 py-2 text-sm font-medium transition " +
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
