import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import {
  Calendar as CalendarIcon,
  Compass,
  Landmark,
  Search,
  ShoppingBag,
  ShoppingCart,
  Utensils,
  Waves,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { db } from "../firebase";
import { cn } from "../lib/utils";
import type { BeachDoc, EventDoc, IslandCode, PlaceDoc } from "../types";
import ExploreMapView from "./ExploreMapView";

type ExploreItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  islandCode: IslandCode | string;
  coordinates?: { lat: number; lng: number };
  coverImage?: string;
  startAt?: Date;
  tags?: string[];
  address?: string;
  areaSlug?: string;
  source?: string;
};

type IslandFilter = IslandCode | "all";

type LocalSource = {
  path: string;
  category: string;
  source: string;
  islandCode?: IslandCode;
  includeInDiscovery?: boolean;
};

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

const localCatalogModules = import.meta.glob("../data/**/*.json");

const LOCAL_SOURCES: LocalSource[] = [
  { path: "../data/beaches.json", category: "beach", source: "local-beaches", includeInDiscovery: true },
  { path: "../data/places.json", category: "attraction", source: "local-places", includeInDiscovery: true },
  { path: "../data/attractions.json", category: "attraction", source: "local-attractions", includeInDiscovery: true },
  { path: "../data/shopping.json", category: "shopping", source: "local-shopping", includeInDiscovery: false },
  { path: "../data/grocery.json", category: "provisioning", source: "local-grocery", includeInDiscovery: false },
  { path: "../data/historic-sites.json", category: "history", source: "local-history", includeInDiscovery: true },
  { path: "../data/events.json", category: "event", source: "local-events", includeInDiscovery: false },
  { path: "../data/restaurants-st-thomas.json", category: "restaurant", source: "restaurants-st-thomas", islandCode: "st_thomas", includeInDiscovery: true },
  { path: "../data/restaurants-st-john.json", category: "restaurant", source: "restaurants-st-john", islandCode: "st_john", includeInDiscovery: true },
  { path: "../data/restaurants-st-croix.json", category: "restaurant", source: "restaurants-st-croix", islandCode: "st_croix", includeInDiscovery: true },
  { path: "../data/restaurants-water-island.json", category: "restaurant", source: "restaurants-water-island", islandCode: "water_island", includeInDiscovery: true },
];

function normalizeIsland(value?: unknown) {
  return String(value ?? "").toLowerCase().replace(/-/g, "_").trim();
}

function slugify(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeCategory(value: unknown, fallbackCategory: string) {
  const raw = String(value || fallbackCategory || "")
    .toLowerCase()
    .replace(/-/g, "_")
    .trim();

  if (["restaurant", "restaurants", "dining", "eat"].includes(raw)) return "restaurant";
  if (["food"].includes(raw) && fallbackCategory !== "event") return "restaurant";
  if (["beach", "beaches"].includes(raw)) return "beach";
  if (["shopping", "shop", "shops", "retail"].includes(raw)) return "shopping";
  if (["grocery", "groceries", "provisioning", "market"].includes(raw)) return "provisioning";
  if (["event", "events", "calendar"].includes(raw)) return "event";

  if (["history", "historic", "historic_site", "historic_sites", "heritage"].includes(raw)) {
    return "history";
  }

  if (["attraction", "attractions", "sight", "sights", "place"].includes(raw)) {
    return "attraction";
  }

  return raw || fallbackCategory;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function getCoordinates(data: any) {
  const lat =
    toNumber(data.lat) ??
    toNumber(data.latitude) ??
    toNumber(data.coordinates?.lat) ??
    toNumber(data.location?.lat) ??
    toNumber(data.centroid?.lat) ??
    toNumber(Array.isArray(data.coordinates) ? data.coordinates[1] : undefined);

  const lng =
    toNumber(data.lng) ??
    toNumber(data.longitude) ??
    toNumber(data.coordinates?.lng) ??
    toNumber(data.location?.lng) ??
    toNumber(data.centroid?.lng) ??
    toNumber(Array.isArray(data.coordinates) ? data.coordinates[0] : undefined);

  if (typeof lat !== "number" || typeof lng !== "number") return undefined;
  return { lat, lng };
}

function toDate(value: any) {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 8);
  }

  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 8);
  }

  return [];
}

function getArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;

  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;

    for (const key of ["items", "records", "places", "events", "data"]) {
      if (Array.isArray(objectValue[key])) return objectValue[key] as unknown[];
    }
  }

  return [];
}

function looksLikeEvent(data: any, title: string, description: string) {
  const text = `${title} ${description} ${data.category || ""} ${data.type || ""}`.toLowerCase();

  return Boolean(
    data.startAt ||
      data.startsAt ||
      data.eventDate ||
      data.date ||
      data.schedule ||
      data.venue ||
      text.includes("recurring local event") ||
      text.includes("food truck friday") ||
      text.includes("festival") ||
      text.includes("parade") ||
      text.includes("concert") ||
      text.includes("carnival")
  );
}

function normalizeItem(
  id: string,
  data: any,
  fallbackCategory: string,
  source = "firestore"
): ExploreItem {
  const title = String(
    data.title ??
      data.name ??
      data.businessName ??
      data.restaurantName ??
      data.eventName ??
      "Untitled"
  );

  const description = String(
    data.description ??
      data.summary ??
      data.shortDescription ??
      data.notes ??
      data.address ??
      ""
  );

  const sourceLower = source.toLowerCase();

  const category =
    fallbackCategory === "event" ||
    sourceLower.includes("event") ||
    looksLikeEvent(data, title, description)
      ? "event"
      : normalizeCategory(data.category ?? data.type, fallbackCategory);

  return {
    id,
    slug: String(data.slug ?? slugify(title || id)),
    title,
    description,
    category,
    islandCode: normalizeIsland(data.islandCode ?? data.island) || "st_thomas",
    coordinates: getCoordinates(data),
    coverImage:
      data.coverImage ??
      data.image ??
      data.imageUrl ??
      data.photoUrl ??
      data.thumbnail ??
      data.images?.[0] ??
      data.photos?.[0] ??
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    startAt:
      toDate(data.startAt) ??
      toDate(data.startsAt) ??
      toDate(data.date) ??
      toDate(data.eventDate),
    tags: toStringArray(data.tags),
    address: data.address ?? "",
    areaSlug: data.areaSlug ?? data.neighborhood ?? data.area ?? "",
    source,
  };
}

function localSourcesForCategory(category: string) {
  if (category === "all") {
    return LOCAL_SOURCES.filter((source) => source.includeInDiscovery);
  }

  return LOCAL_SOURCES.filter((source) => source.category === category);
}

function firestoreSourcesForCategory(category: string) {
  const common = [
    { collectionName: "beaches", category: "beach" },
    { collectionName: "places", category: "attraction" },
    { collectionName: "restaurants", category: "restaurant" },
    { collectionName: "historic_sites", category: "history" },
    { collectionName: "historicSites", category: "history" },
    { collectionName: "events", category: "event" },
    { collectionName: "discoveries", category: "attraction" },
  ];

  if (category === "all") {
    return common.filter((source) =>
      ["beach", "restaurant", "attraction", "history"].includes(source.category)
    );
  }

  return common.filter((source) => source.category === category);
}

function categoryResultLimit(category: string) {
  if (category === "all") return 80;
  if (category === "event") return 200;
  return 250;
}

async function loadLocalJson(path: string) {
  try {
    const loader = localCatalogModules[path];

    if (!loader) return [];

    const module = (await loader()) as { default?: unknown };
    return getArray(module.default ?? module);
  } catch (error) {
    console.warn(`Local catalog load failed: ${path}`, error);
    return [];
  }
}

async function localExploreItems(
  selectedIsland: IslandFilter,
  selectedCategory: string
) {
  const sourceResults = await Promise.all(
    localSourcesForCategory(selectedCategory).map(async (source) => {
      const records = await loadLocalJson(source.path);

      return records.map((record, index) => {
        const data = record as Record<string, unknown>;
        const title =
          data.title ??
          data.name ??
          data.businessName ??
          `${source.source}-${index}`;

        return normalizeItem(
          String(data.id ?? data.slug ?? `${source.source}-${slugify(title)}-${index}`),
          {
            ...data,
            islandCode: data.islandCode ?? data.island ?? source.islandCode,
          },
          source.category,
          source.source
        );
      });
    })
  );

  return sourceResults.flat().filter(
    (item) =>
      selectedIsland === "all" ||
      normalizeIsland(item.islandCode) === normalizeIsland(selectedIsland)
  );
}

