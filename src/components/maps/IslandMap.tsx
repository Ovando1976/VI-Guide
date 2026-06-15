import type { IslandCode } from "../../types";

export type MapFilter =
  | "all"
  | "beach"
  | "history"
  | "transport"
  | "food"
  | "grocery"
  | "shopping"
  | "event"
  | "attraction";

export type HeritageLayer =
  | "default"
  | "estates"
  | "timeline"
  | "gallery"
  | "archives";

export type MapPoint = {
  id: string;
  title: string;
  type: Exclude<MapFilter, "all">;
  lat: number;
  lng: number;
  description: string;
  image?: string;
  slug?: string;
  sourceCollection?: string;
  sourceCategory?: string;
  mobilityType?: string;
  mobilityRoutes?: string[];
  zoneId?: string;
};

type IslandMapProps = {
  selectedIsland?: IslandCode;
  activeFilter?: MapFilter;
  selectedPointId?: string | null;
  points?: MapPoint[];
  heritageLayer?: HeritageLayer;
  onSelectPoint?: (point: MapPoint) => void;
};

export default function IslandMap({
  selectedIsland = "st_thomas",
  activeFilter = "all",
  selectedPointId = null,
  points = [],
  heritageLayer = "default",
  onSelectPoint,
}: IslandMapProps) {
  const visiblePoints =
    activeFilter === "all"
      ? points
      : points.filter((point) => point.type === activeFilter);

  return (
    <div className="overflow-hidden rounded-[2rem] bg-stone-950 text-white shadow-2xl">
      <div className="bg-gradient-to-br from-emerald-900 via-stone-950 to-black p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
          Island Map
        </p>

        <h2 className="mt-2 text-2xl font-black">
          {selectedIsland.replaceAll("_", " ")}
        </h2>

        <p className="mt-2 text-sm text-stone-300">
          Layer: {heritageLayer}
        </p>

        <div className="mt-5 grid min-h-[320px] place-items-center rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          {visiblePoints.length === 0 ? (
            <div className="text-center">
              <p className="text-lg font-black">Map ready</p>
              <p className="mt-2 text-sm text-stone-300">
                Mapbox heritage layers will connect here.
              </p>
            </div>
          ) : (
            <div className="w-full space-y-3">
              {visiblePoints.map((point) => (
                <button
                  key={point.id}
                  onClick={() => onSelectPoint?.(point)}
                  className={`w-full rounded-2xl p-4 text-left ${
                    selectedPointId === point.id
                      ? "bg-emerald-400 text-stone-950"
                      : "bg-white/10 text-white"
                  }`}
                  type="button"
                >
                  <p className="text-sm font-black">{point.title}</p>
                  <p className="mt-1 text-xs opacity-80">
                    {point.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}