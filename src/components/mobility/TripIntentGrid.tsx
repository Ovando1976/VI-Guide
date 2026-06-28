import type { ReactNode } from "react";
import {
  Anchor,
  Briefcase,
  Hotel,
  MapPin,
  Plane,
  Ship,
  Utensils,
  Waves,
} from "lucide-react";
import type { TripType } from "../../types";

export type TripIntent =
  | "airport"
  | "ferry"
  | "cruise"
  | "beach"
  | "dinner"
  | "hotel"
  | "estate"
  | "custom";

export type TripIntentOption = {
  id: TripIntent;
  label: string;
  description: string;
  icon: ReactNode;
  tripType: TripType;
};

const OPTIONS: TripIntentOption[] = [
  {
    id: "airport",
    label: "Airport Pickup",
    description: "Arrivals, luggage, hotel transfer",
    icon: <Plane size={22} />,
    tripType: "airport",
  },
  {
    id: "ferry",
    label: "Ferry Transfer",
    description: "Red Hook, Cruz Bay, Charlotte Amalie",
    icon: <Ship size={22} />,
    tripType: "ferry_transfer",
  },
  {
    id: "cruise",
    label: "Cruise Port",
    description: "Havensight, Crown Bay, return timing",
    icon: <Anchor size={22} />,
    tripType: "cruise",
  },
  {
    id: "beach",
    label: "Beach Day",
    description: "Relaxed ride to beaches",
    icon: <Waves size={22} />,
    tripType: "direct",
  },
  {
    id: "dinner",
    label: "Dinner Ride",
    description: "Restaurants and evening pickup",
    icon: <Utensils size={22} />,
    tripType: "direct",
  },
  {
    id: "hotel",
    label: "Hotel Pickup",
    description: "Resorts, villas, guest houses",
    icon: <Hotel size={22} />,
    tripType: "direct",
  },
  {
    id: "estate",
    label: "Estate / Parcel",
    description: "Precise local geography",
    icon: <MapPin size={22} />,
    tripType: "direct",
  },
  {
    id: "custom",
    label: "Custom Trip",
    description: "Any point to any point",
    icon: <Briefcase size={22} />,
    tripType: "direct",
  },
];

export default function TripIntentGrid({
  selected,
  onSelect,
}: {
  selected?: TripIntent | null;
  onSelect: (intent: TripIntentOption) => void;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {OPTIONS.map((option) => {
        const active = selected === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option)}
            className={`group rounded-[2rem] border p-5 text-left shadow-2xl backdrop-blur-xl transition ${
              active
                ? "border-turquoise bg-turquoise text-ink"
                : "border-white/10 bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <div
              className={`grid h-12 w-12 place-items-center rounded-2xl transition ${
                active
                  ? "bg-ink text-turquoise"
                  : "bg-white/10 text-turquoise group-hover:bg-turquoise group-hover:text-ink"
              }`}
            >
              {option.icon}
            </div>

            <h3 className="mt-4 text-sm font-black uppercase tracking-[0.16em]">
              {option.label}
            </h3>

            <p
              className={`mt-2 text-xs leading-relaxed ${
                active ? "text-ink/70" : "text-white/55"
              }`}
            >
              {option.description}
            </p>
          </button>
        );
      })}
    </section>
  );
}