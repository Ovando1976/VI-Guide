import { MapPinned, Navigation, Waves } from "lucide-react";
import type { IslandCode } from "../../types";

type Props = {
  selectedIsland: IslandCode;
  selectedIslandLabel: string;
  onNavigate?: (path: string) => void;
};

export default function LiveTerritoryCard({
  selectedIsland,
  selectedIslandLabel,
  onNavigate,
}: Props) {
  return (
    <button
      type="button"
      onClick={() => onNavigate?.(`/map?island=${selectedIsland}`)}
      className="w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 via-emerald-900 to-black p-5 text-left text-white shadow-2xl"
    >
      <div className="flex items-center justify-between">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
          <MapPinned className="h-6 w-6 text-emerald-300" />
        </div>

        <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
          Live Map
        </div>
      </div>

      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300">
        Territory OS
      </p>

      <h2 className="mt-2 text-4xl font-black tracking-tight">
        {selectedIslandLabel}
      </h2>

      <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-300">
        Estate boundaries, beaches, historic sites, ferry points, taxi zones,
        routes, and local intelligence connected to one living island map.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white/10 p-4">
          <Waves className="h-5 w-5 text-emerald-300" />
          <p className="mt-3 text-2xl font-black">3</p>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-300">
            Beaches
          </p>
        </div>

        <div className="rounded-2xl bg-white/10 p-4">
          <Navigation className="h-5 w-5 text-emerald-300" />
          <p className="mt-3 text-2xl font-black">6</p>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-300">
            Places
          </p>
        </div>

        <div className="rounded-2xl bg-white/10 p-4">
          <MapPinned className="h-5 w-5 text-emerald-300" />
          <p className="mt-3 text-2xl font-black">Map</p>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-300">
            Ready
          </p>
        </div>
      </div>
    </button>
  );
}