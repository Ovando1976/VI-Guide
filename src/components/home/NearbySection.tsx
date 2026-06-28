import { Clock, MapPinned, Waves } from "lucide-react";
import type { IslandCode } from "../../types";

type Props = {
  selectedIsland: IslandCode;
  onNavigate?: (path: string) => void;
};

const nearby = [
  {
    title: "Magens Bay",
    type: "Beach",
    description: "One of St. Thomas’ most recognized beaches.",
    path: "/beaches",
    icon: Waves,
  },
  {
    title: "Fort Christian",
    type: "History",
    description: "Historic Danish fort and Charlotte Amalie landmark.",
    path: "/history",
    icon: Clock,
  },
  {
    title: "Charlotte Amalie",
    type: "Town",
    description: "Harbor, shopping, history, food, and cruise access.",
    path: "/explore",
    icon: MapPinned,
  },
];

export default function NearbySection({ selectedIsland, onNavigate }: Props) {
  return (
    <section className="mt-7">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">
        Nearby
      </p>

      <h2 className="mt-1 text-3xl font-black">Start around you</h2>

      <div className="mt-4 space-y-3">
        {nearby.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.title}
              type="button"
              onClick={() => onNavigate?.(`${item.path}?island=${selectedIsland}`)}
              className="flex w-full gap-4 rounded-[1.6rem] bg-white p-4 text-left shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
                <Icon className="h-6 w-6" />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
                  {item.type}
                </p>
                <h3 className="mt-1 text-xl font-black">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}