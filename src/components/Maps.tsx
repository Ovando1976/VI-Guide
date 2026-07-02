import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import IslandMap, { MAP_FILTERS, MapFilter, MapPoint } from "./maps/IslandMap";
import { useMapPoints } from "../hooks/useMapPoints";
import type { IslandCode } from "../types";

type MapsProps = {
  selectedIsland: IslandCode;
  user: any;
};

type AtlasSelection = {
  id: string;
  title: string;
  name?: string;
  label?: string;
  description?: string;
  summary?: string;
  historicalContext?: string;
  modernContext?: string;
  sourceConfidence?: "high" | "medium" | "low";
  sourceNotes?: string[];
  sourceRefs?: string[];
  relatedFeatures?: string[];
  type: string;
  source: string;
  lat?: number;
  lng?: number;
  geoid?: string;
  estate?: string;
  quarter?: string;
  quarterGroup?: string;
  island?: IslandCode;
  coords?: [number, number];
  isEstate?: boolean;
  isParcel?: boolean;
  isPoint?: boolean;
  properties?: Record<string, unknown>;
};

const ISLAND_LABELS: Record<IslandCode, string> = {
  st_thomas: "St. Thomas",
  st_john: "St. John",
  st_croix: "St. Croix",
  water_island: "Water Island",
};

const quickPlaces = [
  ["Charlotte Amalie", "st_thomas"],
  ["Red Hook", "st_thomas"],
  ["Airport", "st_thomas"],
  ["Cruz Bay", "st_john"],
  ["Coral Bay", "st_john"],
  ["Christiansted", "st_croix"],
  ["Frederiksted", "st_croix"],
] as const;

function validIsland(value: string | null | undefined): IslandCode {
  if (
    value === "st_thomas" ||
    value === "st_john" ||
    value === "st_croix" ||
    value === "water_island"
  ) {
    return value;
  }

  return "st_thomas";
}

function selectionTitle(selection: AtlasSelection) {
  return selection.title || selection.name || selection.estate || "Selected place";
}

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function getProp(selection: AtlasSelection, key: string) {
  return selection.properties?.[key];
}

function getEstateId(selection: AtlasSelection) {
  const props = selection.properties ?? {};

  const officialId = cleanString(
    getProp(selection, "officialId") ||
      getProp(selection, "geoid") ||
      getProp(selection, "GEOID") ||
      getProp(selection, "sourceObjectId") ||
      getProp(selection, "estateId") ||
      props.officialId ||
      props.geoid ||
      props.GEOID ||
      props.sourceObjectId ||
      props.estateId ||
      selection.geoid,
  );

  if (officialId && officialId !== "-1") return officialId;

  return cleanString(
    getProp(selection, "displayName") ||
      getProp(selection, "name") ||
      getProp(selection, "estate") ||
      selection.title,
  ).replace(/^Estate\\s+/i, "");
}

function navigateHard(path: string, navigate: ReturnType<typeof useNavigate>) {
  try {
    navigate(path);
  } catch {
    window.location.href = path;
  }
}

function buildEstatePath(selection: AtlasSelection, islandFromUrl: IslandCode) {
  const estateId = getEstateId(selection);
  const safeEstateId = encodeURIComponent(estateId || selection.id || selectionTitle(selection));
  return `/estates/${safeEstateId}?island=${islandFromUrl}`;
}

function buildEstateHistoryPath(selection: AtlasSelection, islandFromUrl: IslandCode) {
  const estateId = getEstateId(selection);
  const safeEstateId = encodeURIComponent(estateId || selection.id || selectionTitle(selection));
  const context = encodeURIComponent(selectionTitle(selection));
  return `/history?estate=${safeEstateId}&island=${islandFromUrl}&context=${context}`;
}

function buildEstateArchivesPath(selection: AtlasSelection, islandFromUrl: IslandCode) {
  const estateId = getEstateId(selection);
  const safeEstateId = encodeURIComponent(estateId || selection.id || selectionTitle(selection));
  const context = encodeURIComponent(selectionTitle(selection));
  return `/estates/${safeEstateId}/archives?island=${islandFromUrl}&context=${context}`;
}

