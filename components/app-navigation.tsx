"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  CalendarDays,
  Compass,
  House,
  Map,
  Route,
  ShieldCheck,
  Sparkles,
  Store,
  WalletCards,
} from "lucide-react";
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
  { base: "/map", label: "Live Map", icon: Map },
  { base: "/trips", label: "My Trip", icon: Route },
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
  "/activities",
  "/car-rentals",
  "/events",
  "/fishing",
  "/offers",
  "/cruises",
  "/shore-excursions",
  "/community",
  "/search",
  "/saved",
] as const;

const TRIP_ROUTES = [
  "/trips",
  "/planner",
  "/plan",
  "/today",
  "/trip-planning",
  "/mobility",
  "/book",
  "/bookings",
  "/checkout",
  "/shared-trip",
] as const;
const CONCIERGE_ROUTES = ["/concierge", "/intelligence", "/mission"] as const;

type OperationsNavItem = {
  base: string;
  label: string;
  icon: typeof House;
};

const ADMIN_OPERATIONS_ITEMS: OperationsNavItem[] = [
  { base: "/admin", label: "Ops Home", icon: ShieldCheck },
  { base: "/admin/dispatch", label: "Dispatch", icon: Activity },
  { base: "/admin/payouts", label: "Payouts", icon: WalletCards },
  { base: "/", label: "Public Guide", icon: House },
];

const DRIVER_OPERATIONS_ITEMS: OperationsNavItem[] = [
  { base: "/driver", label: "Driver OS", icon: Activity },
  { base: "/map", label: "Live Map", icon: Map },
  { base: "/", label: "Public Guide", icon: House },
];

const BUSINESS_OPERATIONS_ITEMS: OperationsNavItem[] = [
  { base: "/merchant", label: "Business", icon: Store },
  { base: "/merchant/availability", label: "Availability", icon: CalendarDays },
  { base: "/", label: "Public Guide", icon: House },
];

function matchesRoute(pathname: string, routes: readonly string[]) {
  return routes.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
}

function isActive(pathname: string, base: (typeof ITEMS)[number]["base"]) {
  if (base === "/") return pathname === "/";
  if (base === "/places") return matchesRoute(pathname, EXPLORE_ROUTES);
  if (base === "/trips") return matchesRoute(pathname, TRIP_ROUTES);
  if (base === "/concierge") return matchesRoute(pathname, CONCIERGE_ROUTES);
  return pathname === base || pathname.startsWith(`${base}/`);
}

function operationsItemsFor(pathname: string): OperationsNavItem[] | null {
  if (matchesRoute(pathname, ["/admin", "/architecture"])) {
    return ADMIN_OPERATIONS_ITEMS;
  }
  if (matchesRoute(pathname, ["/driver"])) {
    return DRIVER_OPERATIONS_ITEMS;
  }
  if (matchesRoute(pathname, ["/merchant", "/provider"])) {
    return BUSINESS_OPERATIONS_ITEMS;
  }
  return null;
}

function isOperationsActive(pathname: string, base: string) {
  if (base === "/") return false;
  if (base === "/admin") {
    return pathname === "/admin" || pathname === "/architecture";
  }
  if (base === "/merchant") {
    return (
      pathname === "/merchant" ||
      (pathname.startsWith("/merchant/") &&
        !matchesRoute(pathname, ["/merchant/availability"]))
    );
  }
  if (base === "/merchant/availability") {
    return matchesRoute(pathname, [
      "/merchant/availability",
      "/provider/operations",
    ]);
  }
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

  const operationsItems = operationsItemsFor(pathname);
  if (operationsItems) {
    return (
      <nav
        aria-label="Operations navigation"
        className="app-nav app-nav--operations"
      >
        <Link
          href="/"
          className="app-nav__brand"
          aria-label="USVI Compass public home"
        >
          <ViBrandMark className="h-9 w-9 shrink-0" />
        </Link>

        {operationsItems.map(({ base, label, icon: Icon }) => {
          const active = isOperationsActive(pathname, base);
          return (
            <Link
              key={base}
              href={base}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              data-nav={`operations-${base === "/" ? "public" : base.replace(/^\//, "").replaceAll("/", "-")}`}
              className={clsx(
                "app-nav__item app-nav__item--operations",
                active && "is-active",
              )}
            >
              <span className="app-nav__icon">
                <Icon size={19} strokeWidth={2.2} />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}

        <AccountMenu embedded />
      </nav>
    );
  }

  return (
    <nav
      aria-label="Primary navigation"
      className={clsx("app-nav", pathname === "/" && "app-nav--home")}
    >
      <Link
        href="/"
        className="app-nav__brand"
        aria-label="USVI Compass home"
      >
        <ViBrandMark className="h-9 w-9 shrink-0" />
      </Link>

      {ITEMS.map(({ base, label, icon: Icon }) => {
        const active = isActive(pathname, base);
        const isTrip = base === "/trips";
        const isMap = base === "/map";
        const isConcierge = base === "/concierge";
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
            data-nav={base === "/" ? "home" : base.slice(1)}
            className={clsx(
              "app-nav__item relative",
              isMap && "app-nav__item--map",
              isConcierge && "app-nav__item--concierge",
              active && "is-active",
            )}
          >
            <span className="app-nav__icon">
              <Icon size={19} strokeWidth={2.2} />
            </span>
            <span>{label}</span>
            {isTrip && tripStopCount ? (
              <span
                aria-hidden="true"
                className="app-nav__badge"
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
