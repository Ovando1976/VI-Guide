import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BedDouble, MapPin, Utensils, Waves } from "lucide-react";

import { isIslandCode } from "../lib/utils/islands";
import type { IslandCode } from "../types";

type PickKind = "beaches" | "restaurants" | "stays";

type FeaturedPick = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  island: IslandCode;
  kind: PickKind;
  slug?: string;
  tags: string[];
  route: string;
};

type FeaturedIslandPicksProps = {
  selectedIsland?: IslandCode | string;
};

const islandLabels: Record<IslandCode, string> = {
  st_thomas: "St. Thomas",
  st_john: "St. John",
  st_croix: "St. Croix",
  water_island: "Water Island",
};

const featuredPicks: FeaturedPick[] = [
  {
    id: "stt-magens",
    title: "Magens Bay",
    subtitle: "Classic St. Thomas beach day with calm water and easy planning.",
    imageUrl: "/images/beaches/st-thomas/magens-bay-1.jpg",
    island: "st_thomas",
    kind: "beaches",
    slug: "magens-bay",
    tags: ["beach", "classic", "family"],
    route: "/beaches?island=st_thomas&beach=magens-bay",
  },
  {
    id: "stt-sapphire",
    title: "Sapphire Beach",
    subtitle: "East End beach energy, water views, and food nearby.",
    imageUrl: "/images/optimized/homepage/sapphire-beach-1-e5926877ff.webp",
    island: "st_thomas",
    kind: "beaches",
    slug: "sapphire-beach",
    tags: ["east end", "snorkel", "views"],
    route: "/beaches?island=st_thomas&beach=sapphire",
  },
  {
    id: "stt-gladys",
    title: "Gladys Café",
    subtitle: "Classic local dining in downtown Charlotte Amalie.",
    imageUrl: "/images/places/st-thomas/gladys-cafe-1.jpg",
    island: "st_thomas",
    kind: "restaurants",
    slug: "gladys-cafe",
    tags: ["local food", "caribbean", "downtown"],
    route: "/eat?island=st_thomas&restaurant=gladys-cafe",
  },
  {
    id: "stt-secret-harbour",
    title: "Secret Harbour stay zone",
    subtitle: "A strong stay base for beach, dining, and East End access.",
    imageUrl: "/images/optimized/homepage/secret-harbour-beach-1-ccfc5c31b6.webp",
    island: "st_thomas",
    kind: "stays",
    slug: "secret-harbour",
    tags: ["beach stay", "east end", "dining"],
    route: "/hotels?island=st_thomas",
  },

  {
    id: "stj-trunk",
    title: "Trunk Bay",
    subtitle: "Iconic St. John beach stop with postcard water.",
    imageUrl: "/images/beaches/st-john/trunk-bay-1.jpg",
    island: "st_john",
    kind: "beaches",
    slug: "trunk-bay",
    tags: ["beach", "iconic", "north shore"],
    route: "/beaches?island=st_john&beach=trunk-bay",
  },
  {
    id: "stj-maho",
    title: "Maho Bay",
    subtitle: "Easygoing beach day with calm water and wildlife potential.",
    imageUrl: "/images/optimized/homepage/maho-bay-1-45e4cdab40.webp",
    island: "st_john",
    kind: "beaches",
    slug: "maho-bay",
    tags: ["calm", "turtles", "north shore"],
    route: "/beaches?island=st_john&beach=maho-bay",
  },
  {
    id: "stj-longboard",
    title: "The Longboard",
    subtitle: "Cruz Bay food and drinks with a polished island feel.",
    imageUrl: "/images/places/st-john/the-longboard-1.jpg",
    island: "st_john",
    kind: "restaurants",
    slug: "the-longboard",
    tags: ["c ruz bay", "dinner", "drinks"],
    route: "/eat?island=st_john&restaurant=the-longboard",
  },
  {
    id: "stj-caneel",
    title: "Caneel Bay area",
    subtitle: "A premium stay zone close to North Shore beach planning.",
    imageUrl: "/images/places/st-john/caneel-bay-overlook-1.jpg",
    island: "st_john",
    kind: "stays",
    slug: "caneel-bay",
    tags: ["stay", "north shore", "views"],
    route: "/hotels?island=st_john",
  },

  {
    id: "stx-rainbow",
    title: "Rainbow Beach",
    subtitle: "Frederiksted beach day with food, water, and sunset energy.",
    imageUrl: "/images/beaches/st-croix/rainbow-beach-1.jpg",
    island: "st_croix",
    kind: "beaches",
    slug: "rainbow-beach",
    tags: ["beach", "sunset", "frederiksted"],
    route: "/beaches?island=st_croix&beach=rainbow-beach",
  },
  {
    id: "stx-cane-bay",
    title: "Cane Bay",
    subtitle: "North Shore beach, food, and dive-friendly planning.",
    imageUrl: "/images/beaches/st-croix/cane-bay-1.jpg",
    island: "st_croix",
    kind: "beaches",
    slug: "cane-bay",
    tags: ["north shore", "dive", "food"],
    route: "/beaches?island=st_croix&beach=cane-bay",
  },
  {
    id: "stx-ama",
    title: "Ama at Cane Bay",
    subtitle: "Waterfront dining on the St. Croix North Shore.",
    imageUrl: "/images/optimized/homepage/ama-at-cane-bay-1-1819e11c32.webp",
    island: "st_croix",
    kind: "restaurants",
    slug: "ama-at-cane-bay",
    tags: ["waterfront", "north shore", "dinner"],
    route: "/eat?island=st_croix&restaurant=ama-at-cane-bay",
  },
  {
    id: "stx-buccaneer",
    title: "Buccaneer area",
    subtitle: "A strong stay anchor for beach, golf, and Christiansted access.",
    imageUrl: "/images/places/st-croix/buccaneer-beach-1.jpg",
    island: "st_croix",
    kind: "stays",
    slug: "buccaneer",
    tags: ["stay", "beach", "christiansted"],
    route: "/hotels?island=st_croix",
  },

  {
    id: "wi-honeymoon",
    title: "Honeymoon Beach",
    subtitle: "Water Island beach day with ferry-friendly planning.",
    imageUrl: "/images/beaches/water-island/honeymoon-beach-water-island.jpg",
    island: "water_island",
    kind: "beaches",
    slug: "honeymoon-beach-water-island",
    tags: ["beach", "ferry", "relaxed"],
    route: "/beaches?island=water_island&beach=honeymoon-beach-water-island",
  },
  {
    id: "wi-dinghys",
    title: "Dinghy’s Beach Bar",
    subtitle: "Casual beach food and drinks right by the water.",
    imageUrl: "/images/optimized/homepage/dinghys-beach-bar-1-859ebec721.webp",
    island: "water_island",
    kind: "restaurants",
    slug: "dinghys-beach-bar",
    tags: ["beach bar", "casual", "water island"],
    route: "/eat?island=water_island&restaurant=dinghys-beach-bar",
  },
  {
    id: "wi-stays",
    title: "Water Island stays",
    subtitle: "Quiet island stays for a slower, low-key trip base.",
    imageUrl: "/images/optimized/homepage/honeymoon-beach-water-island-1-ceb06542dd.webp",
    island: "water_island",
    kind: "stays",
    slug: "water-island-stays",
    tags: ["quiet", "stay", "ferry"],
    route: "/hotels?island=water_island",
  },
];