function getEstateHighlightKey(selection: AtlasSelection | null) {
  if (!selection) return null;

  const isEstate =
    selection.isEstate ||
    selection.type === "estate" ||
    selection.source === "estate";

  if (!isEstate) return null;

  return (
    cleanString(selection.geoid) ||
    cleanString(getProp(selection, "geoid")) ||
    cleanString(getProp(selection, "GEOID")) ||
    cleanString(getProp(selection, "estateId")) ||
    cleanString(getProp(selection, "name")) ||
    cleanString(getProp(selection, "baseName")) ||
    cleanString(getProp(selection, "fullName")) ||
    cleanString(getProp(selection, "estate")) ||
    cleanString(selection.name) ||
    cleanString(selection.title) ||
    cleanString(selection.id) ||
    null
  );
}

function getCoordsFromSelection(selection: AtlasSelection | MapPoint | null) {
  if (!selection) return null;

  if ("coords" in selection && Array.isArray(selection.coords)) {
    const lng = Number(selection.coords[0]);
    const lat = Number(selection.coords[1]);

    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return [lng, lat] as [number, number];
    }
  }

  const lat = Number(selection.lat);
  const lng = Number(selection.lng);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return [lng, lat] as [number, number];
  }

  return null;
}

function openDirections(selection: AtlasSelection) {
  const lat = selection.lat ?? selection.coords?.[1];
  const lng = selection.lng ?? selection.coords?.[0];

  const query =
    typeof lat === "number" && typeof lng === "number"
      ? `${lat},${lng}`
      : encodeURIComponent(selectionTitle(selection));

  window.open(
    `https://www.google.com/maps/search/?api=1&query=${query}`,
    "_blank",
    "noopener,noreferrer",
  );
}

