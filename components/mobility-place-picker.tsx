"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  Anchor,
  Bookmark,
  Building2,
  Clock3,
  Hotel,
  Landmark,
  Loader2,
  MapPin,
  Plane,
  Search,
  ShieldCheck,
  Umbrella,
  X,
} from "lucide-react";

import {
  SAVED_PLACES_UPDATED_EVENT,
  readSavedPlaces,
  type SavedPlace,
} from "@/lib/saved-places";
import type { EstateRecord, IslandCode } from "@/types/usvi";

type SearchResult = {
  id: string;
  canonicalName: string;
  featureType: string;
  island: string;
  geoid?: string;
  shortDescription?: string;
  relatedEstateGeoids?: string[];
};

type RecentPlace = {
  label: string;
  geoid: string;
  island: string;
  featureType: string;
};

type CategoryId = "all" | "airport" | "ferry" | "beach" | "stay" | "landmark" | "saved";

type Category = {
  id: CategoryId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  types: string;
};

type Props = {
  value: string;
  placeholder: string;
  estates: EstateRecord[];
  island: IslandCode;
  onChange: (geoid: string) => void;
};

const COLLATOR = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const RECENT_STORAGE_KEY = "vi-guide.mobility-recent-places.v1";
const ALL_SEARCH_TYPES = "accommodation,estate,district,settlement,harbor,landmark,bay,beach,road,point";
const CATEGORIES: Category[] = [
  { id: "all", label: "All", icon: Search, types: ALL_SEARCH_TYPES },
  { id: "airport", label: "Airports", icon: Plane, types: "landmark,point,settlement" },
  { id: "ferry", label: "Ferries", icon: Anchor, types: "harbor,landmark,point,settlement" },
  { id: "beach", label: "Beaches", icon: Umbrella, types: "beach,bay" },
  { id: "stay", label: "Stays", icon: Hotel, types: "accommodation" },
  { id: "landmark", label: "Landmarks", icon: Landmark, types: "landmark,point,district,settlement,road" },
  { id: "saved", label: "Saved", icon: Bookmark, types: ALL_SEARCH_TYPES },
];

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function islandCode(island: IslandCode) {
  const value = String(island).toUpperCase();
  if (value.includes("THOMAS") || value === "STT") return "STT";
  if (value.includes("JOHN") || value === "STJ") return "STJ";
  if (value.includes("CROIX") || value === "STX") return "STX";
  return value;
}

function savedIslandCode(island: IslandCode): SavedPlace["island"] | null {
  const code = islandCode(island);
  if (code === "STT") return "stt";
  if (code === "STJ") return "stj";
  if (code === "STX") return "stx";
  return null;
}

function mappedEstateForResult(result: SearchResult, estates: EstateRecord[]) {
  const candidates = [
    ...(result.relatedEstateGeoids || []),
    ...(result.geoid ? [result.geoid] : []),
  ];
  for (const geoid of candidates) {
    const estate = estates.find((candidate) => candidate.geoid === geoid);
    if (estate) return estate;
  }
  return null;
}

function featureLabel(featureType: string) {
  const normalized = normalizeText(featureType);
  if (normalized === "accommodation") return "Stay";
  if (normalized === "harbor") return "Ferry / harbor";
  if (normalized === "beach" || normalized === "bay") return "Beach / bay";
  if (normalized === "settlement" || normalized === "district") return "Area";
  if (normalized === "road") return "Road";
  if (normalized === "estate") return "Fare area";
  if (normalized === "landmark" || normalized === "point") return "Landmark";
  return featureType || "Place";
}

function resultMatchesCategory(result: SearchResult, category: CategoryId) {
  if (category === "all") return true;
  if (category === "saved") return false;
  const type = normalizeText(result.featureType);
  const haystack = normalizeText(`${result.canonicalName} ${result.shortDescription || ""}`);
  if (category === "stay") return type === "accommodation";
  if (category === "beach") return type === "beach" || type === "bay";
  if (category === "airport") {
    return /airport|airfield|cyril e king|rohlsen|seaplane/.test(haystack);
  }
  if (category === "ferry") {
    return type === "harbor" || /ferry|harbor|marine|marina|dock|terminal|red hook|cruz bay/.test(haystack);
  }
  return ["landmark", "point", "district", "settlement", "road"].includes(type);
}

