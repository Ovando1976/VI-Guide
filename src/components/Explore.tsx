// src/components/Explore.tsx

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  Car,
  Compass,
  Landmark,
  List,
  Map,
  Search,
  Ship,
  ShoppingBag,
  ShoppingCart,
  Sun,
  Trees,
  Utensils,
  Waves,
} from "lucide-react";

import { canonicalDiscoveries as discoveries } from "../data/canonical/discoveriesCanonical";
import { cn } from "../lib/utils";
import type { BeachDoc, EventDoc, PlaceDoc } from "../types";
import ExploreMapView from "./ExploreMapView";
import DiscoveryGrid from "./discover/DiscoveryGrid";
import DiscoveryProfile from "./discover/DiscoveryProfile";
import type { DiscoveryItem, IslandFilter } from "./discover/discoveryTypes";

const FALLBACK_IMAGE = "/images/beaches/magens-bay.jpg";

const CATEGORIES = [
  { id: "all", label: "All", icon: Compass },
  { id: "beach", label: "Beaches", icon: Waves },
  { id: "restaurant", label: "Food", icon: Utensils },
  { id: "history", label: "History", icon: Landmark },
  { id: "attraction", label: "Sights", icon: Landmark },
  { id: "hiking-trail", label: "Trails", icon: Trees },
  { id: "event", label: "Events", icon: CalendarDays },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "provisioning", label: "Grocery", icon: ShoppingCart },
  { id: "transport", label: "Transport", icon: Car },
] as const;

const LIVE_ITEMS = [
  { label: "Weather", value: "84°", icon: Sun },
  { label: "Cruise", value: "3 Ships", icon: Ship },
  { label: "Beaches", value: "Excellent", icon: Waves },
  { label: "Events", value: "6 Today", icon: CalendarDays },
  { label: "Taxi", value: "Live", icon: Car },
];

function cleanImage(value: unknown) {
  const src = String(value ?? "").trim();
  return src && src !== "undefined" && src !== "null" ? src : FALLBACK_IMAGE;
}

function normalizeIsland(value: unknown): IslandFilter {
  const text = String(value ?? "").toLowerCase().trim();

  if (text === "all") return "all";
  if (text === "stt" || text.includes("thomas")) return "st_thomas";
  if (text === "stj" || text.includes("john")) return "st_john";
  if (text === "stx" || text.includes("croix")) return "st_croix";
  if (text.includes("water")) return "water_island";

  return (text || "st_thomas") as IslandFilter;
}

function normalizeCategory(value: unknown) {
  let category = String(value ?? "discovery").toLowerCase().trim();

  if (category === "beaches") category = "beach";
  if (category.startsWith("restaurant")) category = "restaurant";
  if (category === "historic_sites" || category === "historic-site") category = "history";
  if (category === "hiking-trails") category = "hiking-trail";
  if (category === "grocery") category = "provisioning";
  if (category === "transportation") category = "transport";
  if (category === "attractions") category = "attraction";
  if (category === "events") category = "event";
  if (category === "businesses") category = "business";

  return category;
}

function normalizeDiscovery(data: (typeof discoveries)[number]): DiscoveryItem {
  const category = normalizeCategory(data.category);

  const coordinates =
    typeof data.lat === "number" && typeof data.lng === "number"
      ? { lat: data.lat, lng: data.lng }
      : undefined;

  return {
    id: data.id,
    collectionName: category,
    slug: data.id,
    title: data.title || "Untitled",
    description: data.description || "Island discovery record.",
    category,
    displayCategory: data.category || category,
    islandCode: normalizeIsland(data.island),
    areaSlug: "",
    coordinates,
    coverImage: cleanImage(data.imageUrl),
    gallery: [],
    featured: data.confidence >= 0.9 || data.duplicateCount > 0,
  };
}

const LOCAL_DISCOVERY_ITEMS = discoveries.map(normalizeDiscovery);