function normalizeFeature(feature: IslandMapSelection): AtlasSelection {
  const props = (feature.properties ?? {}) as Record<string, unknown>;

  const profile = getEstateProfileForSelection({
    id: feature.id,
    geoid: feature.geoid,
    name: feature.name,
    title: feature.title,
    estate: feature.estate,
    properties: props,
  });

  const isEstate =
    Boolean(feature.isEstate) ||
    feature.source === "estate" ||
    feature.type === "estate";

  const isParcel =
    Boolean(feature.isParcel) ||
    feature.source === "parcel" ||
    feature.type === "parcel";

  const isPoint =
    Boolean(feature.isPoint) ||
    feature.source === "point-marker" ||
    feature.type === "point-marker";

  const fallbackTitle =
    feature.title ||
    feature.name ||
    feature.estate ||
    cleanString(props.title) ||
    cleanString(props.name) ||
    cleanString(props.baseName) ||
    cleanString(props.fullName) ||
    cleanString(props.estate) ||
    "Selected location";

  const title = profile?.displayName || fallbackTitle;

  const id =
    cleanString(profile?.estateId) ||
    cleanString(feature.geoid) ||
    cleanString(props.officialId) ||
    cleanString(props.geoid) ||
    cleanString(props.GEOID) ||
    cleanString(props.sourceObjectId) ||
    cleanString(props.estateId) ||
    cleanString(props.ESTATE_ID) ||
    cleanString(props.EstateID) ||
    cleanString(props.id) ||
    cleanString(props.ID) ||
    cleanString(feature.id) ||
    title;

  const coords =
    Array.isArray(feature.coords) && feature.coords.length >= 2
      ? ([Number(feature.coords[0]), Number(feature.coords[1])] as [number, number])
      : undefined;

  const description = profile?.description || feature.description;

  return {
    id,
    title,
    name: profile?.displayName || feature.name || title,
    description,
    summary: profile?.summary,
    historicalContext: profile?.historicalContext,
    modernContext: profile?.modernContext,
    sourceConfidence: profile?.sourceConfidence,
    sourceNotes: profile?.sourceNotes,
    sourceRefs: profile?.sourceRefs,
    relatedFeatures: profile?.relatedFeatures,
    type: isEstate ? "estate" : isParcel ? "parcel" : feature.type || "place",
    source: feature.source || (isEstate ? "estate" : isParcel ? "parcel" : "map"),
    lat: typeof feature.lat === "number" ? feature.lat : coords?.[1],
    lng: typeof feature.lng === "number" ? feature.lng : coords?.[0],
    geoid:
      cleanString(feature.geoid) ||
      cleanString(props.geoid) ||
      cleanString(props.GEOID) ||
      cleanString(props.estateId) ||
      profile?.estateId ||
      undefined,
    estate:
      profile?.displayName ||
      feature.estate ||
      cleanString(props.estate) ||
      cleanString(props.ESTATE) ||
      cleanString(props.name) ||
      undefined,
    quarter:
      profile?.quarter ||
      feature.quarter ||
      cleanString(props.quarter) ||
      undefined,
    quarterGroup:
      feature.quarterGroup || cleanString(props.quarterGroup) || undefined,
    island: profile?.island || feature.island,
    coords,
    isEstate,
    isParcel,
    isPoint,
    properties: {
      ...props,
      canonicalEstateId: profile?.estateId,
      canonicalSlug: profile?.slug,
      canonicalSummary: profile?.summary,
      description,
      summary: profile?.summary,
      historicalContext: profile?.historicalContext,
      modernContext: profile?.modernContext,
      sourceConfidence: profile?.sourceConfidence,
      sourceNotes: profile?.sourceNotes,
      sourceRefs: profile?.sourceRefs,
      relatedFeatures: profile?.relatedFeatures,
    },
  };
  name?: string;
  label?: string;
  description?: string;
  summary?: string;
  historicalContext?: string;
  modernContext?: string;
  sourceConfidence?: "high" | "medium" | "low";
  sourceNotes?: string[];
  sourceRefs?: string[];
  relatedFeatures?: string[];
  type: string;
  source: string;
  lat?: number;
  lng?: number;
  geoid?: string;
  estate?: string;
  quarter?: string;
  quarterGroup?: string;
  island?: IslandCode;
  coords?: [number, number];
  isEstate?: boolean;
  isParcel?: boolean;
  isPoint?: boolean;
  properties?: Record<string, unknown>;
};

const ISLAND_LABELS: Record<IslandCode, string> = {
  st_thomas: "St. Thomas",
  st_john: "St. John",
  st_croix: "St. Croix",
  water_island: "Water Island",
};

const quickPlaces = [
  ["Charlotte Amalie", "st_thomas"],
  ["Red Hook", "st_thomas"],
  ["Airport", "st_thomas"],
  ["Cruz Bay", "st_john"],
  ["Coral Bay", "st_john"],
  ["Christiansted", "st_croix"],
  ["Frederiksted", "st_croix"],
] as const;

function validIsland(value: string | null | undefined): IslandCode {
  if (
    value === "st_thomas" ||
    value === "st_john" ||
    value === "st_croix" ||
    value === "water_island"
  ) {
    return value;
  }

  return "st_thomas";
}

function selectionTitle(selection: AtlasSelection) {
  return selection.title || selection.name || selection.estate || "Selected place";
}

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function getProp(selection: AtlasSelection, key: string) {
  return selection.properties?.[key];
}

function getEstateId(selection: AtlasSelection) {
  const props = selection.properties ?? {};

  const officialId = cleanString(
    getProp(selection, "officialId") ||
      getProp(selection, "geoid") ||
      getProp(selection, "GEOID") ||
      getProp(selection, "sourceObjectId") ||
      getProp(selection, "estateId") ||
      props.officialId ||
      props.geoid ||
      props.GEOID ||
      props.sourceObjectId ||
      props.estateId ||
      selection.geoid,
  );

  if (officialId && officialId !== "-1") return officialId;

  return cleanString(
    getProp(selection, "displayName") ||
      getProp(selection, "name") ||
      getProp(selection, "estate") ||
      selection.title,
  ).replace(/^Estate\\s+/i, "");
}

