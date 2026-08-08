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
    <nav
      className="flex max-w-full gap-1.5 overflow-x-auto rounded-[22px] border border-white/10 bg-black/10 p-1.5 shadow-inner backdrop-blur xl:flex-wrap xl:justify-end"
      aria-label="Merchant operations sections"
    >
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
            className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-[9px] font-black uppercase tracking-[.13em] transition ${
              active
                ? "bg-[#f5c451] text-[#032f2d] shadow-[0_8px_24px_rgba(245,196,81,.18)]"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon
              className={`h-4 w-4 ${active ? "text-[#032f2d]" : "text-[#f5c451]"}`}
            />
            {label}
          </Link>
        );
      })}
      {showPayouts ? (
        <Link
          href="/merchant/payouts"
          aria-current={
            pathname.startsWith("/merchant/payouts") ? "page" : undefined
          }
          className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-[9px] font-black uppercase tracking-[.13em] transition ${
            pathname.startsWith("/merchant/payouts")
              ? "bg-[#f5c451] text-[#032f2d] shadow-[0_8px_24px_rgba(245,196,81,.18)]"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          <WalletCards
            className={`h-4 w-4 ${
              pathname.startsWith("/merchant/payouts")
                ? "text-[#032f2d]"
                : "text-[#f5c451]"
            }`}
          />
          Payouts
        </Link>
      ) : null}
    </nav>
  );
}
