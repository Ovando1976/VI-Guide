"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarSearch,
  Compass,
  LifeBuoy,
  ShipWheel,
  TicketCheck,
} from "lucide-react";

const ITEMS = [
  { href: "/cruises", label: "Cruise Hub", icon: ShipWheel, route: "/cruises" },
  {
    href: "/cruises#sailings",
    label: "Find a sailing",
    icon: CalendarSearch,
    route: null,
  },
  {
    href: "/shore-excursions",
    label: "Port days",
    icon: Compass,
    route: "/shore-excursions",
  },
  {
    href: "/cruises/plan",
    label: "Ask an advisor",
    icon: LifeBuoy,
    route: "/cruises/plan",
  },
  { href: "/bookings", label: "My bookings", icon: TicketCheck, route: "/bookings" },
] as const;

export function CruiseHubNav({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Cruise hub navigation"
      className={`border-y border-teal-900/10 bg-white/95 px-4 backdrop-blur sm:px-6 ${
        compact ? "py-3" : "py-4"
      }`}
    >
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ITEMS.map(({ href, label, icon: Icon, route }) => {
          const active = route
            ? route === "/cruises"
              ? pathname === route
              : pathname === route || pathname.startsWith(`${route}/`)
            : false;

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[9px] font-black uppercase tracking-[.13em] transition ${
                active
                  ? "bg-[#043331] text-white"
                  : "border border-slate-200 bg-white text-[#043331] hover:border-teal-300 hover:bg-teal-50"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-[#f5c451]" : "text-teal-700"}`} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
