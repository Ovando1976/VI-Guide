import { Building2, MapPinned, Shield, Flame, Landmark } from "lucide-react";
import type { IslandCode, PlaceDoc } from "../types";

type Props = {
  selectedIsland?: IslandCode | "all";
  onSelectSite?: (site: PlaceDoc) => void;
};

const HISTORIC_SITES: PlaceDoc[] = [
  {
    id: "fort-christian",
    title: "Fort Christian",
    name: "Fort Christian",
    description: "One of the most important historic landmarks in Charlotte Amalie, connected to Danish colonial rule, harbor defense, government, and Transfer Day history.",
    island: "st_thomas",
    category: "history",
    location: "Charlotte Amalie",
    lat: 18.3411,
    lng: -64.9306,
    tags: ["fort", "danish-west-indies", "charlotte-amalie", "transfer-day"],
  } as unknown as PlaceDoc,
  {
    id: "hassel-island-fortifications",
    title: "Hassel Island Fortifications",
    name: "Hassel Island Fortifications",
    description: "Military and maritime landscape tied to St. Thomas harbor defense, British occupation history, and Danish West Indies navigation.",
    island: "st_thomas",
    category: "history",
    location: "Hassel Island",
    lat: 18.3317,
    lng: -64.9345,
    tags: ["hassel-island", "fortifications", "harbor", "british-occupation"],
  } as unknown as PlaceDoc,
  {
    id: "fortsberg-coral-bay",
    title: "Fortsberg",
    name: "Fortsberg",
    description: "St. John hilltop fort site connected to Danish occupation, Coral Bay, and the 1733 Akwamu revolt.",
    island: "st_john",
    category: "history",
    location: "Coral Bay",
    lat: 18.342,
    lng: -64.713,
    tags: ["fortsberg", "coral-bay", "akwamu-revolt", "st-john"],
  } as unknown as PlaceDoc,
  {
    id: "fort-frederik",
    title: "Fort Frederik",
    name: "Fort Frederik",
    description: "Major Frederiksted landmark associated with emancipation, Buddhoe, maritime history, and Danish colonial government.",
    island: "st_croix",
    category: "history",
    location: "Frederiksted",
    lat: 17.7115,
    lng: -64.8815,
    tags: ["fort-frederik", "emancipation", "buddhoe", "frederiksted"],
  } as unknown as PlaceDoc,
  {
    id: "christiansted-national-historic-site",
    title: "Christiansted Historic District",
    name: "Christiansted Historic District",
    description: "Historic Danish townscape with government, trade, harbor, church, and plantation-era records connected to St. Croix history.",
    island: "st_croix",
    category: "history",
    location: "Christiansted",
    lat: 17.7466,
    lng: -64.7032,
    tags: ["christiansted", "danish-west-indies", "harbor", "architecture"],
  } as unknown as PlaceDoc,
];

function islandLabel(island?: IslandCode | "all") {
  if (island === "st_thomas") return "St. Thomas";
  if (island === "st_john") return "St. John";
  if (island === "st_croix") return "St. Croix";
  if (island === "water_island") return "Water Island";
  return "Virgin Islands";
}

function iconForSite(site: PlaceDoc) {
  const tags = ((site as any).tags || []).join(" ").toLowerCase();

  if (tags.includes("emancipation")) return Flame;
  if (tags.includes("fort")) return Shield;
  if (tags.includes("district")) return Landmark;
  return Building2;
}

export default function HistoricSites({
  selectedIsland = "all",
  onSelectSite,
}: Props) {
  const sites = HISTORIC_SITES.filter(
    (site) =>
      selectedIsland === "all" ||
      (site as any).island === selectedIsland ||
      (site as any).island === "all"
  );

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-6 pb-32 text-stone-950">
      <section className="rounded-[2rem] bg-stone-950 p-6 text-white shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-300">
          Virgin Islands Historical Atlas
        </p>

        <h1 className="mt-3 text-4xl font-black leading-tight">
          Historic Sites
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-stone-300">
          Explore forts, estates, harbors, revolt landscapes, emancipation
          places, and Danish West Indies landmarks across {islandLabel(selectedIsland)}.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        {sites.map((site) => {
          const Icon = iconForSite(site);

          return (
            <article
              key={(site as any).id}
              className="overflow-hidden rounded-[2rem] bg-white shadow-xl"
            >
              <button
                onClick={() => onSelectSite?.(site)}
                className="w-full p-5 text-left"
                type="button"
              >
                <div className="flex gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white shadow-lg">
                    <Icon className="h-7 w-7" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
                      {islandLabel((site as any).island)}
                    </p>

                    <h2 className="mt-1 text-2xl font-black leading-tight">
                      {(site as any).title || (site as any).name}
                    </h2>

                    <p className="mt-2 text-sm leading-relaxed text-stone-600">
                      {(site as any).description}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                      <MapPinned className="h-4 w-4 text-emerald-700" />
                      {(site as any).location}
                    </div>

                    {(site as any).tags?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(site as any).tags.slice(0, 5).map((tag: string) => (
                          <span
                            key={tag}
                            className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500"
                          >
                            {tag.replaceAll("-", " ")}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </button>
            </article>
          );
        })}
      </section>
    </main>
  );
}