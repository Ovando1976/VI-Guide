"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LineString } from "geojson";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Pane,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import type { EstateRecord, IslandCode } from "@/types/usvi";
import type {
  TerritoryMapLens as Lens,
  TerritoryMapPlace as PlaceRecord,
  TerritoryMapPlaceType as PlaceType,
  TerritoryMapSelection,
} from "@/types/territory-map";
import {
  TRIP_STORAGE_KEY,
  type TripItem,
  type TripItemKind,
} from "@/components/trip-planner/trip-types";

type Props = {
  island: IslandCode;
  estates: EstateRecord[];
  places: PlaceRecord[];
  activeLens: Lens;
  focusedPlaceId?: string | null;
  selectedEstateGeoid: string | null;
  fromGeoid: string;
  toGeoid: string;
  routeGeoJson: LineString | null;
  routeFocusNonce: number;
  onSelectEstate: (estate: EstateRecord) => void;
  onSelectFrom: (geoid: string) => void;
  onSelectTo: (geoid: string) => void;
  onSelectPlace?: (place: TerritoryMapSelection | null) => void;
  onChangeLens?: (lens: Lens) => void;
};

type PositionedPlace = PlaceRecord & { lat: number; lng: number };
type MapStyle = "topographic" | "voyager" | "satellite";
type SemanticCategory =
  | "food"
  | "attraction"
  | "shopping"
  | "grocery"
  | "nature"
  | "services"
  | "transport"
  | "nightlife"
  | "general"
  | "beach"
  | "historic"
  | "stay";
type PlaceFilter = "all" | Exclude<SemanticCategory, "beach" | "historic" | "stay">;

const ISLAND_VIEW: Record<
  IslandCode,
  { center: LatLngExpression; zoom: number; bounds: LatLngBoundsExpression }
> = {
  stt: { center: [18.336, -64.93], zoom: 12, bounds: [[18.27, -65.05], [18.42, -64.82]] },
  stj: { center: [18.34, -64.75], zoom: 12, bounds: [[18.28, -64.86], [18.39, -64.64]] },
  stx: { center: [17.746, -64.747], zoom: 11, bounds: [[17.67, -64.96], [17.81, -64.54]] },
};

const STYLE_META: Record<MapStyle, { label: string; description: string }> = {
  topographic: { label: "Terrain", description: "Ridges, elevation, roads, and island context" },
  voyager: { label: "Island map", description: "Clean streets and place context" },
  satellite: { label: "Satellite", description: "Aerial island imagery" },
};

const CATEGORY_META: Record<SemanticCategory, { label: string; color: string; svg: string }> = {
  food: { label: "Food & drink", color: "#e85d2a", svg: '<path d="M7 3v7M4 3v4a3 3 0 0 0 6 0V3M7 10v11M17 3v18M17 3c3 2 3 7 0 9"/>' },
  attraction: { label: "Attraction", color: "#0ea5a8", svg: '<path d="m12 3 2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.9Z"/>' },
  shopping: { label: "Shopping", color: "#8b5cf6", svg: '<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/>' },
  grocery: { label: "Grocery", color: "#22a447", svg: '<path d="M3 4h2l2 11h10l2-7H7"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>' },
  nature: { label: "Nature", color: "#2f9d67", svg: '<path d="M19 4C11 4 6 8 6 14c0 3 2 5 5 5 6 0 8-7 8-15Z"/><path d="M5 21c2-6 6-10 11-13"/>' },
  services: { label: "Services", color: "#64748b", svg: '<path d="M12 3v18M3 12h18"/>' },
  transport: { label: "Transport", color: "#d59a16", svg: '<path d="M4 16h16M6 16l1-8h10l1 8M8 8l1-3h6l1 3"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/>' },
  nightlife: { label: "Nightlife", color: "#db3f83", svg: '<path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>' },
  general: { label: "General place", color: "#f97316", svg: '<path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>' },
  beach: { label: "Beach", color: "#06b6d4", svg: '<path d="M3 8c2.2 0 2.2 1.6 4.4 1.6S9.6 8 11.8 8s2.2 1.6 4.4 1.6S18.4 8 20.6 8M3 13c2.2 0 2.2 1.6 4.4 1.6S9.6 13 11.8 13s2.2 1.6 4.4 1.6 2.2-1.6 4.4-1.6M3 18c2.2 0 2.2 1.6 4.4 1.6S9.6 18 11.8 18s2.2 1.6 4.4 1.6 2.2-1.6 4.4-1.6"/>' },
  historic: { label: "Historic site", color: "#c58b16", svg: '<path d="M3 9h18M5 9V7l7-4 7 4v2M6 9v9M10 9v9M14 9v9M18 9v9M4 18h16M3 21h18"/>' },
  stay: { label: "Stay", color: "#2563eb", svg: '<path d="M4 19v-8h16v8M4 15h16M7 11V7h5a3 3 0 0 1 3 3v1M4 19v2M20 19v2"/>' },
};

