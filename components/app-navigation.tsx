"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  Compass,
  House,
  Landmark,
  Map,
  Navigation,
  Route,
  Search,
  Sparkles,
  TicketCheck,
  Waves,
} from "lucide-react";
import clsx from "clsx";

import { AccountMenu } from "@/components/account-menu";
import { ViBrandMark } from "@/components/brand/vi-brand-mark";

const ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/map", label: "Map", icon: Map },
  { href: "/intelligence", label: "Intelligence", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/planner", label: "My Trip", icon: Route },
  { href: "/concierge", label: "Concierge", icon: Sparkles },
  { href: "/experiences", label: "Book", icon: TicketCheck },
  { href: "/places", label: "Explore", icon: Compass },
  { href: "/beaches", label: "Beaches", icon: Waves },
  { href: "/heritage", label: "Heritage", icon: Landmark },
  { href: "/accommodations", label: "Stays", icon: BedDouble },
  { href: "/mobility", label: "Ride", icon: Navigation },
] as const;

function isActive(pathname: string, href: (typeof ITEMS)[number]["href"]) {
  if (href === "/") return pathname === "/";

  if (href === "/heritage") {
    return (
      pathname === "/heritage" ||
      pathname.startsWith("/heritage/") ||
      pathname === "/historic" ||
      pathname.startsWith("/historic/") ||
      pathname === "/history" ||
      pathname.startsWith("/history/")
    );
  }

  if (href === "/experiences") {
    return pathname === "/experiences" || pathname.startsWith("/book");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/unauthorized") return null;

  return (
    <nav aria-label="Primary navigation" className="app-nav">
      <Link
        href="/"
        className="app-nav__brand"
        aria-label="VI Guide home"
        style={{ background: "transparent", border: 0, boxShadow: "none" }}
      >
        <ViBrandMark className="h-9 w-9 shrink-0" />
      </Link>

      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={clsx("app-nav__item", active && "is-active")}
          >
            <Icon size={18} strokeWidth={2.2} />
            <span>{label}</span>
          </Link>
        );
      })}

      <AccountMenu embedded />
    </nav>
  );
}