function cleanEventSeriesTitle(value: unknown) {
  return slugify(value)
    .replace(/\b(mon|monday|tue|tues|tuesday|wed|wednesday|thu|thur|thurs|thursday|fri|friday|sat|saturday|sun|sunday)\b/g, "")
    .replace(/\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\b/g, "")
    .replace(/\b(20[0-9]{2}|19[0-9]{2})\b/g, "")
    .replace(/\b[0-9]{1,2}(st|nd|rd|th)?\b/g, "")
    .replace(/\b(weekly|daily|monthly|recurring|repeat|series|event)\b/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/(^-|-$)/g, "");
}

function eventSeriesKey(item: ExploreItem) {
  return [
    normalizeIsland(item.islandCode),
    "event",
    cleanEventSeriesTitle(item.title || item.slug || item.id),
  ].join("::");
}

function itemTime(item: ExploreItem) {
  return item.startAt instanceof Date && !Number.isNaN(item.startAt.getTime())
    ? item.startAt.getTime()
    : 0;
}

function eventPickScore(item: ExploreItem) {
  const now = Date.now();
  const time = itemTime(item);
  let score = 0;

  if (item.source === "firestore") score += 100;
  if (item.coverImage) score += 20;
  if (item.description) score += 10;
  if (item.coordinates) score += 8;

  if (time >= now) {
    const daysAway = Math.abs(time - now) / 86_400_000;
    score += Math.max(0, 80 - daysAway);
  } else if (time > 0) {
    score -= 25;
  }

  return score;
}

function standardPickScore(item: ExploreItem) {
  return (
    (item.source === "firestore" ? 10 : 0) +
    (item.coverImage ? 8 : 0) +
    (item.description ? 5 : 0) +
    (item.coordinates ? 5 : 0)
  );
}

function dedupeExploreItems(items: ExploreItem[]) {
  const byKey = new Map<string, ExploreItem>();

  for (const item of items) {
    const category = normalizeCategory(item.category, item.category);

    const key =
      category === "event"
        ? eventSeriesKey(item)
        : [
            normalizeIsland(item.islandCode),
            category,
            slugify(item.title || item.slug || item.id),
          ].join("::");

    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, { ...item, category });
      continue;
    }

    const existingScore =
      category === "event" ? eventPickScore(existing) : standardPickScore(existing);

    const itemScore =
      category === "event" ? eventPickScore(item) : standardPickScore(item);

    byKey.set(
      key,
      itemScore >= existingScore
        ? {
            ...existing,
            ...item,
            category,
            tags: Array.from(new Set([...(existing.tags || []), ...(item.tags || [])])),
            coverImage: item.coverImage || existing.coverImage,
            description: item.description || existing.description,
          }
        : existing
    );
  }

  return Array.from(byKey.values()).sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);

    if (a.category === "event" && b.category === "event") {
      const aTime = itemTime(a);
      const bTime = itemTime(b);

      if (aTime && bTime) return aTime - bTime;
      if (aTime) return -1;
      if (bTime) return 1;
    }

    return a.title.localeCompare(b.title);
  });
}

