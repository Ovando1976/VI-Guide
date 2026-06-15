import {
  Archive,
  CalendarDays,
  Camera,
  Compass,
  MapPinned,
  MessageCircle,
  ShipWheel,
  Sparkles,
  Utensils,
  Waves,
} from "lucide-react";

import type { BeachDoc, IslandCode, PlaceDoc } from "../types";

type ListingSelection = BeachDoc | PlaceDoc;

type Props = {
  selectedIsland?: IslandCode;
  selectedIslandLabel?: string;
  onNavigate?: (path: string) => void;
  onSelectListing?: (listing: ListingSelection) => void;
};

const quickActions = [
  {
    title: "Explore",
    description: "Beaches, food, shops, attractions, and island guides.",
    path: "/explore",
    icon: Compass,
    tone: "bg-emerald-600",
  },
  {
    title: "Live Map",
    description: "Open the island map with routes, places, and history.",
    path: "/map",
    icon: MapPinned,
    tone: "bg-sky-600",
  },
  {
    title: "Gallery",
    description: "Historic photos, LOC images, HABS, and Danish archives.",
    path: "/history/gallery",
    icon: Camera,
    tone: "bg-amber-600",
  },
  {
    title: "Timeline",
    description: "Walk through Virgin Islands history by era.",
    path: "/history/timeline",
    icon: CalendarDays,
    tone: "bg-stone-800",
  },
];

const featuredCards = [
  {
    title: "Beaches",
    description: "Find the best beaches by island, mood, and distance.",
    path: "/beaches",
    icon: Waves,
  },
  {
    title: "Food",
    description: "Discover local restaurants, food stops, and visitor favorites.",
    path: "/eat",
    icon: Utensils,
  },
  {
    title: "Events",
    description: "See what is happening around the Virgin Islands.",
    path: "/events",
    icon: CalendarDays,
  },
  {
    title: "Cruise Day",
    description: "Plan a perfect port day from arrival to return.",
    path: "/cruise",
    icon: ShipWheel,
  },
  {
    title: "Archives",
    description: "Explore Danish West Indies records and translated documents.",
    path: "/history/archives",
    icon: Archive,
  },
  {
    title: "Concierge",
    description: "Ask the island assistant for recommendations and planning.",
    path: "/concierge",
    icon: MessageCircle,
  },
];

export default function VisitorHome({
  selectedIsland = "st_thomas",
  selectedIslandLabel = "St. Thomas",
  onNavigate,
}: Props) {
  function go(path: string) {
    onNavigate?.(`${path}?island=${selectedIsland}`);
  }

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-6 pb-32 text-stone-950">
      <section className="overflow-hidden rounded-[2rem] bg-stone-950 text-white shadow-2xl">
        <div className="bg-gradient-to-br from-emerald-900 via-stone-950 to-black p-6">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10">
              <Sparkles className="h-5 w-5 text-emerald-300" />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300">
                VI Guide
              </p>
              <p className="text-xs font-bold text-stone-300">
                Island intelligence for visitors and locals
              </p>
            </div>
          </div>

          <h1 className="mt-6 text-5xl font-black leading-[0.95]">
            Explore {selectedIslandLabel}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-300">
            Beaches, rides, food, events, historic places, maps, galleries,
            archives, and concierge planning in one Virgin Islands guide.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.path}
                  onClick={() => go(action.path)}
                  className="rounded-3xl bg-white/10 p-4 text-left transition hover:bg-white/15"
                  type="button"
                >
                  <div
                    className={`grid h-11 w-11 place-items-center rounded-2xl ${action.tone}`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>

                  <h2 className="mt-4 text-lg font-black">{action.title}</h2>

                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-stone-300">
                    {action.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">
              Start Here
            </p>
            <h2 className="mt-1 text-3xl font-black">What do you need?</h2>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {featuredCards.map((card) => {
            const Icon = card.icon;

            return (
              <button
                key={card.path}
                onClick={() => go(card.path)}
                className="rounded-[2rem] bg-white p-5 text-left shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
                type="button"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-4 text-2xl font-black">{card.title}</h3>

                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {card.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}