function navigateHard(path: string, navigate: ReturnType<typeof useNavigate>) {
  try {
    navigate(path);
  } catch {
    window.location.href = path;
  }
}

function buildEstatePath(selection: AtlasSelection, islandFromUrl: IslandCode) {
  const estateId = getEstateId(selection);
  const safeEstateId = encodeURIComponent(estateId || selection.id || selectionTitle(selection));
  return `/estates/${safeEstateId}?island=${islandFromUrl}`;
}

function buildEstateHistoryPath(selection: AtlasSelection, islandFromUrl: IslandCode) {
  const estateId = getEstateId(selection);
  const safeEstateId = encodeURIComponent(estateId || selection.id || selectionTitle(selection));
  const context = encodeURIComponent(selectionTitle(selection));
  return `/history?estate=${safeEstateId}&island=${islandFromUrl}&context=${context}`;
}

function buildEstateArchivesPath(selection: AtlasSelection, islandFromUrl: IslandCode) {
  const estateId = getEstateId(selection);
  const safeEstateId = encodeURIComponent(estateId || selection.id || selectionTitle(selection));
  const context = encodeURIComponent(selectionTitle(selection));
  return `/estates/${safeEstateId}/archives?island=${islandFromUrl}&context=${context}`;
}

function getEstateHighlightKey(selection: AtlasSelection | null) {
  if (!selection) return null;

  const isEstate =
    selection.isEstate ||
    selection.type === "estate" ||
    selection.source === "estate";

  if (!isEstate) return null;

  return (
    cleanString(selection.geoid) ||
    cleanString(getProp(selection, "geoid")) ||
    cleanString(getProp(selection, "GEOID")) ||
    cleanString(getProp(selection, "estateId")) ||
    cleanString(getProp(selection, "name")) ||
    cleanString(getProp(selection, "baseName")) ||
    cleanString(getProp(selection, "fullName")) ||
    cleanString(getProp(selection, "estate")) ||
    cleanString(selection.name) ||
    cleanString(selection.title) ||
    cleanString(selection.id) ||
    null
  );
}

function getCoordsFromSelection(selection: AtlasSelection | MapPoint | null) {
  if (!selection) return null;

  if ("coords" in selection && Array.isArray(selection.coords)) {
    const lng = Number(selection.coords[0]);
    const lat = Number(selection.coords[1]);

    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return [lng, lat] as [number, number];
    }
  }

  const lat = Number(selection.lat);
  const lng = Number(selection.lng);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return [lng, lat] as [number, number];
  }

  return null;
}

function openDirections(selection: AtlasSelection) {
  const lat = selection.lat ?? selection.coords?.[1];
  const lng = selection.lng ?? selection.coords?.[0];

  const query =
    typeof lat === "number" && typeof lng === "number"
      ? `${lat},${lng}`
      : encodeURIComponent(selectionTitle(selection));

  window.open(
    `https://www.google.com/maps/search/?api=1&query=${query}`,
    "_blank",
    "noopener,noreferrer",
  );
}