async function loadCollection(
  collectionName: string,
  selectedIsland: IslandFilter,
  fallbackCategory: string,
  maxResults = 120
) {
  const ref = collection(db, collectionName);

  if (selectedIsland !== "all") {
    try {
      const q = query(ref, where("islandCode", "==", selectedIsland), limit(maxResults));
      const snap = await getDocs(q);

      if (!snap.empty) {
        return snap.docs.map((doc) =>
          normalizeItem(doc.id, doc.data(), fallbackCategory, "firestore")
        );
      }
    } catch (error) {
      console.warn(`Filtered ${collectionName} query failed`, error);
    }
  }

  try {
    const snap = await getDocs(query(ref, limit(maxResults)));

    return snap.docs
      .map((doc) => normalizeItem(doc.id, doc.data(), fallbackCategory, "firestore"))
      .filter(
        (item) =>
          selectedIsland === "all" ||
          normalizeIsland(item.islandCode) === normalizeIsland(selectedIsland)
      );
  } catch (error) {
    console.warn(`Collection ${collectionName} query failed`, error);
    return [];
  }
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
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("map");

  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get("category") ?? "all";
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") ?? "all");
  }, [searchParams]);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const activeCategory = selectedCategory;
        const maxResults = categoryResultLimit(activeCategory);
        const firestoreSources = firestoreSourcesForCategory(activeCategory);

        const firestoreGroups = await Promise.all(
          firestoreSources.map((source) =>
            loadCollection(source.collectionName, selectedIsland, source.category, maxResults)
          )
        );

        const localItems = await localExploreItems(selectedIsland, activeCategory);
        const merged = dedupeExploreItems([...localItems, ...firestoreGroups.flat()]);

        if (!cancelled) setItems(merged);
      } catch (error) {
        console.error("Failed to load explore content", error);

        if (!cancelled) {
          const fallbackItems = dedupeExploreItems(
            await localExploreItems(selectedIsland, selectedCategory)
          );

          setItems(fallbackItems);
          setLoadError(
            fallbackItems.length
              ? null
              : "We could not load fresh island discoveries right now. Please try again."
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
  }, [selectedIsland, selectedCategory]);

  const filteredItems = useMemo(() => {
    const queryText = searchQuery.toLowerCase().trim();

    return items.filter((item) => {
      const islandMatch =
        selectedIsland === "all" ||
        normalizeIsland(item.islandCode) === normalizeIsland(selectedIsland);

      const categoryMatch =
        selectedCategory === "all" ||
        normalizeCategory(item.category, item.category) === selectedCategory;

      const searchMatch =
        !queryText ||
        item.title.toLowerCase().includes(queryText) ||
        item.description.toLowerCase().includes(queryText) ||
        item.category.toLowerCase().includes(queryText) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(queryText));

      return islandMatch && categoryMatch && searchMatch;
    });
  }, [items, selectedIsland, selectedCategory, searchQuery]);

  return (
    <div className="pb-24">
      <div className="mb-12 space-y-8 px-8">
        <div className="relative">
          <Search className="absolute left-8 top-1/2 h-6 w-6 -translate-y-1/2 text-stone-300" />
          <input
            type="text"
            placeholder="Search the territory..."
            className="w-full rounded-[2.5rem] border border-stone-100 bg-white py-6 pl-18 pr-8 font-serif text-lg italic shadow-2xl outline-none transition-all focus:border-turquoise focus:ring-4 focus:ring-turquoise/5"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="mb-12 px-8">
        <div className="flex gap-6 overflow-x-auto pb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "flex shrink-0 flex-col items-center gap-4 transition-all active:scale-95",
                selectedCategory === cat.id ? "opacity-100" : "opacity-40 grayscale"
              )}
            >
              <div
                className={cn(
                  "flex h-24 w-24 items-center justify-center rounded-[2.5rem] shadow-2xl transition-all",
                  selectedCategory === cat.id
                    ? "scale-110 bg-ink text-turquoise"
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

      <div className="mb-6 flex items-center justify-between gap-3 px-8">
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded-2xl px-5 py-3 text-sm font-black",
              viewMode === "list" ? "bg-emerald-950 text-white" : "bg-white text-stone-500"
            )}
          >
            List
          </button>

          <button
            onClick={() => setViewMode("map")}
            className={cn(
              "rounded-2xl px-5 py-3 text-sm font-black",
              viewMode === "map" ? "bg-emerald-950 text-white" : "bg-white text-stone-500"
            )}
          >
            Map
          </button>
        </div>

        {!isLoading ? (
          <span className="rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-stone-400 shadow-sm">
            {filteredItems.length} results
          </span>
        ) : null}
      </div>

      <div className="space-y-8 px-8">
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

        {!isLoading && !loadError && filteredItems.length > 0 && viewMode === "map" && (
          <ExploreMapView
            items={filteredItems}
            selectedIsland={selectedIsland}
            onSelectListing={onSelectListing as any}
          />
        )}

        {!isLoading &&
          !loadError &&
          filteredItems.length > 0 &&
          viewMode === "list" &&
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
                  onError={(event) => {
                    event.currentTarget.src =
                      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";
                  }}
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
