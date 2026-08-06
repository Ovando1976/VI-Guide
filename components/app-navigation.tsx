"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Compass, House, Map, Route, Sparkles } from "lucide-react";
import clsx from "clsx";

import { AccountMenu } from "@/components/account-menu";
import { ViBrandMark } from "@/components/brand/vi-brand-mark";
import {
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
} from "@/lib/journey-planner";

const ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/places", label: "Explore", icon: Compass },
  { href: "/map", label: "Map", icon: Map },
  { href: "/planner", label: "My Trip", icon: Route },
  { href: "/concierge", label: "Concierge", icon: Sparkles },
] as const;

const EXPLORE_ROUTES = [
  "/places",
  "/beaches",
  "/heritage",
  "/historic",
  "/history",
  "/accommodations",
  "/experiences",
  "/events",
  "/fishing",
  "/offers",
  "/community",
  "/search",
] as const;

const TRIP_ROUTES = ["/planner", "/plan", "/trips", "/mobility"] as const;
const CONCIERGE_ROUTES = ["/concierge", "/intelligence"] as const;

function matchesRoute(pathname: string, routes: readonly string[]) {
  return routes.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
}

function isActive(pathname: string, href: (typeof ITEMS)[number]["href"]) {
  if (href === "/") return pathname === "/";
  if (href === "/places") return matchesRoute(pathname, EXPLORE_ROUTES);
  if (href === "/planner") return matchesRoute(pathname, TRIP_ROUTES);
  if (href === "/concierge") return matchesRoute(pathname, CONCIERGE_ROUTES);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation() {
  const pathname = usePathname();
  const [tripStopCount, setTripStopCount] = useState(0);

  useEffect(() => {
    function refreshTripStopCount() {
      setTripStopCount(
        readJourneyPlans().reduce(
          (total, plan) => total + plan.plan.length,
          0,
        ),
      );
    }

    refreshTripStopCount();
    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, refreshTripStopCount);
    window.addEventListener("storage", refreshTripStopCount);
    return () => {
      window.removeEventListener(
        JOURNEY_PLAN_UPDATED_EVENT,
        refreshTripStopCount,
      );
      window.removeEventListener("storage", refreshTripStopCount);
    };
  }, []);

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
        const isTrip = href === "/planner";
        const accessibleLabel =
          isTrip && tripStopCount
            ? `${label}, ${tripStopCount} saved ${tripStopCount === 1 ? "stop" : "stops"}`
            : label;

        return (
          <Link
            key={href}
            href={href}
            aria-label={accessibleLabel}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "app-nav__item relative",
              active && "is-active",
            )}
          >
            <Icon size={18} strokeWidth={2.2} />
            <span>{label}</span>
            {isTrip && tripStopCount ? (
              <span
                aria-hidden="true"
                className={clsx(
                  "absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full px-1 text-[8px] font-black leading-none shadow-sm",
                  active
                    ? "bg-[#f5c451] text-[#043331]"
                    : "bg-[#0f766e] text-white",
                )}
              >
                {tripStopCount > 99 ? "99+" : tripStopCount}
              </span>
            ) : null}
          </Link>
        );
      })}

      <AccountMenu embedded />
    </nav>
  );
}
