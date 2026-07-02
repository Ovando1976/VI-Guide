import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Bell, MapPinned, Menu, Sparkles } from "lucide-react";

import AtlasBottomDock from "./atlas/AtlasBottomDock";
import AtlasInspector, { pointToSelection } from "./atlas/AtlasInspector";
import AtlasSearch from "./atlas/AtlasSearch";
import AtlasSidebar from "./atlas/AtlasSidebar";
import IslandMap, {
  type AtlasSelection as IslandMapSelection,
} from "./maps/IslandMap";
import { useMapPoints } from "../hooks/useMapPoints";
import { getEstateProfileForSelection } from "../data/canonical/estateProfiles";
import type { IslandCode } from "../types";

type MapsProps = {
  selectedIsland?: IslandCode;
  user?: unknown;
};

type MapFilter = "all" | "estates" | "places" | "parcels";

type MapPoint = {
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
  island?: IslandCode;
  lat?: number;
  lng?: number;
  source?: string;
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

async function hydrateSelectionLazily(selection: AtlasSelection) {
  try {
    const module = await import("../data/canonical/atlasProfileResolver");
    return module.hydrateAtlasSelection(selection);
  } catch (error) {
    console.warn("[Maps] Failed to hydrate atlas selection", error);
    return selection;
  }
}

function slugifyEstate(value: unknown) {
  return cleanString(value)
    .replace(/^Estate\s+/i, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getEstateId(selection: AtlasSelection) {
  const props = selection.properties ?? {};

  const candidates = [
    props.canonicalId,
    props.canonicalID,
    props.officialId,
    props.officialID,
    props.geoid,
    props.GEOID,
    selection.geoid,
    props.estateId,
    props.ESTATE_ID,
  ]
    .map((value) => cleanString(value))
    .filter(Boolean)
    .filter((value) => value !== "-1");

  const canonical = candidates.find((value) =>
    value.includes(":") ||
    value.includes("st_thomas") ||
    value.includes("st_john") ||
    value.includes("st_croix") ||
    value.includes("water_island")
  );

  if (canonical) return canonical;

  const estateName = cleanString(
    selection.estate ||
      selection.name ||
      selection.title ||
      props.estate ||
      props.ESTATE ||
      props.name ||
      props.NAME ||
      props.label ||
      props.LABEL ||
      props.displayName
  );

  const island = cleanString(
    selection.island ||
      props.island ||
      props.ISLAND ||
      props.islandCode ||
      props.ISLAND_CODE ||
      "st_thomas"
  );

  const estateSlug = slugifyEstate(estateName);

  if (estateSlug && island) {
    return `${island}:${estateSlug}`;
  }

  return candidates[0] || estateSlug || "";
}


function getEstateQuarter(selection: AtlasSelection) {
  const props = selection.properties ?? {};

  return cleanString(
    getProp(selection, "quarter") ||
      getProp(selection, "QUARTER") ||
      getProp(selection, "quarterGroup") ||
      getProp(selection, "QUARTER_GROUP") ||
      props.quarter ||
      props.QUARTER ||
      props.quarterGroup ||
      props.QUARTER_GROUP ||
      selection.quarter ||
      selection.quarterGroup,
  );
}

function buildEstateRouteQuery(selection: AtlasSelection, islandFromUrl: IslandCode) {
  const params = new URLSearchParams();

  params.set("island", islandFromUrl);

  const quarter = getEstateQuarter(selection);
  if (quarter) params.set("quarter", quarter);

  const context = selectionTitle(selection);
  if (context) params.set("context", context);

  const props = selection.properties ?? {};
  const lat = selection.lat ?? selection.coords?.[1] ?? Number(props.lat ?? props.LAT ?? props.latitude);
  const lng = selection.lng ?? selection.coords?.[0] ?? Number(props.lng ?? props.LNG ?? props.lon ?? props.longitude);

  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= 17.5 &&
    lat <= 18.6 &&
    lng >= -65.2 &&
    lng <= -64.4
  ) {
    params.set("lat", String(lat));
    params.set("lng", String(lng));
  }

  return params.toString();
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
  const safeEstateId = encodeURIComponent(estateId || selectionTitle(selection));
  return `/estates/${safeEstateId}?${buildEstateRouteQuery(selection, islandFromUrl)}`;
}

function buildEstateHistoryPath(selection: AtlasSelection, islandFromUrl: IslandCode) {
  const estateId = getEstateId(selection);
  const safeEstateId = encodeURIComponent(estateId || selectionTitle(selection));
  return `/history?estate=${safeEstateId}&${buildEstateRouteQuery(selection, islandFromUrl)}`;
}

function buildEstateArchivesPath(selection: AtlasSelection, islandFromUrl: IslandCode) {
  const estateId = getEstateId(selection);
  const safeEstateId = encodeURIComponent(estateId || selectionTitle(selection));
  return `/estates/${safeEstateId}/archives?${buildEstateRouteQuery(selection, islandFromUrl)}`;
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


export default function Maps({ selectedIsland = "st_thomas" }: MapsProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const islandFromUrl = validIsland(searchParams.get("island") ?? selectedIsland);

  const [activeFilter, setActiveFilter] = useState<MapFilter>("all");
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<AtlasSelection | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showParcels, setShowParcels] = useState(true);
  const [showEstateLabels, setShowEstateLabels] = useState(true);
  const [savedCount, setSavedCount] = useState(0);

  const [dayPlan, setDayPlan] = useState<AtlasSelection[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("viNavigatorDayPlan") || "[]");
    } catch {
      return [];
    }
  });

  const { points, loading, error } = useMapPoints(islandFromUrl);

  const normalizedPoints = useMemo(
    () =>
      points.map((point: any) => ({
        ...point,
        title: point.title || point.name || point.label || "Untitled place",
        type: point.type || "places",
        source: point.source || "point-marker",
      })) as MapPoint[],
    [points],
  );

  const filteredPoints = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return normalizedPoints.filter((point) => {
      const type = point.type.toLowerCase();

      const filterMatch =
        activeFilter === "all" ||
        type === activeFilter ||
        (activeFilter === "estates" && type === "estate") ||
        (activeFilter === "parcels" && type === "parcel") ||
        (activeFilter === "places" && type !== "estate" && type !== "parcel");

      const searchMatch =
        !q ||
        point.title.toLowerCase().includes(q) ||
        (point.name || "").toLowerCase().includes(q) ||
        (point.label || "").toLowerCase().includes(q) ||
        (point.description || "").toLowerCase().includes(q) ||
        point.type.toLowerCase().includes(q);

      return filterMatch && searchMatch;
    });
  }, [normalizedPoints, activeFilter, searchQuery]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return filteredPoints.slice(0, 8);
  }, [filteredPoints, searchQuery]);

  const selectedEstateHighlight = useMemo(
    () => getEstateHighlightKey(selectedFeature),
    [selectedFeature],
  );

  const focusTarget = useMemo(() => {
    const target = selectedFeature ?? selectedPoint;
    const center = getCoordsFromSelection(target);

    if (!center) return null;

    return {
      center,
      title: "title" in target ? target.title : undefined,
      name: "name" in target ? target.name : undefined,
      zoom:
        selectedFeature?.isEstate || selectedFeature?.type === "estate"
          ? 14
          : selectedFeature?.isParcel || selectedFeature?.type === "parcel"
            ? 17
            : 15,
      pitch: 58,
      bearing: -10,
    };
  }, [selectedFeature, selectedPoint]);

  function changeIsland(nextIsland: IslandCode) {
    setSelectedPoint(null);
    setSelectedFeature(null);
    setSearchQuery("");
    setSearchParams({ island: nextIsland });
  }

  function selectPoint(point: MapPoint) {
    const selection = pointToSelection(point as any) as AtlasSelection;

    const normalizedSelection: AtlasSelection = {
      ...selection,
      id: cleanString(selection.id) || point.id,
      title: selection.title || point.title || point.name || point.label || "Selected place",
      type: selection.type || point.type || "place",
      source: selection.source || point.source || "point-marker",
      lat: selection.lat ?? point.lat,
      lng: selection.lng ?? point.lng,
      island: selection.island ?? point.island,
      isPoint: true,
      isEstate: selection.type === "estate" || point.type === "estate",
      isParcel: selection.type === "parcel" || point.type === "parcel",
    };

    setSelectedPoint(point);
    hydrateSelectionLazily(normalizedSelection).then(setSelectedFeature);
    setSearchQuery(point.title);
  }

  function selectFeature(feature: IslandMapSelection) {
    const normalizedFeature = normalizeFeature(feature);

    hydrateSelectionLazily(normalizedFeature).then(setSelectedFeature);

    if (normalizedFeature.source === "point-marker" || normalizedFeature.isPoint) {
      const match = normalizedPoints.find(
        (point) => String(point.id) === String(normalizedFeature.id),
      );
      setSelectedPoint(match ?? null);
    } else {
      setSelectedPoint(null);
    }
  }

  function clearSelection() {
    setSelectedPoint(null);
    setSelectedFeature(null);
  }

  function addToDayPlan(selection: AtlasSelection) {
    setDayPlan((current) => {
      const next = current.some(
        (item) => item.id === selection.id && item.source === selection.source,
      )
        ? current
        : [...current, selection];

      localStorage.setItem("viNavigatorDayPlan", JSON.stringify(next));
      return next;
    });
  }

  function askAI(selection?: AtlasSelection | null) {
    if (!selection) {
      navigate(`/concierge?island=${islandFromUrl}`);
      return;
    }

    const lat = selection.lat ?? selection.coords?.[1] ?? 0;
    const lng = selection.lng ?? selection.coords?.[0] ?? 0;

    const params = new URLSearchParams({
      island: islandFromUrl,
      place: selectionTitle(selection),
      atlasId: selection.id,
      atlasType: selection.type,
      source: selection.source,
      lat: String(lat),
      lng: String(lng),
    });

    navigate(`/concierge?${params.toString()}`);
  }

  function openEstate(selection: AtlasSelection) {
    const path = buildEstatePath(selection, islandFromUrl);
    clearSelection();
    navigateHard(path, navigate);
  }

  function openEstateHistory(selection: AtlasSelection) {
    const path = buildEstateHistoryPath(selection, islandFromUrl);
    clearSelection();
    navigateHard(path, navigate);
  }

  function openEstateArchives(selection: AtlasSelection) {
    const path = buildEstateArchivesPath(selection, islandFromUrl);
    clearSelection();
    navigateHard(path, navigate);
  }

  return (
    <main className="relative h-screen overflow-hidden bg-[#061016] text-white">
      <IslandMap
        selectedIsland={islandFromUrl}
        activeFilter={activeFilter}
        selectedPointId={selectedPoint?.id ?? null}
        points={filteredPoints}
        onSelectPoint={selectPoint}
        onSelectFeature={selectFeature}
        embedded
        interactive
        showControls
        showEstateBoundaries
        showEstateLabels={showEstateLabels}
        showParcels={showParcels}
        showParcelLabels={showParcels}
        focusTarget={focusTarget}
        highlightEstate={selectedEstateHighlight}
        className="h-full w-full"
      />

      <header className="absolute inset-x-0 top-0 z-[800] bg-gradient-to-b from-black/80 via-black/30 to-transparent px-4 py-4">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((value) => !value)}
            className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-slate-950/80 shadow-xl backdrop-blur transition hover:bg-white/10"
            aria-label="Toggle atlas sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 shadow-xl backdrop-blur transition hover:bg-white/10"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 text-slate-950">
              <MapPinned className="h-5 w-5" />
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-200">
                VI Guide
              </p>
              <p className="text-sm font-black">Territory Atlas</p>
            </div>
          </button>

          <div className="hidden flex-1 md:block">
            <AtlasSearch
              value={searchQuery}
              results={searchResults as any}
              onChange={setSearchQuery}
              onClear={() => {
                setSearchQuery("");
                clearSelection();
              }}
              onSelect={(point: any) => selectPoint(point)}
            />
          </div>

          <button
            type="button"
            onClick={() => askAI(selectedFeature)}
            className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm font-black shadow-xl backdrop-blur transition hover:bg-white/10 lg:flex"
          >
            <Sparkles className="h-4 w-4 text-emerald-300" />
            AI Concierge
          </button>

          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-slate-950/80 shadow-xl backdrop-blur"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-auto mt-4 flex max-w-[1500px] gap-2 overflow-x-auto pl-0 lg:pl-[310px]">
          {Object.entries(ISLAND_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => changeIsland(value as IslandCode)}
              className={`shrink-0 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-[0.18em] shadow-xl backdrop-blur transition ${
                islandFromUrl === value
                  ? "bg-emerald-400 text-slate-950"
                  : "border border-white/10 bg-slate-950/80 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}

          {quickPlaces.map(([label, island]) => (
            <button
              key={label}
              type="button"
              onClick={() => changeIsland(island)}
              className="shrink-0 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-xs font-bold shadow-xl backdrop-blur transition hover:bg-white/10"
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {sidebarOpen && (
        <AtlasSidebar
          activeFilter={activeFilter}
          showParcels={showParcels}
          showEstateLabels={showEstateLabels}
          savedCount={savedCount}
          dayPlanCount={dayPlan.length}
          onOpenHistory={() => navigate(`/history?island=${islandFromUrl}`)}
          onOpenRoutePlanner={() => navigate(`/mobility?island=${islandFromUrl}`)}
          onOpenSavedPlaces={() => navigate(`/profile?tab=saved&island=${islandFromUrl}`)}
          onOpenDayPlan={() => navigate(`/explore?tab=day-plan&island=${islandFromUrl}`)}
          onFilterChange={(filter: MapFilter) => {
            setActiveFilter(filter);
            clearSelection();
          }}
          onToggleParcels={() => setShowParcels((value) => !value)}
          onToggleEstateLabels={() => setShowEstateLabels((value) => !value)}
        />
      )}

      <AtlasInspector
        selection={selectedFeature as any}
        islandLabel={ISLAND_LABELS[islandFromUrl]}
        onClose={clearSelection}
        onDirections={openDirections as any}
        onAskAI={askAI as any}
        onAddStop={addToDayPlan as any}
        onSave={() => setSavedCount((count) => count + 1)}
        onOpenEstate={openEstate as any}
        onOpenHistory={openEstateHistory as any}
        onOpenArchives={openEstateArchives as any}
      />

      <AtlasBottomDock
        canAddStop={Boolean(selectedFeature)}
        onExplore={() => navigate(`/explore?island=${islandFromUrl}`)}
        onRoute={() => navigate(`/mobility?island=${islandFromUrl}`)}
        onRide={() => navigate(`/mobility?island=${islandFromUrl}`)}
        onAI={() => askAI(selectedFeature)}
        onAddStop={() => selectedFeature && addToDayPlan(selectedFeature)}
      />

      <div className="absolute bottom-6 left-4 z-[740] rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs shadow-2xl backdrop-blur">
        <p className="font-black text-emerald-300">Live Data</p>
        <p className="text-white/55">Updated 2 min ago</p>
      </div>

      <div className="absolute bottom-6 right-4 z-[740] rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs font-bold shadow-2xl backdrop-blur">
        18.3402° N, 64.9307° W
      </div>

      {error && (
        <div className="absolute left-1/2 top-32 z-[900] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-3xl bg-red-500/90 p-4 text-sm font-bold text-white shadow-2xl">
          {error}
        </div>
      )}

      {!loading && !error && filteredPoints.length === 0 && (
        <div className="absolute bottom-28 left-1/2 z-[900] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-sm font-bold text-white shadow-2xl">
          No places match this search or filter.
        </div>
      )}
    </main>
  );
}