function resultIcon(result: SearchResult) {
  const type = normalizeText(result.featureType);
  const haystack = normalizeText(`${result.canonicalName} ${result.shortDescription || ""}`);
  if (type === "accommodation") return Hotel;
  if (/airport|airfield|cyril e king|rohlsen|seaplane/.test(haystack)) return Plane;
  if (type === "harbor" || /ferry|harbor|terminal|dock/.test(haystack)) return Anchor;
  if (type === "beach" || type === "bay") return Umbrella;
  if (type === "landmark" || type === "point") return Landmark;
  if (type === "estate" || type === "district" || type === "settlement") return Building2;
  return MapPin;
}

function readRecentPlaces(): RecentPlace[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RECENT_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const place = item as Partial<RecentPlace>;
      if (
        typeof place.label !== "string" ||
        typeof place.geoid !== "string" ||
        typeof place.island !== "string" ||
        typeof place.featureType !== "string"
      ) return [];
      return [{
        label: place.label.slice(0, 220),
        geoid: place.geoid.slice(0, 80),
        island: place.island.slice(0, 20),
        featureType: place.featureType.slice(0, 80),
      }];
    }).slice(0, 8);
  } catch {
    return [];
  }
}

function rememberRecentPlace(place: RecentPlace) {
  if (typeof window === "undefined") return;
  const current = readRecentPlaces();
  const next = [
    place,
    ...current.filter((item) => item.geoid !== place.geoid || item.label !== place.label),
  ].slice(0, 8);
  try {
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Recent places are a convenience only; never block governed route selection.
  }
}

