"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Compass, House, Map, Route, Sparkles } from "lucide-react";
import clsx from "clsx";

import { AccountMenu } from "@/components/account-menu";
import { ViBrandMark } from "@/components/brand/vi-brand-mark";
import {
  ACTIVE_ISLAND_STORAGE_KEY,
  ACTIVE_ISLAND_UPDATED_EVENT,
  readActiveIsland,
  type ActiveIsland,
} from "@/lib/active-island";
import {
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
} from "@/lib/journey-planner";

const ITEMS = [
  { base: "/", label: "Home", icon: House },
  { base: "/places", label: "Explore", icon: Compass },
  { base: "/map", label: "Map", icon: Map },
  { base: "/planner", label: "My Trip", icon: Route },
  { base: "/concierge", label: "Concierge", icon: Sparkles },
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
  "/cruises",
  "/shore-excursions",
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

function isActive(pathname: string, base: (typeof ITEMS)[number]["base"]) {
  if (base === "/") return pathname === "/";
  if (base === "/places") return matchesRoute(pathname, EXPLORE_ROUTES);
  if (base === "/planner") return matchesRoute(pathname, TRIP_ROUTES);
  if (base === "/concierge") return matchesRoute(pathname, CONCIERGE_ROUTES);
  return pathname === base || pathname.startsWith(`${base}/`);
}

function contextualHref(base: (typeof ITEMS)[number]["base"], island: ActiveIsland) {
  if (base === "/places") return `/places?island=${island}`;
  if (base === "/map") return `/map?island=${island}`;
  if (base === "/concierge") return `/concierge?island=${island}`;
  return base;
}

export function AppNavigation() {
  const pathname = usePathname();
  const [tripStopCount, setTripStopCount] = useState(0);
  const [activeIsland, setActiveIsland] = useState<ActiveIsland>("stt");

  useEffect(() => {
    function refreshTripStopCount() {
      setTripStopCount(
        readJourneyPlans().reduce(
          (total, plan) => total + plan.plan.length,
          0,
        ),
      );
    }

    function refreshIsland() {
      setActiveIsland(readActiveIsland());
    }

    function handleIslandEvent(event: Event) {
      const detail = (event as CustomEvent<ActiveIsland>).detail;
      if (detail === "stt" || detail === "stj" || detail === "stx") {
        setActiveIsland(detail);
      } else {
        refreshIsland();
      }
    }

    function handleStorage(event: StorageEvent) {
      if (!event.key || event.key === ACTIVE_ISLAND_STORAGE_KEY) refreshIsland();
      if (!event.key || event.key === "vi-guide.intelligence.saved-plans") {
        refreshTripStopCount();
      }
    }

    refreshTripStopCount();
    refreshIsland();
    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, refreshTripStopCount);
    window.addEventListener(ACTIVE_ISLAND_UPDATED_EVENT, handleIslandEvent);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(
        JOURNEY_PLAN_UPDATED_EVENT,
        refreshTripStopCount,
      );
      window.removeEventListener(ACTIVE_ISLAND_UPDATED_EVENT, handleIslandEvent);
      window.removeEventListener("storage", handleStorage);
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

      {ITEMS.map(({ base, label, icon: Icon }) => {
        const active = isActive(pathname, base);
        const isTrip = base === "/planner";
        const href = contextualHref(base, activeIsland);
        const accessibleLabel =
          isTrip && tripStopCount
            ? `${label}, ${tripStopCount} saved ${tripStopCount === 1 ? "stop" : "stops"}`
            : label;

        return (
          <Link
            key={base}
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
