"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/dispatch", label: "Dispatch" },
  { href: "/admin/travel-requests", label: "Travel Advisor" },
  { href: "/admin/travel-proposals", label: "Proposals" },
  { href: "/admin/cruise-requests", label: "Cruise Advisor" },
  { href: "/admin/cruise-inventory", label: "Cruise Inventory" },
  { href: "/admin/fleet", label: "Fleet" },
  { href: "/admin/payouts", label: "Payouts" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-3">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition ${
              active
                ? "bg-[#043331] text-white"
                : "border border-slate-200 bg-white text-[#043331] hover:border-slate-300"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
