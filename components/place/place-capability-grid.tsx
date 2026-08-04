import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  Anchor,
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

type Props = {
  capabilities: PlaceCapability[];
  title?: string;
  description?: string;
};

export function PlaceCapabilityGrid({
  capabilities,
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

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {uniqueCapabilities.map((capability) => {
          const definition = CAPABILITIES[capability];
          const Icon = definition.icon;

          return (
            <div
              key={capability}
              className="rounded-[22px] border border-slate-200 bg-[#fbfaf6] p-4"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#0f766e] shadow-sm">
                <Icon size={18} />
              </span>
              <div className="mt-4 text-sm font-black text-[#043331]">
                {definition.label}
              </div>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                {definition.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
