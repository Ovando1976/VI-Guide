import { Archive, CalendarDays, Camera, Utensils, Waves } from "lucide-react";
import type { IslandCode } from "../../types";

type Props = {
  selectedIsland: IslandCode;
  onNavigate?: (path: string) => void;
};

const cards = [
  {
    title: "Beaches",
    description: "Find the best beaches by island, mood, and distance.",
    path: "/beaches",
    icon: Waves,
  },
  {
    title: "Food",
    description: "Discover local restaurants and visitor favorites.",
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
    title: "Gallery",
    description: "Historic photos, LOC images, HABS, and archive media.",
    path: "/history/gallery",
    icon: Camera,
  },
  {
    title: "Archives",
    description: "Explore Danish West Indies records and translations.",
    path: "/history/archives",
    icon: Archive,
  },
];

export default function ContinueExploring({
  selectedIsland,
  onNavigate,
}: Props) {
  return (
    <section className="mt-7">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">
        Continue
      </p>

      <h2 className="mt-1 text-3xl font-black">Explore the island</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              key={card.path}
              type="button"
              onClick={() => onNavigate?.(`${card.path}?island=${selectedIsland}`)}
              className="rounded-[2rem] bg-white p-5 text-left shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
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
  );
}