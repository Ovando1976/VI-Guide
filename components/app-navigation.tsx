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
  MessageCircle,
  PlusCircle,
  ShieldCheck,
  Store,
  UserRound,
  WalletCards,
} from "lucide-react";
import clsx from "clsx";

import { AccountMenu } from "@/components/account-menu";
import { ViBrandMark } from "@/components/brand/vi-brand-mark";
import {
  ACTIVE_ISLAND_STORAGE_KEY,
  ACTIVE_ISLAND_UPDATED_EVENT,
  normalizeActiveIsland,
  readActiveIsland,
  type ActiveIsland,
} from "@/lib/active-island";
import {
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
} from "@/lib/journey-planner";
import {
  readSelectedTravelerTripPlanId,
  TRAVELER_TRIP_SELECTION_STORAGE_KEY,
  TRAVELER_TRIP_SELECTION_UPDATED_EVENT,
} from "@/lib/traveler-trip-selection";

const ITEMS = [
  { base: "/social", label: "Home", icon: House },
  { base: "/chats", label: "Chats", icon: MessageCircle },
  { base: "/discover", label: "Discover", icon: Compass },
  { base: "/create", label: "Create", icon: PlusCircle },
  { base: "/profile/social", label: "Profile", icon: UserRound },
] as const;

// Existing traveler workspaces remain valid deep links, but they are no longer
// allowed to displace the canonical five-item Social AI navigation.
export const LEGACY_TRAVEL_DESTINATIONS = [
  { base: "/trips", label: "My Trip" },
  { base: "/planner", label: "Planner" },
  { base: "/plan", label: "Plan" },
  { base: "/today", label: "My Day" },
  { base: "/trip-planning", label: "Trip Planning" },
  { base: "/book", label: "Book" },
  { base: "/bookings", label: "Bookings" },
  { base: "/checkout", label: "Checkout" },
  { base: "/shared-trip", label: "Shared Trip" },
  { base: "/map", label: "Live Map" },
  { base: "/concierge", label: "Concierge" },
] as const;

const DISCOVER_ROUTES = [
  "/discover",
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
  "/communities",
  "/concierge",
  "/intelligence",
  "/mission",
  "/search",
  "/saved",
  "/map",
] as const;

const PROFILE_ROUTES = ["/profile", "/u", "/notifications"] as const;

type OperationsNavItem = {
  base: string;
  label: string;
  icon: typeof House;
};

type TravelerNavTripContext = {
  planId: string;
  island: ActiveIsland;
};

const ADMIN_OPERATIONS_ITEMS: OperationsNavItem[] = [
  { base: "/admin", label: "Ops Home", icon: ShieldCheck },
  { base: "/admin/dispatch", label: "Dispatch", icon: Activity },
  { base: "/admin/tariffs", label: "Tariffs", icon: ShieldCheck },
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
  if (base === "/social") return pathname === "/social";
  if (base === "/discover") return matchesRoute(pathname, DISCOVER_ROUTES);
  if (base === "/profile/social") return matchesRoute(pathname, PROFILE_ROUTES);
  return pathname === base || pathname.startsWith(`${base}/`);
}

function contextualHref(
  base: string,
  island: ActiveIsland,
  tripContext: TravelerNavTripContext | null,
) {
  if (base === "/places") return `/places?island=${island}`;
  if (base === "/trips" && tripContext) {
    return `/trips?trip=${encodeURIComponent(tripContext.planId)}`;
  }
  if (base === "/map") {
    return tripContext
      ? `/map?island=${tripContext.island}&trip=${encodeURIComponent(tripContext.planId)}`
      : `/map?island=${island}`;
  }
  if (base === "/concierge") {
    return tripContext
      ? `/concierge?island=${tripContext.island}&trip=${encodeURIComponent(tripContext.planId)}`
      : `/concierge?island=${island}`;
  }
  return base;
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

export function AppNavigation() {
  const pathname = usePathname();
  const [tripContext, setTripContext] = useState<TravelerNavTripContext | null>(null);
  const [activeIsland, setActiveIsland] = useState<ActiveIsland>("stt");
  const contextualTripsHref = contextualHref("/trips", activeIsland, tripContext);
  const contextualConciergeHref = contextualHref("/concierge", activeIsland, tripContext);
  const contextualMapHref = contextualHref("/map", activeIsland, tripContext);
  const contextualPlacesHref = contextualHref("/places", activeIsland, tripContext);

  useEffect(() => {
    function refreshTripState() {
      const plans = readJourneyPlans();
      const selectedPlanId = readSelectedTravelerTripPlanId();
      const selectedPlan = selectedPlanId
        ? plans.find((plan) => plan.id === selectedPlanId) ?? null
        : null;
      const selectedIsland = normalizeActiveIsland(selectedPlan?.island);
      setTripContext(
        selectedPlan && selectedIsland
          ? { planId: selectedPlan.id, island: selectedIsland }
          : null,
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
      if (
        !event.key ||
        event.key === "vi-guide.intelligence.saved-plans" ||
        event.key === TRAVELER_TRIP_SELECTION_STORAGE_KEY
      ) {
        refreshTripState();
      }
    }

    refreshTripState();
    refreshIsland();
    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, refreshTripState);
    window.addEventListener(
      TRAVELER_TRIP_SELECTION_UPDATED_EVENT,
      refreshTripState,
    );
    window.addEventListener(ACTIVE_ISLAND_UPDATED_EVENT, handleIslandEvent);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, refreshTripState);
      window.removeEventListener(
        TRAVELER_TRIP_SELECTION_UPDATED_EVENT,
        refreshTripState,
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
          aria-label="USVI Explorer public home"
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
      className={clsx(
        "app-nav",
        pathname === "/social" && "app-nav--home",
        pathname === "/" && "app-nav--home",
      )}
      data-trip-href={contextualTripsHref}
      data-concierge-href={contextualConciergeHref}
      data-map-href={contextualMapHref}
      data-places-href={contextualPlacesHref}
    >
      <Link
        href="/social"
        className="app-nav__brand"
        aria-label="Island Social home"
      >
        <ViBrandMark className="h-9 w-9 shrink-0" />
      </Link>

      {ITEMS.map(({ base, label, icon: Icon }) => {
        const active = isActive(pathname, base);
        const href = contextualHref(base, activeIsland, tripContext);
        return (
          <Link
            key={base}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            data-nav={base.slice(1).replaceAll("/", "-")}
            className={clsx(
              "app-nav__item relative",
              base === "/create" && "app-nav__item--create",
              base === "/discover" && matchesRoute(pathname, ["/map"]) && "app-nav__item--map",
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
