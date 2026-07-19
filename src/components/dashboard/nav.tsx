"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Overview", d: "M3 9 12 2l9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" },
  { href: "/dashboard/products", label: "Products", d: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" },
  { href: "/dashboard/categories", label: "Categories", d: "M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82ZM7 7h.01" },
  { href: "/dashboard/discounts", label: "Discounts", d: "M9 14l6-6M9.5 9h.01M14.5 14h.01M5 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4Z" },
  { href: "/dashboard/resellers", label: "Resellers", d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { href: "/dashboard/pages", label: "Pages", d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5" },
  { href: "/dashboard/storefront", label: "Storefront", d: "M3 9l1.5-5h15L21 9M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M3 9h18M9 20v-6h6v6" },
  { href: "/dashboard/orders", label: "Orders", d: "M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" },
  { href: "/dashboard/abandoned", label: "Abandoned carts", d: "M6 6h15l-1.5 9h-12zM6 6 5 2H2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2" },
  { href: "/dashboard/customers", label: "Customers", d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { href: "/dashboard/khata", label: "Khata", d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM9 7h6M9 11h6" },
  { href: "/dashboard/reports", label: "Reports", d: "M3 21h18M7 21V10M12 21V3M17 21v-7" },
  { href: "/dashboard/analytics", label: "Analytics", d: "M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.8L7 14.2" },
  { href: "/dashboard/audience", label: "Audience", d: "M17 21v-2a4 4 0 0 0-3-3.87M9 3.13a4 4 0 0 1 0 7.75M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M7 21v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2" },
  { href: "/dashboard/reviews", label: "Reviews", d: "M11.05 3.69c.32-.66 1.58-.66 1.9 0l2.1 4.26 4.7.68c.74.1 1.04 1 .5 1.52l-3.4 3.32.8 4.68c.13.74-.65 1.3-1.3.95L12 17.6l-4.2 2.2c-.66.35-1.44-.21-1.3-.95l.8-4.68-3.4-3.32c-.54-.52-.24-1.42.5-1.52l4.7-.68Z" },
  { href: "/dashboard/team", label: "Team", d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 11h-6M19 8v6", ownerOnly: true },
  { href: "/dashboard/plan", label: "Plan", d: "M12 19V5M5 12l7-7 7 7", ownerOnly: true },
  { href: "/dashboard/verification", label: "Verification", d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z", ownerOnly: true },
  { href: "/dashboard/settings", label: "Settings", d: "M4 21v-7M4 10V3M12 21v-11M12 6V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function DashboardNav({
  variant = "horizontal",
  isOwner = true,
}: {
  variant?: "horizontal" | "vertical";
  isOwner?: boolean;
}) {
  const visible = links.filter((it: { ownerOnly?: boolean }) => isOwner || !it.ownerOnly);
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  if (variant === "vertical") {
    return (
      <nav className="flex flex-col gap-1">
        {visible.map((l) => {
          const active = isActive(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition " +
                (active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted hover:bg-[#eef3f0] hover:text-ink")
              }
            >
              <Icon d={l.d} />
              {l.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex gap-1 overflow-x-auto">
      {visible.map((l) => {
        const active = isActive(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition " +
              (active ? "bg-primary text-primary-foreground" : "text-muted hover:bg-[#eef3f0] hover:text-ink")
            }
          >
            <Icon d={l.d} />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