function loadLocalDiscoveries(selectedIsland: IslandFilter): DiscoveryItem[] {
  return LOCAL_DISCOVERY_ITEMS.filter((item) => {
    if (selectedIsland === "all") return true;
    return normalizeIsland(item.islandCode) === selectedIsland;
  });
}

export default function Explore({
  selectedIsland = "st_thomas",
  initialSearchQuery = "",
  onSelectListing,
}: {
  selectedIsland?: IslandFilter;
  initialSearchQuery?: string;
  onSelectListing?: (listing: BeachDoc | PlaceDoc | EventDoc) => void;
}) {
  const [searchParams] = useSearchParams();

  const [items, setItems] = useState<DiscoveryItem[]>(() =>
    loadLocalDiscoveries(selectedIsland),
  );
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedItem, setSelectedItem] = useState<DiscoveryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") ?? "all",
  );

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") ?? "all");
  }, [searchParams]);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    setItems(loadLocalDiscoveries(selectedIsland));
  }, [selectedIsland]);

  const filteredItems = useMemo(() => {
    const queryText = searchQuery.toLowerCase().trim();

    return items
      .filter((item) => {
        const categoryMatch =
          selectedCategory === "all" || item.category === selectedCategory;

        const searchText = [
          item.title,
          item.description,
          item.category,
          item.displayCategory,
          item.areaSlug,
          item.collectionName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return categoryMatch && (!queryText || searchText.includes(queryText));
      })
      .sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [items, selectedCategory, searchQuery]);

  function openItem(item: DiscoveryItem) {
    setSelectedItem(item);
    onSelectListing?.(item as any);
  }

  return (
    <main className="min-h-screen bg-[#061016] px-5 pb-32 pt-6 text-white sm:px-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2.25rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
            Discover
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
            Search the territory
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
            Beaches, restaurants, historic sites, events, rides, trails, shopping, and local intelligence.
          </p>

          <div className="relative mt-5">
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-300" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Ask anything about the Virgin Islands..."
              className="w-full rounded-[1.75rem] border border-white/10 bg-slate-950/70 py-4 pl-14 pr-5 text-base font-semibold text-white outline-none placeholder:text-white/35 focus:border-emerald-300/50 focus:ring-4 focus:ring-emerald-300/10"
            />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {LIVE_ITEMS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-xl">
              <Icon className="h-5 w-5 text-emerald-300" />
              <p className="mt-3 text-lg font-black">{value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                {label}
              </p>
            </div>
          ))}
        </section>

        <section className="overflow-x-auto pb-2">
          <div className="flex gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black transition active:scale-95",
                  selectedCategory === cat.id
                    ? "border-emerald-300/50 bg-emerald-300 text-slate-950"
                    : "border-white/10 bg-white/[0.06] text-white/70",
                )}
              >
                <cat.icon className="h-5 w-5" />
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-emerald-300">Featured Right Now</p>
            <h2 className="text-3xl font-black tracking-tight">
              {filteredItems.length} discoveries
            </h2>
          </div>

          <div className="flex rounded-2xl border border-white/10 bg-white/[0.06] p-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black",
                viewMode === "list" ? "bg-white text-slate-950" : "text-white/60",
              )}
            >
              <List className="h-4 w-4" />
              List
            </button>

            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black",
                viewMode === "map" ? "bg-white text-slate-950" : "text-white/60",
              )}
            >
              <Map className="h-4 w-4" />
              Map
            </button>
          </div>
        </section>

        {filteredItems.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] py-28 text-center">
            <Compass className="mx-auto h-12 w-12 text-white/20" />
            <p className="mt-6 text-lg font-bold text-white/45">
              No discoveries found in this category.
            </p>
          </div>
        ) : viewMode === "map" ? (
          <ExploreMapView
            items={filteredItems}
            selectedIsland={selectedIsland}
            onSelectListing={openItem as any}
          />
        ) : (
          <DiscoveryGrid items={filteredItems} onOpen={openItem} />
        )}
      </section>

      {selectedItem ? (
        <DiscoveryProfile
          item={selectedItem}
          allItems={items}
          onClose={() => setSelectedItem(null)}
        />
      ) : null}
    </main>
  );
}