function normalizeFeature(feature: IslandMapSelection): AtlasSelection {
  const props = (feature.properties ?? {}) as Record<string, unknown>;

  const profile = getEstateProfileForSelection({
    id: feature.id,
    geoid: feature.geoid,
    name: feature.name,
    title: feature.title,
    estate: feature.estate,
    properties: props,
  });

  const isEstate =
    Boolean(feature.isEstate) ||
    feature.source === "estate" ||
    feature.type === "estate";

  const isParcel =
    Boolean(feature.isParcel) ||
    feature.source === "parcel" ||
    feature.type === "parcel";

  const isPoint =
    Boolean(feature.isPoint) ||
    feature.source === "point-marker" ||
    feature.type === "point-marker";

  const fallbackTitle =
    feature.title ||
    feature.name ||
    feature.estate ||
    cleanString(props.title) ||
    cleanString(props.name) ||
    cleanString(props.baseName) ||
    cleanString(props.fullName) ||
    cleanString(props.estate) ||
    "Selected location";

  const title = profile?.displayName || fallbackTitle;

  const id =
    cleanString(profile?.estateId) ||
    cleanString(feature.geoid) ||
    cleanString(props.officialId) ||
    cleanString(props.geoid) ||
    cleanString(props.GEOID) ||
    cleanString(props.sourceObjectId) ||
    cleanString(props.estateId) ||
    cleanString(props.ESTATE_ID) ||
    cleanString(props.EstateID) ||
    cleanString(props.id) ||
    cleanString(props.ID) ||
    cleanString(feature.id) ||
    title;

  const coords =
    Array.isArray(feature.coords) && feature.coords.length >= 2
      ? ([Number(feature.coords[0]), Number(feature.coords[1])] as [number, number])
      : undefined;

  const description = profile?.description || feature.description;

  return {
    id,
    title,
    name: profile?.displayName || feature.name || title,
    description,
    summary: profile?.summary,
    historicalContext: profile?.historicalContext,
    modernContext: profile?.modernContext,
    sourceConfidence: profile?.sourceConfidence,
    sourceNotes: profile?.sourceNotes,
    sourceRefs: profile?.sourceRefs,
    relatedFeatures: profile?.relatedFeatures,
    type: isEstate ? "estate" : isParcel ? "parcel" : feature.type || "place",
    source: feature.source || (isEstate ? "estate" : isParcel ? "parcel" : "map"),
    lat: typeof feature.lat === "number" ? feature.lat : coords?.[1],
    lng: typeof feature.lng === "number" ? feature.lng : coords?.[0],
    geoid:
      cleanString(feature.geoid) ||
      cleanString(props.geoid) ||
      cleanString(props.GEOID) ||
      cleanString(props.estateId) ||
      profile?.estateId ||
      undefined,
    estate:
      profile?.displayName ||
      feature.estate ||
      cleanString(props.estate) ||
      cleanString(props.ESTATE) ||
      cleanString(props.name) ||
      undefined,
    quarter:
      profile?.quarter ||
      feature.quarter ||
      cleanString(props.quarter) ||
      undefined,
    quarterGroup:
      feature.quarterGroup || cleanString(props.quarterGroup) || undefined,
    island: profile?.island || feature.island,
    coords,
    isEstate,
    isParcel,
    isPoint,
    properties: {
      ...props,
      canonicalEstateId: profile?.estateId,
      canonicalSlug: profile?.slug,
      canonicalSummary: profile?.summary,
      description,
      summary: profile?.summary,
      historicalContext: profile?.historicalContext,
      modernContext: profile?.modernContext,
      sourceConfidence: profile?.sourceConfidence,
      sourceNotes: profile?.sourceNotes,
      sourceRefs: profile?.sourceRefs,
      relatedFeatures: profile?.relatedFeatures,
    },
  };
}

