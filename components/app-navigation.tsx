"use client";

import { ViBrandMark } from "@/components/brand/vi-brand-mark";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  Compass,
  House,
  Landmark,
  Map,
  Navigation,
  Sparkles,
  Waves,
} from "lucide-react";
import clsx from "clsx";
import { AccountMenu } from "@/components/account-menu";

const ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/map", label: "Map", icon: Map },
  { href: "/concierge", label: "Concierge", icon: Sparkles },
  { href: "/places", label: "Explore", icon: Compass },
  { href: "/beaches", label: "Beaches", icon: Waves },
  { href: "/heritage", label: "Heritage", icon: Landmark },
  { href: "/accommodations", label: "Stays", icon: BedDouble },
  { href: "/mobility", label: "Ride", icon: Navigation },
] as const;

export function AppNavigation() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/unauthorized") return null;

  return (
    <nav aria-label="Primary navigation" className="app-nav">
      <div
        className="app-nav__brand"
        aria-hidden="true"
        style={{ background: "transparent", border: 0, boxShadow: "none" }}
      >
        <ViBrandMark className="h-9 w-9 shrink-0" />
      </div>
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/"
            ? pathname === "/"
            : pathname === href ||
              pathname.startsWith(`${href}/`) ||
              (href === "/heritage" &&
                (pathname === "/historic" || pathname.startsWith("/historic/")));
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
