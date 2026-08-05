import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  BedDouble,
  CalendarCheck,
  Car,
  Clock3,
  Compass,
  Fish,
  History,
  Map,
  MessageCircleMore,
  Music2,
  ParkingCircle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Ticket,
  UtensilsCrossed,
  Waves,
} from "lucide-react";

import { AddToJourneyButton } from "@/components/journey/add-to-journey-button";
import type { JourneyStopInput } from "@/lib/journey-planner";
import { buildContextualConciergeHref } from "@/lib/place/concierge-links";

export type PlaceCapability =
  | "accessibility"
  | "booking"
  | "concierge"
  | "dining"
  | "events"
  | "explore"
  | "fishing"
  | "history"
  | "map"
  | "music"
  | "parking"
  | "shopping"
  | "stay"
  | "tickets"
  | "timing"
  | "transportation"
  | "verified"
  | "water";

export type PlaceCapabilityContext = {
  name?: string;
  eyebrow?: string;
  description?: string;
  kind?: string;
  hasWebsite?: boolean;
  hasBooking?: boolean;
};

type CapabilityDefinition = {
  icon: LucideIcon;
  label: string;
  description: string;
};

const CAPABILITIES: Record<PlaceCapability, CapabilityDefinition> = {
  accessibility: {
    icon: Accessibility,
    label: "Accessibility",
    description: "Review mobility, access, and arrival considerations.",
  },
  booking: {
    icon: CalendarCheck,
    label: "Booking",
    description: "Continue into the reservation or inquiry flow.",
  },
  concierge: {
    icon: MessageCircleMore,
    label: "Concierge",
    description: "Plan around this place with full destination context.",
  },
  dining: {
    icon: UtensilsCrossed,
    label: "Dining",
    description: "Discover food and drink options connected to this stop.",
  },
  events: {
    icon: CalendarCheck,
    label: "Events",
    description: "Connect this place with scheduled island experiences.",
  },
  explore: {
    icon: Compass,
    label: "Nearby",
    description: "Find useful places and experiences around this location.",
  },
  fishing: {
    icon: Fish,
    label: "Fishing",
    description: "Review access, target species, conditions, and regulations.",
  },
  history: {
    icon: History,
    label: "Local history",
    description: "Explore the people, events, and stories tied to this place.",
  },
  map: {
    icon: Map,
    label: "Living Map",
    description: "Open this place inside the interactive map workspace.",
  },
  music: {
    icon: Music2,
    label: "Live music",
    description: "Look for performances and nightlife connected to this stop.",
  },
  parking: {
    icon: ParkingCircle,
    label: "Parking",
    description: "Review parking and practical arrival options.",
  },
  shopping: {
    icon: ShoppingBag,
    label: "Shopping",
    description: "Discover retail, markets, and local products nearby.",
  },
  stay: {
    icon: BedDouble,
    label: "Stay",
    description: "Use this property as a base for an island itinerary.",
  },
  tickets: {
    icon: Ticket,
    label: "Tickets",
    description: "Continue to admission, ticket, or reservation options.",
  },
  timing: {
    icon: Clock3,
    label: "Best timing",
    description: "Plan the visit around hours, conditions, and travel time.",
  },
  transportation: {
    icon: Car,
    label: "Transportation",
    description: "Plan pickup, drop-off, and realistic travel timing.",
  },
  verified: {
    icon: ShieldCheck,
    label: "Verified",
    description: "Catalog details are tied to a reviewed source.",
  },
  water: {
    icon: Waves,
    label: "Water access",
    description: "Connect this stop with beaches, ferries, or marine activities.",
  },
};

const BASE_CAPABILITIES: PlaceCapability[] = [
  "map",
  "concierge",
  "transportation",
  "explore",
  "timing",
];