export default function Maps({ selectedIsland }: MapsProps) {
  const [activeFilter, setActiveFilter] = useState<MapFilter>("all");
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dayPlan, setDayPlan] = useState<MapPoint[]>([]);
  const navigate = useNavigate();

  const { points, loading, error } = useMapPoints(selectedIsland);

  const activeLabel = useMemo(
    () =>
      MAP_FILTERS.find((filter) => filter.id === activeFilter)?.label ?? "All",
    [activeFilter]
  );

  const filteredPoints = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return points.filter((point) => {
      const filterMatch = activeFilter === "all" || point.type === activeFilter;

      const searchMatch =
        !q ||
        point.title.toLowerCase().includes(q) ||
        point.description.toLowerCase().includes(q) ||
        point.type.toLowerCase().includes(q);

      return filterMatch && searchMatch;
    });
  }, [points, activeFilter, searchQuery]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return filteredPoints.slice(0, 6);
  }, [filteredPoints, searchQuery]);

  const addToDayPlan = (point: MapPoint) => {
    setDayPlan((current) => {
      const next = current.some((item) => item.id === point.id)
        ? current
        : [...current, point];

      window.localStorage.setItem("viNavigatorDayPlan", JSON.stringify(next));

      return next;
    });

    navigate("/cruise");
  };

  return (
    <main className="min-h-screen bg-stone-50 pb-28">
      <section className="px-4 pt-6">
        <div className="rounded-3xl bg-emerald-950 p-5 text-white shadow-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
            Live Map
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Explore the Virgin Islands
          </h1>

          <p className="mt-2 text-sm text-emerald-50">
            Search beaches, ports, historic sites, food, events, and visitor
            places.
          </p>

          {dayPlan.length > 0 && (
            <div className="mt-4 rounded-2xl bg-white/10 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-100">
                Day Plan
              </p>
              <p className="mt-1 text-sm font-bold text-white">
                {dayPlan.length} stop{dayPlan.length === 1 ? "" : "s"} added
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-5 px-4">
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search Magens Bay, ferry, history..."
            className="w-full rounded-2xl bg-white py-4 pl-12 pr-12 text-sm font-bold text-stone-900 shadow outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedPoint(null);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
            >
              <X size={18} />
            </button>
          )}

          {searchResults.length > 0 && (
            <div className="absolute inset-x-0 top-full z-[700] mt-2 overflow-hidden rounded-3xl bg-white shadow-2xl">
              {searchResults.map((point) => (
                <button
                  key={`${point.type}-${point.id}`}
                  onClick={() => {
                    setSelectedPoint(point);
                    setSearchQuery(point.title);
                  }}
                  className="w-full border-b border-stone-100 p-4 text-left last:border-b-0"
                >
                  <p className="text-sm font-black text-stone-950">
                    {point.title}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                    {point.type}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3">
          {MAP_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                setActiveFilter(filter.id);
                setSelectedPoint(null);
              }}
              className={`shrink-0 rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] shadow ${
                activeFilter === filter.id
                  ? "bg-emerald-950 text-white"
                  : "bg-white text-stone-500"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="relative h-[68vh] overflow-hidden rounded-3xl bg-stone-200 shadow-2xl">
          <IslandMap
            selectedIsland={selectedIsland}
            activeFilter={activeFilter}
            selectedPointId={selectedPoint?.id ?? null}
            points={filteredPoints}
            onSelectPoint={setSelectedPoint}
          />

          <div className="absolute left-3 top-3 z-[500] rounded-2xl bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
              Showing
            </p>
            <p className="text-sm font-bold text-stone-950">
              {loading
                ? "Loading..."
                : `${activeLabel} • ${filteredPoints.length}`}
            </p>
          </div>

          {error && (
            <div className="absolute inset-x-3 top-24 z-[500] rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 shadow-xl">
              {error}
            </div>
          )}

          {!loading && !error && filteredPoints.length === 0 && (
            <div className="absolute inset-x-3 bottom-3 z-[500] rounded-3xl bg-white p-4 text-sm font-bold text-stone-700 shadow-2xl">
              No places match this search or filter.
            </div>
          )}

          {selectedPoint && (
            <div className="absolute inset-x-3 bottom-3 z-[500] rounded-3xl bg-white p-4 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
                    {selectedPoint.type}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-stone-950">
                    {selectedPoint.title}
                  </h2>
                </div>

                <button
                  onClick={() => setSelectedPoint(null)}
                  className="rounded-full bg-stone-100 p-2 text-stone-500"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="mt-2 text-sm text-stone-600">
                {selectedPoint.description}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => addToDayPlan(selectedPoint)}
                  className="rounded-2xl bg-emerald-950 px-4 py-3 text-sm font-bold text-white"
                >
                  Add to Day Plan
                </button>
                <button
                  onClick={() => openDirections(selectedPoint)}
                  className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-bold text-stone-800"
                >
                  Directions
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
