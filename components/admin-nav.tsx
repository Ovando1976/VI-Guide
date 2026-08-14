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
    <nav
      aria-label="Admin operations sections"
      className="overflow-hidden rounded-[26px] border border-[#f5c451]/25 bg-[linear-gradient(135deg,#032f2d,#07504c)] p-3 shadow-[0_18px_46px_rgba(2,31,29,.22)]"
    >
      <div className="flex items-center justify-between gap-3 px-2 pb-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-[#f5c451] shadow-[0_0_0_4px_rgba(245,196,81,.12)]"
          />
          <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[#f5c451]">
            Operations desk
          </span>
        </div>
        <span className="hidden text-[8px] font-black uppercase tracking-[0.18em] text-white/45 sm:inline">
          USVI Explorer operator network
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] transition ${
                active
                  ? "border-[#f5c451]/55 bg-[#f5c451] text-[#032f2d] shadow-[0_8px_20px_rgba(245,196,81,.16)]"
                  : "border-white/10 bg-white/[0.06] text-white/72 hover:border-[#f5c451]/30 hover:bg-[#f5c451]/10 hover:text-[#fff0bf]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