export function inferPlaceCapabilities(
  context: PlaceCapabilityContext,
): PlaceCapability[] {
  const text = [
    context.name,
    context.eyebrow,
    context.description,
    context.kind,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const capabilities = new Set<PlaceCapability>(BASE_CAPABILITIES);

  if (context.hasWebsite) capabilities.add("verified");
  if (context.hasBooking) capabilities.add("booking");
  if (
    matches(text, [
      "stay",
      "hotel",
      "resort",
      "villa",
      "inn",
      "lodging",
      "accommodation",
    ])
  ) {
    capabilities.add("stay");
    capabilities.add("booking");
    capabilities.add("dining");
  }
  if (
    matches(text, [
      "beach",
      "bay",
      "water",
      "snorkel",
      "swim",
      "marine",
      "ferry",
      "harbor",
      "marina",
    ])
  ) {
    capabilities.add("water");
    capabilities.add("parking");
  }
  if (
    matches(text, [
      "restaurant",
      "cafe",
      "bar",
      "grill",
      "food",
      "dining",
      "bakery",
      "kitchen",
    ])
  ) {
    capabilities.add("dining");
    capabilities.add("booking");
  }
  if (
    matches(text, [
      "historic",
      "history",
      "museum",
      "fort",
      "ruin",
      "heritage",
      "monument",
      "plantation",
    ])
  ) {
    capabilities.add("history");
    capabilities.add("accessibility");
  }
  if (matches(text, ["fish", "fishing", "angling", "charter", "pier", "boat ramp"])) {
    capabilities.add("fishing");
    capabilities.add("water");
  }
  if (matches(text, ["event", "festival", "concert", "show", "performance", "carnival"])) {
    capabilities.add("events");
    capabilities.add("tickets");
  }
  if (matches(text, ["music", "nightlife", "dj", "band", "dance"])) {
    capabilities.add("music");
  }
  if (matches(text, ["shop", "market", "store", "boutique", "gallery", "vendor"])) {
    capabilities.add("shopping");
  }
  if (matches(text, ["accessible", "wheelchair", "mobility"])) {
    capabilities.add("accessibility");
  }
  if (matches(text, ["parking", "park and ride"])) {
    capabilities.add("parking");
  }

  return Array.from(capabilities);
}

function matches(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

type Props = {
  capabilities: PlaceCapability[];
  name: string;
  island: string;
  mapHref?: string;
  rideHref?: string;
  website?: string | null;
  bookingHref?: string;
  journeyStop?: JourneyStopInput;
  title?: string;
  description?: string;
};

export function PlaceCapabilityGrid({
  capabilities,
  name,
  island,
  mapHref,
  rideHref,
  website,
  bookingHref,
  journeyStop,
  title = "What you can do here",
  description =
    "VI Guide adapts the experience to the services and actions available at this place.",
}: Props) {
  const uniqueCapabilities = Array.from(new Set(capabilities));
  if (!uniqueCapabilities.length) return null;

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e8f5f2] text-[#0f766e]">
          <Sparkles size={20} />
        </span>
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.23em] text-amber-600">
            Place capabilities
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#043331]">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
            {description}
          </p>
        </div>
      </div>

      {journeyStop ? (
        <AddToJourneyButton
          stop={journeyStop}
          className="mt-6 w-full sm:w-auto"
        />
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {uniqueCapabilities.map((capability) => {
          const definition = CAPABILITIES[capability];
          const Icon = definition.icon;
          const href = resolveCapabilityHref({
            capability,
            name,
            island,
            mapHref,
            rideHref,
            website,
            bookingHref,
            journeyStop,
          });
          const card = (
            <>
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#0f766e] shadow-sm">
                <Icon size={18} />
              </span>
              <div className="mt-4 text-sm font-black text-[#043331]">
                {definition.label}
              </div>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                {definition.description}
              </p>
              {href ? (
                <div className="mt-3 text-[9px] font-black uppercase tracking-[.16em] text-teal-700">
                  Open action →
                </div>
              ) : null}
            </>
          );
          const classes =
            "rounded-[22px] border border-slate-200 bg-[#fbfaf6] p-4 transition hover:-translate-y-0.5 hover:border-teal-600 hover:bg-white";

          if (!href) {
            return (
              <div key={capability} className={classes}>
                {card}
              </div>
            );
          }
          if (href.startsWith("http")) {
            return (
              <a
                key={capability}
                href={href}
                target="_blank"
                rel="noreferrer"
                className={classes}
              >
                {card}
              </a>
            );
          }
          return (
            <Link key={capability} href={href} className={classes}>
              {card}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function resolveCapabilityHref({
  capability,
  name,
  island,
  mapHref,
  rideHref,
  website,
  bookingHref,
  journeyStop,
}: {
  capability: PlaceCapability;
  name: string;
  island: string;
  mapHref?: string;
  rideHref?: string;
  website?: string | null;
  bookingHref?: string;
  journeyStop?: JourneyStopInput;
}) {
  const ask = (prompt: string) =>
    buildContextualConciergeHref({ name, island, mapHref, prompt });
  const resolvedBookingHref = bookingHref ?? journeyStop?.bookingHref;

  switch (capability) {
    case "map":
      return mapHref ?? "/map";
    case "transportation":
    case "parking":
      return (
        rideHref ??
        ask(`Plan transportation and arrival logistics for ${name} on ${island}.`)
      );
    case "booking":
    case "tickets":
      return (
        resolvedBookingHref ??
        website ??
        ask(`Help me book or reserve ${name} on ${island}.`)
      );
    case "concierge":
      return ask(
        `Plan a complete experience around ${name} on ${island}, using this place as the active context.`,
      );
    case "dining":
      return ask(`Find the best dining options at or near ${name} on ${island}.`);
    case "water":
      return ask(
        `Plan water activities, conditions, access, and safety around ${name} on ${island}.`,
      );
    case "fishing":
      return ask(
        `Plan fishing around ${name} on ${island}, including species, access, regulations, timing, and charters.`,
      );
    case "history":
      return ask(
        `Tell me the history of ${name} on ${island} and build a nearby heritage route.`,
      );
    case "events":
    case "music":
      return ask(`Find events and live experiences near ${name} on ${island}.`);
    case "shopping":
      return ask(`Find shopping, markets, and local products near ${name} on ${island}.`);
    case "accessibility":
      return ask(
        `Plan an accessible visit to ${name} on ${island}, including transportation and nearby facilities.`,
      );
    case "timing":
      return ask(
        `Recommend the best time to visit ${name} on ${island}, including hours, travel time, and a backup plan.`,
      );
    case "stay":
      return (
        resolvedBookingHref ??
        website ??
        ask(`Build a stay plan around ${name} on ${island}.`)
      );
    case "explore":
      return ask(`Show useful places and experiences near ${name} on ${island}.`);
    default:
      return undefined;
  }
}
