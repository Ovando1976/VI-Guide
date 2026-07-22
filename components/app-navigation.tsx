"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, House, Map, Route, Sparkles } from "lucide-react";
import clsx from "clsx";

import { AccountMenu } from "@/components/account-menu";
import { ViBrandMark } from "@/components/brand/vi-brand-mark";

const ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/places", label: "Explore", icon: Compass },
  { href: "/map", label: "Map", icon: Map },
  { href: "/planner", label: "My Trip", icon: Route },
  { href: "/concierge", label: "Concierge", icon: Sparkles },
] as const;

function isActive(pathname: string, href: (typeof ITEMS)[number]["href"]) {
  if (href === "/") return pathname === "/";
  if (href === "/places") {
    return [
      "/places",
      "/beaches",
      "/heritage",
      "/historic",
      "/history",
      "/accommodations",
      "/experiences",
      "/mobility",
      "/intelligence",
      "/search",
    ].some((base) => pathname === base || pathname.startsWith(`${base}/`));
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
        <ViBrandMark className="h-8 w-8 shrink-0" />
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
