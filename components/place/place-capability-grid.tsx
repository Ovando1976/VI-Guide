import type { LucideIcon } from "lucide-react";
import {
  BedDouble,
  CalendarCheck,
  Car,
  Compass,
  Map,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  Waves,
} from "lucide-react";

export type PlaceCapability =
  | "booking"
  | "concierge"
  | "dining"
  | "explore"
  | "map"
  | "stay"
  | "transportation"
  | "verified"
  | "water";

type CapabilityDefinition = {
  icon: LucideIcon;
  label: string;
  description: string;
};

const CAPABILITIES: Record<PlaceCapability, CapabilityDefinition> = {
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
  explore: {
    icon: Compass,
    label: "Nearby",
    description: "Find useful places and experiences around this location.",
  },
  map: {
    icon: Map,
    label: "Living Map",
    description: "Open this place inside the interactive map workspace.",
  },
  stay: {
    icon: BedDouble,
    label: "Stay",
    description: "Use this property as a base for an island itinerary.",
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