const tabs: Array<{
  key: "all" | PickKind;
  label: string;
  icon: typeof Waves;
}> = [
  { key: "all", label: "All", icon: MapPin },
  { key: "beaches", label: "Beaches", icon: Waves },
  { key: "restaurants", label: "Restaurants", icon: Utensils },
  { key: "stays", label: "Stays", icon: BedDouble },
];

function kindLabel(kind: PickKind) {
  if (kind === "restaurants") return "Restaurant";
  if (kind === "stays") return "Stay";
  return "Beach";
}

function FeaturedIslandPicks({ selectedIsland = "st_thomas" }: FeaturedIslandPicksProps) {
  const navigate = useNavigate();
  const safeSelectedIsland: IslandCode = isIslandCode(selectedIsland)
    ? selectedIsland
    : "st_thomas";
  const [activeTab, setActiveTab] = useState<"all" | PickKind>("all");

  const visiblePicks = useMemo(() => {
    const islandPicks = featuredPicks.filter((pick) => pick.island === safeSelectedIsland);
    const filtered =
      activeTab === "all"
        ? islandPicks
        : islandPicks.filter((pick) => pick.kind === activeTab);

    return filtered.length ? filtered : islandPicks;
  }, [activeTab, safeSelectedIsland]);

  return (
    <section className="mx-auto mt-8 max-w-5xl rounded-[2rem] bg-white p-5 shadow-xl shadow-black/5">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
            Featured island picks
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
            Beaches, restaurants, and stays.
          </h2>
          <p className="mt-2 text-sm font-semibold text-zinc-500">
            Curated starting points for {islandLabels[safeSelectedIsland]}.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                  selected
                    ? "bg-emerald-700 text-white"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visiblePicks.map((pick) => (
          <button
            key={pick.id}
            type="button"
            onClick={() => navigate(pick.route)}
            className="group overflow-hidden rounded-[1.75rem] border border-zinc-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-200"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
              <img
                src={pick.imageUrl}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />

              <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 shadow-sm backdrop-blur">
                {kindLabel(pick.kind)}
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-xl font-black text-zinc-950">{pick.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-zinc-500">
                {pick.subtitle}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {pick.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default FeaturedIslandPicks;