export function MobilityPlacePicker({ value, placeholder, estates, island, onChange }: Props) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [labelGeoid, setLabelGeoid] = useState(value || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [recentPlaces, setRecentPlaces] = useState<RecentPlace[]>([]);
  const [savedResolutionMessage, setSavedResolutionMessage] = useState<string | null>(null);

  const currentIslandCode = islandCode(island);
  const currentSavedIsland = savedIslandCode(island);
  const activeCategoryConfig = CATEGORIES.find((category) => category.id === activeCategory) || CATEGORIES[0];
  const sortedEstates = useMemo(
    () => [...estates].sort((a, b) => COLLATOR.compare(a.baseName, b.baseName) || a.geoid.localeCompare(b.geoid)),
    [estates],
  );
  const selectedEstate = estates.find((estate) => estate.geoid === value) ?? null;
  const visibleResults = results.filter((result) => resultMatchesCategory(result, activeCategory));
  const visibleSavedPlaces = savedPlaces.filter((place) => {
    if (currentSavedIsland && place.island !== currentSavedIsland) return false;
    if (!query.trim()) return true;
    return normalizeText(place.title).includes(normalizeText(query));
  });
  const validRecentPlaces = recentPlaces.filter(
    (place) => place.island === currentIslandCode && estates.some((estate) => estate.geoid === place.geoid),
  );

  useEffect(() => {
    function refreshLocalPlaces() {
      setSavedPlaces(readSavedPlaces());
      setRecentPlaces(readRecentPlaces());
    }
    refreshLocalPlaces();
    window.addEventListener(SAVED_PLACES_UPDATED_EVENT, refreshLocalPlaces);
    window.addEventListener("storage", refreshLocalPlaces);
    return () => {
      window.removeEventListener(SAVED_PLACES_UPDATED_EVENT, refreshLocalPlaces);
      window.removeEventListener("storage", refreshLocalPlaces);
    };
  }, []);

  useEffect(() => {
    function closeOnOutsidePointer(event: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsidePointer);
    document.addEventListener("touchstart", closeOnOutsidePointer);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsidePointer);
      document.removeEventListener("touchstart", closeOnOutsidePointer);
    };
  }, []);

  // External route changes (island reset, deep link, or Swap) must never leave a
  // familiar-place label attached to the wrong governed estate.
  useEffect(() => {
    if (value === labelGeoid) return;
    setLabelGeoid(value || "");
    setQuery(selectedEstate?.baseName ?? "");
    setSavedResolutionMessage(null);
  }, [labelGeoid, selectedEstate, value]);

  useEffect(() => {
    if (activeCategory === "saved" || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          q: query.trim(),
          island: currentIslandCode,
          type: activeCategoryConfig.types,
          match: "name",
          limit: "14",
        });
        const response = await fetch(`/api/geography/search?${params}`, { signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Place search unavailable");
        setResults(Array.isArray(payload.results) ? payload.results : []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activeCategory, activeCategoryConfig.types, currentIslandCode, query]);

  function clearGovernedSelectionForEditing(nextQuery: string) {
    if (value) {
      setLabelGeoid("");
      onChange("");
    }
    setQuery(nextQuery);
    setSavedResolutionMessage(null);
    setOpen(true);
  }

  function finishSelection(label: string, estate: EstateRecord, featureType: string) {
    setLabelGeoid(estate.geoid);
    setQuery(label);
    onChange(estate.geoid);
    setSavedResolutionMessage(null);
    setOpen(false);
    const recent = {
      label,
      geoid: estate.geoid,
      island: currentIslandCode,
      featureType,
    };
    rememberRecentPlace(recent);
    setRecentPlaces(readRecentPlaces());
  }

  function chooseResult(result: SearchResult) {
    const mappedEstate = mappedEstateForResult(result, estates);
    if (!mappedEstate) return;
    finishSelection(result.canonicalName, mappedEstate, result.featureType);
  }

  function chooseEstate(estate: EstateRecord) {
    finishSelection(estate.baseName, estate, "estate");
  }

  function chooseRecent(place: RecentPlace) {
    const estate = estates.find((candidate) => candidate.geoid === place.geoid);
    if (!estate) return;
    finishSelection(place.label, estate, place.featureType);
  }

  async function chooseSaved(place: SavedPlace) {
    setSavedResolutionMessage(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: place.title,
        island: currentIslandCode,
        type: ALL_SEARCH_TYPES,
        match: "name",
        limit: "12",
      });
      const response = await fetch(`/api/geography/search?${params}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Place search unavailable");
      const candidates: SearchResult[] = Array.isArray(payload.results) ? payload.results : [];
      const exact = candidates.find(
        (result) =>
          normalizeText(result.canonicalName) === normalizeText(place.title) &&
          Boolean(mappedEstateForResult(result, estates)),
      );
      if (exact) {
        chooseResult(exact);
        return;
      }
      setActiveCategory("all");
      setQuery(place.title);
      setResults(candidates);
      setOpen(true);
      setSavedResolutionMessage("Saved place found, but its taxi fare area still needs confirmation. Choose a governed match below.");
    } catch {
      setActiveCategory("all");
      setQuery(place.title);
      setResults([]);
      setOpen(true);
      setSavedResolutionMessage("We could not verify a governed fare area for this saved place. No fare was selected.");
    } finally {
      setLoading(false);
    }
  }

  const displayValue = open ? query : query || selectedEstate?.baseName || "";
  const estateFallback = sortedEstates
    .filter((estate) => !query.trim() || normalizeText(estate.baseName).includes(normalizeText(query)))
    .slice(0, query.trim() ? 16 : 6);

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#0f766e]" />
        <input
          value={displayValue}
          onFocus={() => setOpen(true)}
          onChange={(event) => clearGovernedSelectionForEditing(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open}
          role="combobox"
          autoComplete="off"
          className="w-full rounded-[20px] border border-slate-200 bg-[#f8f4ea] py-4 pl-12 pr-12 text-base font-black text-[#043331] outline-none transition placeholder:font-semibold placeholder:text-slate-400 focus:border-[#0f766e] focus:bg-white focus:ring-4 focus:ring-teal-100"
        />
        {loading ? (
          <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-teal-700" />
        ) : displayValue ? (
          <button
            type="button"
            onClick={() => clearGovernedSelectionForEditing("")}
            aria-label="Clear place"
            className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          className="fixed bottom-3 left-3 right-3 z-[80] max-h-[72vh] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(3,47,45,.24)] sm:absolute sm:bottom-auto sm:left-0 sm:right-0 sm:top-full sm:mt-2 sm:max-h-[460px] sm:w-full"
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
          <div className="border-b border-slate-100 bg-white px-3 pb-3 pt-3 sm:rounded-t-[28px]">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.16em] text-[#0f766e]">Find a real place</div>
                <div className="mt-0.5 text-xs font-semibold text-slate-500">We connect it to the official taxi fare area underneath.</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close place search"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 sm:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                const active = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(category.id);
                      setSavedResolutionMessage(null);
                    }}
                    className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[9px] font-black uppercase tracking-[.08em] transition ${
                      active
                        ? "border-[#043331] bg-[#043331] text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {category.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-h-[calc(72vh-118px)] overflow-y-auto p-2 sm:max-h-[340px]">
            {savedResolutionMessage ? (
              <div className="m-1 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900">
                {savedResolutionMessage}
              </div>
            ) : null}

            {activeCategory === "saved" ? (
              <div>
                <SectionLabel icon={Bookmark} label="Saved places" />
                {visibleSavedPlaces.length ? (
                  visibleSavedPlaces.slice(0, 12).map((place) => (
                    <button
                      key={`${place.island}:${place.id}`}
                      type="button"
                      onClick={() => void chooseSaved(place)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-teal-50"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#eef8f5] text-[#0f766e]">
                        <Bookmark className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-[#043331]">{place.title}</span>
                        <span className="mt-0.5 block truncate text-[10px] font-bold uppercase tracking-[.08em] text-slate-400">
                          Saved · {featureLabel(place.kind)}
                        </span>
                      </span>
                      <ShieldCheck className="h-4 w-4 shrink-0 text-teal-600" />
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-5 text-sm font-semibold text-slate-500">
                    {query.trim() ? "No saved places match this search." : "No saved places on this island yet."}
                  </div>
                )}
              </div>
            ) : null}

            {activeCategory === "all" && query.trim().length < 2 && validRecentPlaces.length ? (
              <div>
                <SectionLabel icon={Clock3} label="Recent" />
                {validRecentPlaces.slice(0, 4).map((place) => (
                  <button
                    key={`${place.geoid}:${place.label}`}
                    type="button"
                    onClick={() => chooseRecent(place)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-teal-50"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                      <Clock3 className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-[#043331]">{place.label}</span>
                      <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[.08em] text-slate-400">
                        {featureLabel(place.featureType)} · governed fare area saved
                      </span>
                    </span>
                  </button>
                ))}
                <div className="my-2 border-t border-slate-100" />
              </div>
            ) : null}

            {activeCategory !== "saved" && query.trim().length >= 2 ? (
              <div>
                <SectionLabel icon={activeCategoryConfig.icon} label={activeCategoryConfig.label === "All" ? "Best matches" : activeCategoryConfig.label} />
                {visibleResults.map((result) => {
                  const mappedEstate = mappedEstateForResult(result, estates);
                  const Icon = resultIcon(result);
                  return (
                    <button
                      key={`${result.id}-${result.featureType}`}
                      type="button"
                      disabled={!mappedEstate}
                      onClick={() => chooseResult(result)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-55"
                    >
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${mappedEstate ? "bg-[#eef8f5] text-[#0f766e]" : "bg-slate-100 text-slate-400"}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-[#043331]">{result.canonicalName}</span>
                        {result.shortDescription ? (
                          <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">{result.shortDescription}</span>
                        ) : null}
                        <span className={`mt-1 block text-[9px] font-black uppercase tracking-[.09em] ${mappedEstate ? "text-teal-700" : "text-amber-700"}`}>
                          {mappedEstate
                            ? `${featureLabel(result.featureType)} · rate area: ${mappedEstate.baseName}`
                            : `${featureLabel(result.featureType)} · fare area needs review`}
                        </span>
                      </span>
                      <ShieldCheck className={`h-4 w-4 shrink-0 ${mappedEstate ? "text-emerald-600" : "text-amber-500"}`} />
                    </button>
                  );
                })}

                {!loading && visibleResults.length === 0 ? (
                  <div className="px-3 py-5 text-sm font-semibold leading-6 text-slate-500">
                    No governed {activeCategory === "all" ? "place" : activeCategoryConfig.label.toLowerCase()} match yet. Try another name or choose an official fare area below.
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeCategory !== "saved" ? (
              <div className={query.trim().length >= 2 ? "mt-2 border-t border-slate-100 pt-2" : ""}>
                <SectionLabel icon={MapPin} label="Official fare areas" />
                {estateFallback.map((estate) => (
                  <button
                    key={estate.geoid}
                    type="button"
                    onClick={() => chooseEstate(estate)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">{estate.baseName}</span>
                    <span className="text-[8px] font-black uppercase tracking-[.1em] text-slate-400">Rate area</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <p className="mt-2 flex items-start gap-1.5 text-[10px] font-semibold leading-4 text-slate-500">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700" />
        <span>
          {selectedEstate
            ? `Rate area verified: ${selectedEstate.baseName}. Your fare uses only this governed match.`
            : "Search the place you know. A fare appears only after we verify its official taxi rate area."}
        </span>
      </p>
    </div>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 pb-1 pt-2 text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
      <Icon className="h-3.5 w-3.5" /> {label}
    </div>
  );
}
