import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import {
  Search,
  Waves,
  Utensils,
  ShoppingBag,
  Landmark,
  Compass,
  ShoppingCart,
  Calendar as CalendarIcon,
} from "lucide-react";
import { db } from "../firebase";
import { cn } from "../lib/utils";
import type { IslandCode, BeachDoc, PlaceDoc, EventDoc } from "../types";

type ExploreItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category?: string;
  islandCode: IslandCode | string;
  coordinates?: { lat: number; lng: number };
  coverImage?: string;
  startAt?: Date;
};

type IslandFilter = IslandCode | "all";

const CATEGORIES = [
  { id: "all", label: "Discovery", icon: Compass },
  { id: "beach", label: "Beaches", icon: Waves },
  { id: "restaurant", label: "Dining", icon: Utensils },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "attraction", label: "Sights", icon: Landmark },
  { id: "provisioning", label: "Grocery", icon: ShoppingCart },
  { id: "event", label: "Events", icon: CalendarIcon },
  { id: "history", label: "History", icon: Landmark },
];
function normalizeIsland(value?: string) {
  return String(value ?? "")
    .toLowerCase()
    .replaceAll("-", "_");
}

function getCoordinates(data: any) {
  const lat =
    data.lat ??
    data.latitude ??
    data.coordinates?.lat ??
    data.location?.lat ??
    data.centroid?.lat;

  const lng =
    data.lng ??
    data.longitude ??
    data.coordinates?.lng ??
    data.location?.lng ??
    data.centroid?.lng;

  if (typeof lat !== "number" || typeof lng !== "number") return undefined;

  return { lat, lng };
}

function normalizeItem(
  id: string,
  data: any,
  fallbackCategory: string
): ExploreItem {
  return {
    id,
    slug: data.slug ?? id,
    title: data.title ?? data.name ?? data.businessName ?? "Untitled",
    description:
      data.description ??
      data.summary ??
      data.shortDescription ??
      data.notes ??
      "",
    category: data.category ?? fallbackCategory,
    islandCode: data.islandCode ?? data.island ?? "st_thomas",
    coordinates: getCoordinates(data),
    coverImage:
      data.coverImage ??
      data.image ??
      data.images?.[0] ??
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    startAt: data.startAt?.toDate?.() ?? data.startsAt?.toDate?.() ?? undefined,
  };
}

async function loadCollection(
  collectionName: string,
  selectedIsland: IslandFilter,
  fallbackCategory: string
) {
  const ref = collection(db, collectionName);

  if (selectedIsland !== "all") {
    try {
      const q = query(
        ref,
        where("islandCode", "==", selectedIsland),
        limit(100)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        return snap.docs.map((d) =>
          normalizeItem(d.id, d.data(), fallbackCategory)
        );
      }
    } catch (error) {
      console.warn(
        `Filtered ${collectionName} query failed, falling back`,
        error
      );
    }
  }

  const snap = await getDocs(query(ref, limit(100)));

  return snap.docs
    .map((d) => normalizeItem(d.id, d.data(), fallbackCategory))
    .filter(
      (item) =>
        normalizeIsland(item.islandCode) === normalizeIsland(selectedIsland)
    );
}

export default function Explore({
  selectedIsland,
  initialSearchQuery = "",
  onSelectListing,
}: {
  selectedIsland: IslandFilter;
  initialSearchQuery?: string;
  onSelectListing: (listing: BeachDoc | PlaceDoc | EventDoc) => void;
}) {
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [beaches, places, historicSites, events] = await Promise.all([
          loadCollection("beaches", selectedIsland, "beach"),
          loadCollection("places", selectedIsland, "attraction"),
          loadCollection("historic_sites", selectedIsland, "history"),
          loadCollection("events", selectedIsland, "event"),
        ]);

        if (!cancelled) {
          setItems([...beaches, ...places, ...historicSites, ...events]);
        }
      } catch (error) {
        console.error("Failed to load explore content", error);
        if (!cancelled) {
          setLoadError(
            "We could not load fresh island discoveries right now. Please try again."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [selectedIsland]);

  const filteredItems = useMemo(() => {
    const queryText = searchQuery.toLowerCase().trim();

    return items.filter((item) => {
      const islandMatch =
        selectedIsland === "all" ||
        normalizeIsland(item.islandCode) === normalizeIsland(selectedIsland);

      const categoryMatch =
        selectedCategory === "all" || item.category === selectedCategory;

      const searchMatch =
        !queryText ||
        item.title.toLowerCase().includes(queryText) ||
        item.description.toLowerCase().includes(queryText) ||
        item.category?.toLowerCase().includes(queryText);

      return islandMatch && categoryMatch && searchMatch;
    });
  }, [items, selectedIsland, selectedCategory, searchQuery]);

  return (
    <div className="pb-24">
      <div className="px-8 mb-12 space-y-8">
        <div className="relative">
          <Search className="absolute left-8 top-1/2 h-6 w-6 -translate-y-1/2 text-stone-300" />
          <input
            type="text"
            placeholder="Search the territory..."
            className="w-full rounded-[2.5rem] border border-stone-100 bg-white py-6 pl-18 pr-8 font-serif text-lg italic shadow-2xl outline-none transition-all focus:border-turquoise focus:ring-4 focus:ring-turquoise/5"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="px-8 mb-12">
        <div className="flex gap-6 overflow-x-auto pb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "flex shrink-0 flex-col items-center gap-4 transition-all active:scale-95",
                selectedCategory === cat.id
                  ? "opacity-100"
                  : "opacity-40 grayscale"
              )}
            >
              <div
                className={cn(
                  "flex h-24 w-24 items-center justify-center rounded-[2.5rem] shadow-2xl transition-all",
                  selectedCategory === cat.id
                    ? "bg-ink text-turquoise scale-110"
                    : "bg-white text-stone-400"
                )}
              >
                <cat.icon className="h-10 w-10" />
              </div>
              <span className="micro-label">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-8 space-y-8">
        {isLoading && (
          <div className="rounded-[3rem] border border-stone-100 bg-white py-24 text-center shadow-inner">
            <p className="font-serif text-xl italic text-stone-500">
              Loading curated discoveries…
            </p>
          </div>
        )}

        {loadError && (
          <div className="rounded-[2rem] border border-rose-100 bg-rose-50 px-8 py-10 text-center">
            <p className="text-sm font-medium text-rose-700">{loadError}</p>
          </div>
        )}

        {!isLoading && !loadError && filteredItems.length === 0 && (
          <div className="rounded-[3rem] border border-stone-100 bg-white py-32 text-center shadow-inner">
            <Compass className="mx-auto h-12 w-12 text-stone-200" />
            <p className="mt-6 font-serif text-xl italic text-stone-400">
              No discoveries found in this category.
            </p>
          </div>
        )}

        {!isLoading &&
          !loadError &&
          filteredItems.map((item) => (
            <button
              key={`${item.category}-${item.id}`}
              onClick={() => onSelectListing(item as any)}
              className="w-full overflow-hidden rounded-[2.5rem] bg-white text-left shadow-xl transition active:scale-[0.98]"
            >
              <div className="h-52 overflow-hidden bg-stone-100">
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">
                  {item.category}
                </p>

                <h3 className="mt-4 font-serif text-4xl italic leading-none text-ink">
                  {item.title}
                </h3>

                <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-stone-500">
                  {item.description}
                </p>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