const FILTER_ORDER: PlaceFilter[] = [
  "all", "food", "attraction", "shopping", "grocery", "nature", "transport", "nightlife", "services", "general",
];

const PICKUP_ICON = makeEndpointIcon("#0f766e", "P");
const DESTINATION_ICON = makeEndpointIcon("#e9ad32", "D");

export function EstateMap({
  island,
  estates,
  places,
  activeLens,
  focusedPlaceId = null,
  selectedEstateGeoid,
  fromGeoid,
  toGeoid,
  routeGeoJson,
  routeFocusNonce,
  onSelectEstate,
  onSelectFrom,
  onSelectTo,
  onSelectPlace,
  onChangeLens,
}: Props) {
  const [mapStyle, setMapStyle] = useState<MapStyle>("topographic");
  const [showEstateLabels, setShowEstateLabels] = useState(false);
  const [showEstateBoundaries, setShowEstateBoundaries] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [placeFilter, setPlaceFilter] = useState<PlaceFilter>("all");
  const [resetNonce, setResetNonce] = useState(0);

  const selectedEstate = estates.find((estate) => estate.geoid === selectedEstateGeoid) ?? null;
  const fromEstate = estates.find((estate) => estate.geoid === fromGeoid) ?? null;
  const toEstate = estates.find((estate) => estate.geoid === toGeoid) ?? null;

  const validPlaces = useMemo(
    () => places.filter((place): place is PositionedPlace => isFiniteNumber(place.lat) && isFiniteNumber(place.lng) && (!place.island || String(place.island).toLowerCase() === island)),
    [island, places],
  );

  const placesByType = useMemo(() => ({
    place: validPlaces.filter((place) => normalizePlaceType(place) === "place"),
    beach: validPlaces.filter((place) => normalizePlaceType(place) === "beach"),
    historic: validPlaces.filter((place) => normalizePlaceType(place) === "historic"),
    stay: validPlaces.filter((place) => normalizePlaceType(place) === "stay"),
  }), [validPlaces]);

  const semanticCounts = useMemo(() => {
    const counts = new Map<PlaceFilter, number>();
    counts.set("all", placesByType.place.length);
    for (const place of placesByType.place) {
      const category = normalizeSemanticCategory(place) as PlaceFilter;
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    return counts;
  }, [placesByType.place]);

  const visiblePlaces = useMemo(() => {
    if (activeLens === "beaches") return placesByType.beach;
    if (activeLens === "historic") return placesByType.historic;
    if (activeLens === "stays") return placesByType.stay;
    if (activeLens !== "places") return [];
    if (placeFilter === "all") return placesByType.place;
    return placesByType.place.filter((place) => normalizeSemanticCategory(place) === placeFilter);
  }, [activeLens, placeFilter, placesByType]);

  const selectedPlace = useMemo(() => visiblePlaces.find((place, index) => placeIdentity(place, index) === selectedPlaceId) ?? null, [selectedPlaceId, visiblePlaces]);
  const nearestEstate = useMemo(() => {
    if (!selectedPlace) return null;
    return estates
      .map((estate) => ({ estate, distance: Math.pow(estate.internalPoint.lat - selectedPlace.lat, 2) + Math.pow(estate.internalPoint.lng - selectedPlace.lng, 2) }))
      .sort((a, b) => a.distance - b.distance)[0]?.estate ?? null;
  }, [estates, selectedPlace]);

  const selectedEstateBounds = useMemo(() => getEstateBounds(selectedEstate), [selectedEstate]);
  const routeLatLngs = useMemo(() => geoJsonLineToLatLngs(routeGeoJson), [routeGeoJson]);

  useEffect(() => {
    if (focusedPlaceId) setSelectedPlaceId(focusedPlaceId);
  }, [focusedPlaceId]);

  useEffect(() => {
    setSelectedPlaceId(null);
    onSelectPlace?.(null);
    if (activeLens !== "places") setPlaceFilter("all");
  }, [activeLens, island, onSelectPlace]);

  return (
    <div className="premium-territory-map relative overflow-hidden rounded-[28px] border border-[#b9d7d2] bg-[#dcefeb] shadow-[0_24px_70px_rgba(18,49,47,.16)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex items-start justify-between gap-3 bg-[linear-gradient(180deg,rgba(7,41,45,.74),rgba(7,41,45,.22),transparent)] px-4 py-4 md:px-5">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[.24em] text-[#f5cf79]">Living island map</div>
          <div className="mt-1 truncate text-lg font-black text-white md:text-xl">{selectedEstate?.baseName ?? `${islandName(island)} · all island`}</div>
          <div className="mt-1 text-[10px] font-semibold text-white/75">{STYLE_META[mapStyle].description}</div>
        </div>
        <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
          <span className="rounded-full border border-white/20 bg-white/12 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-white backdrop-blur-xl">{lensLabel(activeLens)} · {visiblePlaces.length}</span>
          <MapToggle active={showEstateBoundaries} label="Boundaries" onClick={() => setShowEstateBoundaries((value) => !value)} />
          <MapToggle active={showEstateLabels} label="Labels" onClick={() => setShowEstateLabels((value) => !value)} />
        </div>
      </div>

      <div className="absolute right-4 top-[94px] z-[1050] flex flex-col gap-2 sm:flex-row">
        <div className="flex overflow-hidden rounded-xl border border-white/35 bg-white/94 p-1 shadow-xl backdrop-blur-xl">
          {(Object.keys(STYLE_META) as MapStyle[]).map((style) => (
            <button key={style} type="button" onClick={() => setMapStyle(style)} className={`rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-[.1em] transition ${mapStyle === style ? "bg-[#0f766e] text-white" : "text-[#47615e] hover:bg-[#eef8f5]"}`}>{STYLE_META[style].label}</button>
          ))}
        </div>
        <button type="button" onClick={() => setResetNonce((value) => value + 1)} className="rounded-xl border border-white/35 bg-white/94 px-3 py-2 text-[9px] font-black uppercase tracking-[.1em] text-[#12312f] shadow-xl backdrop-blur-xl">Full island</button>
      </div>

      {activeLens === "places" ? (
        <div className="absolute left-4 right-4 top-[142px] z-[1060] flex gap-2 overflow-x-auto rounded-2xl border border-white/55 bg-white/94 p-2 shadow-xl backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:left-5 md:right-auto md:max-w-[78%]">
          {FILTER_ORDER.map((filter) => {
            const count = semanticCounts.get(filter) ?? 0;
            if (filter !== "all" && count === 0) return null;
            const meta = filter === "all" ? null : CATEGORY_META[filter];
            return (
              <button key={filter} type="button" onClick={() => setPlaceFilter(filter)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black transition ${placeFilter === filter ? "bg-[#12312f] text-white" : "text-[#526966] hover:bg-[#edf7f4]"}`}>
                {meta ? <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} /> : null}
                {filter === "all" ? "All places" : meta?.label} <span className="opacity-65">{count}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="h-[640px] w-full md:h-[690px]">
        <MapContainer center={ISLAND_VIEW[island].center} zoom={ISLAND_VIEW[island].zoom} zoomControl={false} className="h-full w-full" preferCanvas touchZoom doubleClickZoom={false}>
          <ZoomControl position="bottomright" />
          <Pane name="territory-vectors" style={{ zIndex: 410 }} />
          <Pane name="route" style={{ zIndex: 650 }} />
          <Pane name="pins" style={{ zIndex: 720 }} />
          <BaseMap style={mapStyle} />

          {estates.map((estate) => {
            const rings = getEstatePolygonRings(estate);
            if (!rings.length) return null;
            const selected = estate.geoid === selectedEstateGeoid;
            const pickup = estate.geoid === fromGeoid;
            const destination = estate.geoid === toGeoid;
            const emphasized = selected || pickup || destination;
            const color = pickup ? "#0f766e" : destination ? "#e9ad32" : selected ? "#14b8a6" : "#4bb9b0";
            return (
              <Polygon key={estate.geoid} pane="territory-vectors" positions={rings} pathOptions={{ color, weight: emphasized ? 3 : showEstateBoundaries ? 1.1 : 0, opacity: emphasized ? 1 : showEstateBoundaries ? 0.72 : 0, fillColor: color, fillOpacity: emphasized ? 0.16 : 0 }} eventHandlers={{ click: () => onSelectEstate(estate), contextmenu: () => onSelectFrom(estate.geoid), dblclick: () => onSelectTo(estate.geoid) }}>
                <Popup><div className="min-w-[220px]"><div className="text-[9px] font-black uppercase tracking-[.18em] text-[#0f766e]">Estate</div><div className="mt-1 text-lg font-black text-[#12312f]">{estate.baseName}</div><div className="mt-4 grid gap-2"><button type="button" onClick={() => onSelectFrom(estate.geoid)} className="rounded-xl bg-[#0f766e] px-3 py-2 text-xs font-black text-white">Use as pickup</button><button type="button" onClick={() => onSelectTo(estate.geoid)} className="rounded-xl bg-[#e9ad32] px-3 py-2 text-xs font-black text-[#3f2d00]">Route here</button></div></div></Popup>
                {showEstateLabels || selected ? <Tooltip direction="center" permanent={selected} opacity={1}><span className="text-[10px] font-black">{estate.baseName}</span></Tooltip> : null}
              </Polygon>
            );
          })}

          {visiblePlaces.map((place, index) => {
            const broadType = normalizePlaceType(place);
            const category = broadType === "beach" ? "beach" : broadType === "historic" ? "historic" : broadType === "stay" ? "stay" : normalizeSemanticCategory(place);
            const key = placeIdentity(place, index);
            const selected = selectedPlaceId === key;
            const label = place.name || place.title || `Place ${index + 1}`;
            return (
              <Marker key={key} pane="pins" position={[place.lat, place.lng]} icon={makeSemanticIcon(category, selected)} eventHandlers={{ click: () => { setSelectedPlaceId(key); onSelectPlace?.(toTerritoryMapSelection(place, index)); } }}>
                <Tooltip direction="top" offset={[0, -24]} opacity={1}><div className="min-w-[130px]"><div className="text-[9px] font-black uppercase tracking-[.14em]" style={{ color: CATEGORY_META[category].color }}>{CATEGORY_META[category].label}</div><div className="mt-0.5 text-xs font-black text-[#12312f]">{label}</div></div></Tooltip>
              </Marker>
            );
          })}

          {routeLatLngs.length > 1 ? <><Polyline pane="route" positions={routeLatLngs} pathOptions={{ color: "#ffffff", weight: 10, opacity: 0.82 }} /><Polyline pane="route" positions={routeLatLngs} pathOptions={{ color: "#0f766e", weight: 5, opacity: 1, lineCap: "round", lineJoin: "round" }} /></> : null}
          {fromEstate ? <Marker pane="pins" position={getEstateCenter(fromEstate)} icon={PICKUP_ICON} /> : null}
          {toEstate ? <Marker pane="pins" position={getEstateCenter(toEstate)} icon={DESTINATION_ICON} /> : null}
          <ViewportController island={island} selectedEstateBounds={selectedEstateBounds} selectedPlace={selectedPlace} routeLatLngs={routeLatLngs} routeFocusNonce={routeFocusNonce} resetNonce={resetNonce} />
        </MapContainer>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] flex justify-center bg-[linear-gradient(0deg,rgba(7,41,45,.34),transparent)] px-4 pb-4 pt-10">
        <div className="pointer-events-auto flex max-w-full gap-1.5 overflow-x-auto rounded-full border border-white/55 bg-white/94 p-1.5 shadow-xl backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {([ ["places", "Places", placesByType.place.length, "#f97316"], ["beaches", "Beaches", placesByType.beach.length, "#06b6d4"], ["historic", "Historic", placesByType.historic.length, "#c58b16"], ["stays", "Stays", placesByType.stay.length, "#2563eb"] ] as const).map(([lens, label, count, color]) => (
            <button key={lens} type="button" onClick={() => onChangeLens?.(lens)} className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-[10px] font-black transition ${activeLens === lens ? "bg-[#12312f] text-white" : "text-[#526966] hover:bg-[#edf7f4]"}`}><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label} {count}</button>
          ))}
        </div>
      </div>

      {selectedPlace ? (
        <div className="absolute bottom-24 left-4 right-4 z-[1100] md:left-5 md:right-auto md:w-[390px]">
          <article className="overflow-hidden rounded-[24px] border border-[#cfe2de] bg-white/96 shadow-[0_24px_70px_rgba(18,49,47,.24)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4 p-5"><div className="min-w-0"><div className="text-[9px] font-black uppercase tracking-[.18em]" style={{ color: CATEGORY_META[selectedCategory(selectedPlace)].color }}>{CATEGORY_META[selectedCategory(selectedPlace)].label}</div><h3 className="mt-1 truncate text-xl font-black text-[#12312f]">{selectedPlace.name || selectedPlace.title || "Selected place"}</h3><p className="mt-1 text-sm font-semibold text-[#657572]">{selectedPlace.location || nearestEstate?.baseName || "U.S. Virgin Islands"}</p>{selectedPlace.description ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#526966]">{selectedPlace.description}</p> : null}</div><button type="button" onClick={() => { setSelectedPlaceId(null); onSelectPlace?.(null); }} className="rounded-full bg-[#edf7f4] px-3 py-2 text-xs font-black text-[#12312f]">Close</button></div>
            <div className="grid grid-cols-2 gap-2 border-t border-[#dce8e5] p-3"><Link href={placeDetailHref(selectedPlace)} className="rounded-xl bg-[#12312f] px-3 py-2.5 text-center text-xs font-black text-white">View details</Link><button type="button" disabled={!nearestEstate} onClick={() => nearestEstate && onSelectTo(nearestEstate.geoid)} className="rounded-xl bg-[#0f766e] px-3 py-2.5 text-xs font-black text-white disabled:opacity-40">Plan a ride</button><button type="button" disabled={!nearestEstate} onClick={() => nearestEstate && onSelectEstate(nearestEstate)} className="rounded-xl border border-[#cfe2de] bg-[#f6fbf9] px-3 py-2.5 text-xs font-black text-[#12312f] disabled:opacity-40">Explore area</button><button type="button" onClick={() => savePlaceToTrip(selectedPlace, island)} className="rounded-xl border border-[#e8c66d] bg-[#fff7dc] px-3 py-2.5 text-xs font-black text-[#6b4b00]">Add to trip</button></div>
          </article>
        </div>
      ) : null}
    </div>
  );
}

function BaseMap({ style }: { style: MapStyle }) {
  if (style === "satellite") return <><TileLayer attribution="Imagery © Esri" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={19} keepBuffer={4} /><TileLayer attribution="Labels © Esri" url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" opacity={0.52} maxZoom={19} keepBuffer={4} /></>;
  if (style === "voyager") return <TileLayer attribution="© OpenStreetMap contributors © CARTO" url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" subdomains="abcd" maxZoom={20} keepBuffer={4} />;
  return <TileLayer attribution="Map © Esri, HERE, Garmin, FAO, NOAA, USGS" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}" maxZoom={19} keepBuffer={4} />;
}

function ViewportController({ island, selectedEstateBounds, selectedPlace, routeLatLngs, routeFocusNonce, resetNonce }: { island: IslandCode; selectedEstateBounds: LatLngBoundsExpression | null; selectedPlace: PositionedPlace | null; routeLatLngs: LatLngExpression[]; routeFocusNonce: number; resetNonce: number }) {
  const map = useMap();
  useEffect(() => { map.fitBounds(ISLAND_VIEW[island].bounds, { padding: [34, 34], animate: true }); }, [island, map, resetNonce]);
  useEffect(() => { if (routeLatLngs.length > 1) { map.fitBounds(L.latLngBounds(routeLatLngs), { padding: [70, 70], animate: true }); return; } if (selectedEstateBounds) map.fitBounds(selectedEstateBounds, { padding: [55, 55], animate: true }); }, [map, routeFocusNonce, routeLatLngs, selectedEstateBounds]);
  useEffect(() => { if (!selectedPlace || routeLatLngs.length > 1) return; map.flyTo([selectedPlace.lat, selectedPlace.lng], Math.max(map.getZoom(), 14), { animate: true, duration: 0.65 }); }, [map, routeLatLngs.length, selectedPlace]);
  return null;
}

function MapToggle({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-full px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] transition ${active ? "bg-[#45d5e7] text-[#073b39]" : "border border-white/20 bg-white/12 text-white hover:bg-white/20"}`}>{label}</button>;
}

function normalizePlaceType(place: PlaceRecord): PlaceType {
  const explicit = String(place.type ?? "").toLowerCase();
  if (explicit === "beach" || explicit === "stay" || explicit === "historic") return explicit;
  const text = `${place.type ?? ""} ${place.category ?? ""}`.toLowerCase();
  if (/beach|bay/.test(text)) return "beach";
  if (/hotel|villa|resort|stay|lodging|accommodation/.test(text)) return "stay";
  if (/historic|heritage|museum|fort|ruin|landmark/.test(text)) return "historic";
  return "place";
}

function normalizeSemanticCategory(place: PlaceRecord): Exclude<SemanticCategory, "beach" | "historic" | "stay"> {
  const text = `${place.category ?? ""} ${place.type ?? ""} ${place.name ?? ""} ${place.title ?? ""} ${place.description ?? ""}`.toLowerCase();
  if (/restaurant|dining|food|cafe|coffee|bakery|bar|grill|bistro|eatery|kitchen|pizza|seafood|rum|brewery/.test(text)) return "food";
  if (/shop|shopping|boutique|store|retail|market|souvenir|jewel|gift|mall|plaza/.test(text)) return "shopping";
  if (/grocery|supermarket|minimart|mini mart|convenience|provisions/.test(text)) return "grocery";
  if (/airport|ferry|terminal|taxi|port|harbor|marina|transport|parking|cruise/.test(text)) return "transport";
  if (/nightlife|night club|nightclub|lounge|music|dance|casino/.test(text)) return "nightlife";
  if (/park|trail|garden|nature|reserve|lookout|overlook|viewpoint|reef|cave|waterfall/.test(text)) return "nature";
  if (/pharmacy|hospital|clinic|medical|bank|atm|post office|service|government|police|fire station/.test(text)) return "services";
  if (/attraction|tour|activity|museum|gallery|landmark|monument|adventure|charter|excursion|zipline|aquarium/.test(text)) return "attraction";
  return "general";
}

function selectedCategory(place: PlaceRecord): SemanticCategory {
  const broad = normalizePlaceType(place);
  return broad === "beach" ? "beach" : broad === "historic" ? "historic" : broad === "stay" ? "stay" : normalizeSemanticCategory(place);
}

function makeSemanticIcon(category: SemanticCategory, selected: boolean) {
  const meta = CATEGORY_META[category];
  const size = selected ? 48 : 40;
  return L.divIcon({ className: "vi-semantic-marker", html: `<div class="vi-semantic-marker__halo${selected ? " is-selected" : ""}" style="--marker-color:${meta.color};width:${size}px;height:${size}px"><div class="vi-semantic-marker__face"><svg viewBox="0 0 24 24" aria-hidden="true">${meta.svg}</svg></div><div class="vi-semantic-marker__tip"></div></div>`, iconSize: [size, size + 8], iconAnchor: [size / 2, size + 5], popupAnchor: [0, -size] });
}

function makeEndpointIcon(color: string, letter: string) {
  return L.divIcon({ className: "vi-endpoint-marker", html: `<div style="width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:${color};color:white;border:3px solid white;box-shadow:0 8px 24px rgba(18,49,47,.35);font-weight:900">${letter}</div>`, iconSize: [34, 34], iconAnchor: [17, 17] });
}

function toTerritoryMapSelection(place: PositionedPlace, index: number): TerritoryMapSelection { return { id: placeIdentity(place, index), name: place.name || place.title || `Place ${index + 1}`, type: normalizePlaceType(place), lat: place.lat, lng: place.lng, location: place.location, description: place.description, rating: place.rating }; }
function placeIdentity(place: PlaceRecord, index: number) { return place.id || `${place.name || place.title || "place"}-${place.lat}-${place.lng}-${index}`; }
function lensLabel(lens: Lens) { if (lens === "beaches") return "Beaches"; if (lens === "stays") return "Stays"; if (lens === "historic") return "Historic"; if (lens === "drivers") return "Drivers"; if (lens === "demand") return "Demand"; return "Places"; }
function islandName(island: IslandCode) { return island === "stt" ? "St. Thomas" : island === "stj" ? "St. John" : "St. Croix"; }
function placeDetailHref(place: PlaceRecord) { const kind = normalizePlaceType(place); const slug = (place.id || place.name || place.title || "place").replace(/^[^:]+:/, ""); if (kind === "beach") return `/beaches/${slug}`; if (kind === "stay") return `/accommodations/${slug}`; if (kind === "historic") return `/historic/${slug}`; return `/places/${slug}`; }

function savePlaceToTrip(place: PlaceRecord, island: IslandCode) {
  if (typeof window === "undefined") return;
  let existing: TripItem[] = [];
  try { const parsed = JSON.parse(window.localStorage.getItem(TRIP_STORAGE_KEY) || "[]"); existing = Array.isArray(parsed) ? parsed : []; } catch { existing = []; }
  const id = place.id || `${place.name || place.title}-${place.lat}-${place.lng}`;
  const kind = normalizePlaceType(place) as TripItemKind;
  if (existing.some((item) => item.id === id && item.kind === kind)) return;
  const item: TripItem = { id, slug: id.replace(/^[^:]+:/, ""), name: place.name || place.title || "Saved place", kind, island, image: place.image, description: place.description, href: placeDetailHref(place), day: 1, timeOfDay: "flexible", addedAt: new Date().toISOString() };
  window.localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify([...existing, item]));
  window.dispatchEvent(new Event("vi-guide-trip-updated"));
}

function geoJsonLineToLatLngs(line: LineString | null): LatLngExpression[] { if (!line) return []; return line.coordinates.map(([lng, lat]) => isFiniteNumber(lat) && isFiniteNumber(lng) ? ([lat, lng] as LatLngExpression) : null).filter((point): point is LatLngExpression => point !== null); }
function getEstateCenter(estate: EstateRecord): LatLngExpression { const point = estate.internalPoint; if (isFiniteNumber(point.lat) && isFiniteNumber(point.lng)) return [point.lat, point.lng]; const points = getEstatePolygonRings(estate).flat().map(toTuple); if (!points.length) return ISLAND_VIEW[estate.island].center; const total = points.reduce((sum, [lat, lng]) => ({ lat: sum.lat + lat, lng: sum.lng + lng }), { lat: 0, lng: 0 }); return [total.lat / points.length, total.lng / points.length]; }
function getEstateBounds(estate: EstateRecord | null): LatLngBoundsExpression | null { if (!estate) return null; const points = getEstatePolygonRings(estate).flat(); return points.length ? L.latLngBounds(points) : null; }
function getEstatePolygonRings(estate: EstateRecord): LatLngExpression[][] { const geometry = estate.geometry; const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates; return polygons.flatMap((polygon) => polygon.map((ring) => ring.map(([lng, lat]) => isFiniteNumber(lat) && isFiniteNumber(lng) ? ([lat, lng] as LatLngExpression) : null).filter((point): point is LatLngExpression => point !== null)).filter((ring) => ring.length >= 3)); }
function toTuple(value: LatLngExpression): [number, number] { if (Array.isArray(value)) return [value[0], value[1]]; if (value instanceof L.LatLng) return [value.lat, value.lng]; return [18.336, -64.93]; }
function isFiniteNumber(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value); }
