"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  CalendarClock,
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
  ShipWheel,
  WalletCards,
} from "lucide-react";

const ITEMS = [
  { href: "/merchant", label: "Overview", icon: LayoutDashboard },
  { href: "/merchant/reservations", label: "Reservations", icon: CalendarClock },
  { href: "/merchant/availability", label: "Availability", icon: ShieldCheck },
  { href: "/merchant/offers", label: "Offers", icon: BadgeDollarSign },
  { href: "/merchant/shore-excursions", label: "Cruise", icon: ShipWheel },
  { href: "/merchant/lifecycle", label: "Payments", icon: CreditCard },
] as const;

export function MerchantConsoleNav({
  showPayouts,
  availabilityHref,
}: {
  showPayouts: boolean;
  availabilityHref: string;
}) {
  const pathname = usePathname();
  const items = ITEMS.map((item) =>
    item.href === "/merchant/availability"
      ? { ...item, href: availabilityHref }
      : item,
  );

  return (
    <nav className="flex max-w-full gap-2 overflow-x-auto pb-1 xl:flex-wrap xl:justify-end" aria-label="Merchant console">
      {items.map(({ href, label, icon: Icon }) => {
        const base = href.split("?")[0];
        const active =
          pathname === base ||
          (base !== "/merchant" && pathname.startsWith(`${base}/`));
        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-[9px] font-black uppercase tracking-[.13em] transition ${
              active
                ? "bg-[#043331] text-white shadow-sm"
                : "border border-slate-200 bg-white text-[#043331] hover:border-teal-300 hover:bg-teal-50"
            }`}
          >
            <Icon className={`h-4 w-4 ${active ? "text-[#f5c451]" : "text-teal-700"}`} />
            {label}
          </Link>
        );
      })}
      {showPayouts ? (
        <Link
          href="/merchant/payouts"
          aria-current={pathname.startsWith("/merchant/payouts") ? "page" : undefined}
          className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-[9px] font-black uppercase tracking-[.13em] transition ${
            pathname.startsWith("/merchant/payouts")
              ? "bg-[#043331] text-white shadow-sm"
              : "border border-slate-200 bg-white text-[#043331] hover:border-teal-300 hover:bg-teal-50"
          }`}
        >
          <WalletCards className={`h-4 w-4 ${pathname.startsWith("/merchant/payouts") ? "text-[#f5c451]" : "text-teal-700"}`} />
          Payouts
        </Link>
      ) : null}
    </nav>
  );
}
