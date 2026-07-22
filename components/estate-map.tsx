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
type MapStyle = "voyager" | "satellite" | "topographic";

const ISLAND_VIEW: Record<
  IslandCode,
  { center: LatLngExpression; zoom: number; bounds: LatLngBoundsExpression }
> = {
  stt: {
    center: [18.336, -64.93],
    zoom: 12,
    bounds: [
      [18.27, -65.05],
      [18.42, -64.82],
    ],
  },
  stj: {
    center: [18.34, -64.75],
    zoom: 12,
    bounds: [
      [18.28, -64.86],
      [18.39, -64.64],
    ],
  },
  stx: {
    center: [17.746, -64.747],
    zoom: 11,
    bounds: [
      [17.67, -64.96],
      [17.81, -64.54],
    ],
  },
};

const STYLE_META: Record<MapStyle, { label: string; description: string }> = {
  voyager: { label: "Island map", description: "Clean streets and place context" },
  satellite: { label: "Satellite", description: "Aerial island imagery" },
  topographic: { label: "Terrain", description: "Ridges, elevation, and landform" },
};

const PLACE_COLORS: Record<PlaceType, string> = {
  place: "#f97316",
  beach: "#06b6d4",
  historic: "#d59a16",
  stay: "#2563eb",
};

const PLACE_ICONS: Record<PlaceType, { normal: L.DivIcon; selected: L.DivIcon }> = {
  place: {
    normal: makePlaceIcon("place", false),
    selected: makePlaceIcon("place", true),
  },
  beach: {
    normal: makePlaceIcon("beach", false),
    selected: makePlaceIcon("beach", true),
  },
  historic: {
    normal: makePlaceIcon("historic", false),
    selected: makePlaceIcon("historic", true),
  },
  stay: {
    normal: makePlaceIcon("stay", false),
    selected: makePlaceIcon("stay", true),
  },
};

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
  const [mapStyle, setMapStyle] = useState<MapStyle>("voyager");
  const [showEstateLabels, setShowEstateLabels] = useState(false);
  const [showEstateBoundaries, setShowEstateBoundaries] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [resetNonce, setResetNonce] = useState(0);

  const selectedEstate =
    estates.find((estate) => estate.geoid === selectedEstateGeoid) ?? null;
  const fromEstate = estates.find((estate) => estate.geoid === fromGeoid) ?? null;
  const toEstate = estates.find((estate) => estate.geoid === toGeoid) ?? null;

  const validPlaces = useMemo(
    () =>
      places.filter(
        (place): place is PositionedPlace =>
          isFiniteNumber(place.lat) &&
          isFiniteNumber(place.lng) &&
          (!place.island || String(place.island).toLowerCase() === island),
      ),
    [island, places],
  );

  const placesByType = useMemo(
    () => ({
      place: validPlaces.filter((place) => normalizePlaceType(place) === "place"),
      beach: validPlaces.filter((place) => normalizePlaceType(place) === "beach"),
      historic: validPlaces.filter(
        (place) => normalizePlaceType(place) === "historic",
      ),
      stay: validPlaces.filter((place) => normalizePlaceType(place) === "stay"),
    }),
    [validPlaces],
  );

  const visiblePlaces = useMemo(() => {
    if (activeLens === "places") return placesByType.place;
    if (activeLens === "beaches") return placesByType.beach;
    if (activeLens === "historic") return placesByType.historic;
    if (activeLens === "stays") return placesByType.stay;
    return [];
  }, [activeLens, placesByType]);

  const selectedPlace = useMemo(
    () =>
      visiblePlaces.find(
        (place, index) => placeIdentity(place, index) === selectedPlaceId,
      ) ?? null,
    [selectedPlaceId, visiblePlaces],
  );

  const nearestEstate = useMemo(() => {
    if (!selectedPlace) return null;
    return (
      estates
        .map((estate) => {
          const point = estate.internalPoint;
          return {
            estate,
            distance:
              Math.pow(point.lat - selectedPlace.lat, 2) +
              Math.pow(point.lng - selectedPlace.lng, 2),
          };
        })
        .sort((a, b) => a.distance - b.distance)[0]?.estate ?? null
    );
  }, [estates, selectedPlace]);

  const selectedEstateBounds = useMemo(
    () => getEstateBounds(selectedEstate),
    [selectedEstate],
  );
  const routeLatLngs = useMemo(
    () => geoJsonLineToLatLngs(routeGeoJson),
    [routeGeoJson],
  );

  useEffect(() => {
    if (focusedPlaceId) setSelectedPlaceId(focusedPlaceId);
  }, [focusedPlaceId]);

  useEffect(() => {
    setSelectedPlaceId(null);
    onSelectPlace?.(null);
  }, [activeLens, island, onSelectPlace]);

  return (
    <div className="premium-territory-map relative overflow-hidden rounded-[28px] border border-[#b9d7d2] bg-[#dcefeb] shadow-[0_24px_70px_rgba(18,49,47,.16)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex items-start justify-between gap-3 bg-[linear-gradient(180deg,rgba(7,41,45,.86),rgba(7,41,45,.38),transparent)] px-4 py-4 md:px-5">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[.24em] text-[#f5cf79]">
            Living island map
          </div>
          <div className="mt-1 truncate text-lg font-black text-white md:text-xl">
            {selectedEstate?.baseName ?? `${islandName(island)} · all island`}
          </div>
          <div className="mt-1 text-[10px] font-semibold text-white/70">
            {STYLE_META[mapStyle].description}
          </div>
        </div>

        <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
          <span className="rounded-full border border-white/20 bg-white/12 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-white backdrop-blur-xl">
            {lensLabel(activeLens)} · {visiblePlaces.length}
          </span>
          <MapToggle
            active={showEstateBoundaries}
            label="Boundaries"
            onClick={() => setShowEstateBoundaries((value) => !value)}
          />
          <MapToggle
            active={showEstateLabels}
            label="Labels"
            onClick={() => setShowEstateLabels((value) => !value)}
          />
        </div>
      </div>

      <div className="absolute right-4 top-[94px] z-[1050] flex flex-col gap-2 sm:flex-row">
        <div className="flex overflow-hidden rounded-xl border border-white/30 bg-white/94 p-1 shadow-xl backdrop-blur-xl">
          {(Object.keys(STYLE_META) as MapStyle[]).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setMapStyle(style)}
              className={`rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-[.1em] transition ${
                mapStyle === style
                  ? "bg-[#0f766e] text-white"
                  : "text-[#47615e] hover:bg-[#eef8f5]"
              }`}
            >
              {STYLE_META[style].label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setResetNonce((value) => value + 1)}
          className="rounded-xl border border-white/30 bg-white/94 px-3 py-2 text-[9px] font-black uppercase tracking-[.1em] text-[#12312f] shadow-xl backdrop-blur-xl"
        >
          Full island
        </button>
      </div>

      <div className="h-[640px] w-full md:h-[690px]">
        <MapContainer
          center={ISLAND_VIEW[island].center}
          zoom={ISLAND_VIEW[island].zoom}
          zoomControl={false}
          className="h-full w-full"
          preferCanvas
          touchZoom
          doubleClickZoom={false}
        >
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
            const color = pickup
              ? "#0f766e"
              : destination
                ? "#e9ad32"
                : selected
                  ? "#14b8a6"
                  : "#4bb9b0";

            return (
              <Polygon
                key={estate.geoid}
                pane="territory-vectors"
                positions={rings}
                pathOptions={{
                  color,
                  weight: emphasized ? 3 : showEstateBoundaries ? 1.1 : 0,
                  opacity: emphasized ? 1 : showEstateBoundaries ? 0.72 : 0,
                  fillColor: color,
                  fillOpacity: emphasized ? 0.16 : 0,
                }}
                eventHandlers={{
                  click: () => onSelectEstate(estate),
                  contextmenu: () => onSelectFrom(estate.geoid),
                  dblclick: () => onSelectTo(estate.geoid),
                }}
              >
                <Popup>
                  <div className="min-w-[220px]">
                    <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#0f766e]">
                      Estate
                    </div>
                    <div className="mt-1 text-lg font-black text-[#12312f]">
                      {estate.baseName}
                    </div>
                    <div className="mt-4 grid gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectFrom(estate.geoid)}
                        className="rounded-xl bg-[#0f766e] px-3 py-2 text-xs font-black text-white"
                      >
                        Use as pickup
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectTo(estate.geoid)}
                        className="rounded-xl bg-[#e9ad32] px-3 py-2 text-xs font-black text-[#3f2d00]"
                      >
                        Route here
                      </button>
                    </div>
                  </div>
                </Popup>
                {showEstateLabels || selected ? (
                  <Tooltip direction="center" permanent={selected} opacity={1}>
                    <span className="text-[10px] font-black">{estate.baseName}</span>
                  </Tooltip>
                ) : null}
              </Polygon>
            );
          })}

          {visiblePlaces.map((place, index) => {
            const type = normalizePlaceType(place);
            const key = placeIdentity(place, index);
            const selected = selectedPlaceId === key;
            const label = place.name || place.title || `Place ${index + 1}`;
            return (
              <Marker
                key={key}
                pane="pins"
                position={[place.lat, place.lng]}
                icon={selected ? PLACE_ICONS[type].selected : PLACE_ICONS[type].normal}
                eventHandlers={{
                  click: () => {
                    setSelectedPlaceId(key);
                    onSelectPlace?.(toTerritoryMapSelection(place, index));
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -22]} opacity={1}>
                  <div className="text-xs font-black text-[#12312f]">{label}</div>
                </Tooltip>
              </Marker>
            );
          })}

          {routeLatLngs.length > 1 ? (
            <>
              <Polyline
                pane="route"
                positions={routeLatLngs}
                pathOptions={{ color: "#ffffff", weight: 10, opacity: 0.82 }}
              />
              <Polyline
                pane="route"
                positions={routeLatLngs}
                pathOptions={{
                  color: "#0f766e",
                  weight: 5,
                  opacity: 1,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            </>
          ) : null}

          {fromEstate ? (
            <Marker pane="pins" position={getEstateCenter(fromEstate)} icon={PICKUP_ICON} />
          ) : null}
          {toEstate ? (
            <Marker
              pane="pins"
              position={getEstateCenter(toEstate)}
              icon={DESTINATION_ICON}
            />
          ) : null}

          <ViewportController
            island={island}
            selectedEstateBounds={selectedEstateBounds}
            selectedPlace={selectedPlace}
            routeLatLngs={routeLatLngs}
            routeFocusNonce={routeFocusNonce}
            resetNonce={resetNonce}
          />
        </MapContainer>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] flex justify-center bg-[linear-gradient(0deg,rgba(7,41,45,.72),transparent)] px-4 pb-4 pt-16">
        <div className="pointer-events-auto flex max-w-full gap-1.5 overflow-x-auto rounded-full border border-white/45 bg-white/94 p-1.5 shadow-xl backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {([
            ["places", "Places", placesByType.place.length],
            ["beaches", "Beaches", placesByType.beach.length],
            ["historic", "Historic", placesByType.historic.length],
            ["stays", "Stays", placesByType.stay.length],
          ] as const).map(([lens, label, count]) => (
            <button
              key={lens}
              type="button"
              onClick={() => onChangeLens?.(lens)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-[10px] font-black transition ${
                activeLens === lens
                  ? "bg-[#12312f] text-white"
                  : "text-[#526966] hover:bg-[#edf7f4]"
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PLACE_COLORS[lens === "places" ? "place" : lens === "beaches" ? "beach" : lens === "historic" ? "historic" : "stay"] }}
              />
              {label} {count}
            </button>
          ))}
        </div>
      </div>

      {selectedPlace ? (
        <div className="absolute bottom-24 left-4 right-4 z-[1100] md:left-5 md:right-auto md:w-[390px]">
          <article className="overflow-hidden rounded-[24px] border border-[#cfe2de] bg-white/96 shadow-[0_24px_70px_rgba(18,49,47,.24)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#0f766e]">
                  {placeTypeLabel(normalizePlaceType(selectedPlace))}
                </div>
                <h3 className="mt-1 truncate text-xl font-black text-[#12312f]">
                  {selectedPlace.name || selectedPlace.title || "Selected place"}
                </h3>
                <p className="mt-1 text-sm font-semibold text-[#657572]">
                  {selectedPlace.location || nearestEstate?.baseName || "U.S. Virgin Islands"}
                </p>
                {selectedPlace.description ? (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#526966]">
                    {selectedPlace.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlaceId(null);
                  onSelectPlace?.(null);
                }}
                className="rounded-full bg-[#edf7f4] px-3 py-2 text-xs font-black text-[#12312f]"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-[#dce8e5] p-3">
              <Link
                href={placeDetailHref(selectedPlace)}
                className="rounded-xl bg-[#12312f] px-3 py-2.5 text-center text-xs font-black text-white"
              >
                View details
              </Link>
              <button
                type="button"
                disabled={!nearestEstate}
                onClick={() => nearestEstate && onSelectTo(nearestEstate.geoid)}
                className="rounded-xl bg-[#0f766e] px-3 py-2.5 text-xs font-black text-white disabled:opacity-40"
              >
                Plan a ride
              </button>
              <button
                type="button"
                disabled={!nearestEstate}
                onClick={() => nearestEstate && onSelectEstate(nearestEstate)}
                className="rounded-xl border border-[#cfe2de] bg-[#f6fbf9] px-3 py-2.5 text-xs font-black text-[#12312f] disabled:opacity-40"
              >
                Explore area
              </button>
              <button
                type="button"
                onClick={() => savePlaceToTrip(selectedPlace, island)}
                className="rounded-xl border border-[#e8c66d] bg-[#fff7dc] px-3 py-2.5 text-xs font-black text-[#6b4b00]"
              >
                Add to trip
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </div>
  );
}

function BaseMap({ style }: { style: MapStyle }) {
  if (style === "satellite") {
    return (
      <>
        <TileLayer
          attribution="Imagery © Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
          updateWhenIdle
          keepBuffer={3}
        />
        <TileLayer
          attribution="Labels © Esri"
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          opacity={0.52}
          maxZoom={19}
          updateWhenIdle
          keepBuffer={3}
        />
      </>
    );
  }
  if (style === "topographic") {
    return (
      <TileLayer
        attribution="Map data © OpenStreetMap contributors, SRTM | OpenTopoMap"
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        maxZoom={17}
        updateWhenIdle
        keepBuffer={3}
      />
    );
  }
  return (
    <TileLayer
      attribution="© OpenStreetMap contributors © CARTO"
      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      subdomains="abcd"
      maxZoom={20}
      updateWhenIdle
      keepBuffer={3}
    />
  );
}

function ViewportController({
  island,
  selectedEstateBounds,
  selectedPlace,
  routeLatLngs,
  routeFocusNonce,
  resetNonce,
}: {
  island: IslandCode;
  selectedEstateBounds: LatLngBoundsExpression | null;
  selectedPlace: PositionedPlace | null;
  routeLatLngs: LatLngExpression[];
  routeFocusNonce: number;
  resetNonce: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(ISLAND_VIEW[island].bounds, { padding: [34, 34], animate: true });
  }, [island, map, resetNonce]);

  useEffect(() => {
    if (routeLatLngs.length > 1) {
      map.fitBounds(L.latLngBounds(routeLatLngs), { padding: [70, 70], animate: true });
      return;
    }
    if (selectedEstateBounds) {
      map.fitBounds(selectedEstateBounds, { padding: [55, 55], animate: true });
    }
  }, [map, routeFocusNonce, routeLatLngs, selectedEstateBounds]);

  useEffect(() => {
    if (!selectedPlace || routeLatLngs.length > 1) return;
    map.flyTo([selectedPlace.lat, selectedPlace.lng], Math.max(map.getZoom(), 14), {
      animate: true,
      duration: 0.65,
    });
  }, [map, routeLatLngs.length, selectedPlace]);

  return null;
}

function MapToggle({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] transition ${
        active
          ? "bg-[#45d5e7] text-[#073b39]"
          : "border border-white/20 bg-white/12 text-white hover:bg-white/20"
      }`}
    >
      {label}
    </button>
  );
}

function normalizePlaceType(place: PlaceRecord): PlaceType {
  const explicit = String(place.type ?? "").toLowerCase();
  if (explicit === "beach" || explicit === "stay" || explicit === "historic") {
    return explicit;
  }
  const text = `${place.type ?? ""} ${place.category ?? ""}`.toLowerCase();
  if (/beach|bay/.test(text)) return "beach";
  if (/hotel|villa|resort|stay|lodging|accommodation/.test(text)) return "stay";
  if (/historic|heritage|museum|fort|ruin|landmark/.test(text)) return "historic";
  return "place";
}

function makePlaceIcon(type: PlaceType, selected: boolean) {
  const color = PLACE_COLORS[type];
  const size = selected ? 46 : 38;
  const svg = markerSvg(type);
  return L.divIcon({
    className: "vi-semantic-marker",
    html: `<div class="vi-semantic-marker__halo${selected ? " is-selected" : ""}" style="--marker-color:${color};width:${size}px;height:${size}px"><div class="vi-semantic-marker__face">${svg}</div><div class="vi-semantic-marker__tip"></div></div>`,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 5],
    popupAnchor: [0, -size],
  });
}

function markerSvg(type: PlaceType) {
  if (type === "beach") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8c2.2 0 2.2 1.6 4.4 1.6S9.6 8 11.8 8s2.2 1.6 4.4 1.6S18.4 8 20.6 8M3 13c2.2 0 2.2 1.6 4.4 1.6S9.6 13 11.8 13s2.2 1.6 4.4 1.6 2.2-1.6 4.4-1.6M3 18c2.2 0 2.2 1.6 4.4 1.6S9.6 18 11.8 18s2.2 1.6 4.4 1.6 2.2-1.6 4.4-1.6"/></svg>`;
  }
  if (type === "stay") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19v-8h16v8M4 15h16M7 11V7h5a3 3 0 0 1 3 3v1M4 19v2M20 19v2"/></svg>`;
  }
  if (type === "historic") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h18M5 9V7l7-4 7 4v2M6 9v9M10 9v9M14 9v9M18 9v9M4 18h16M3 21h18"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>`;
}

function makeEndpointIcon(color: string, letter: string) {
  return L.divIcon({
    className: "vi-endpoint-marker",
    html: `<div style="width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:${color};color:white;border:3px solid white;box-shadow:0 8px 24px rgba(18,49,47,.35);font-weight:900">${letter}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function toTerritoryMapSelection(
  place: PositionedPlace,
  index: number,
): TerritoryMapSelection {
  return {
    id: placeIdentity(place, index),
    name: place.name || place.title || `Place ${index + 1}`,
    type: normalizePlaceType(place),
    lat: place.lat,
    lng: place.lng,
    location: place.location,
    description: place.description,
    rating: place.rating,
  };
}

function placeIdentity(place: PlaceRecord, index: number) {
  return place.id || `${place.name || place.title || "place"}-${place.lat}-${place.lng}-${index}`;
}

function placeTypeLabel(type: PlaceType) {
  if (type === "beach") return "Beach";
  if (type === "stay") return "Stay";
  if (type === "historic") return "Historic site";
  return "Place";
}

function lensLabel(lens: Lens) {
  if (lens === "beaches") return "Beaches";
  if (lens === "stays") return "Stays";
  if (lens === "historic") return "Historic";
  if (lens === "drivers") return "Drivers";
  if (lens === "demand") return "Demand";
  return "Places";
}

function islandName(island: IslandCode) {
  if (island === "stt") return "St. Thomas";
  if (island === "stj") return "St. John";
  return "St. Croix";
}

function placeDetailHref(place: PlaceRecord) {
  const kind = normalizePlaceType(place);
  const slug = (place.id || place.name || place.title || "place").replace(/^[^:]+:/, "");
  if (kind === "beach") return `/beaches/${slug}`;
  if (kind === "stay") return `/accommodations/${slug}`;
  if (kind === "historic") return `/historic/${slug}`;
  return `/places/${slug}`;
}

function savePlaceToTrip(place: PlaceRecord, island: IslandCode) {
  if (typeof window === "undefined") return;
  let existing: TripItem[] = [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(TRIP_STORAGE_KEY) || "[]");
    existing = Array.isArray(parsed) ? parsed : [];
  } catch {
    existing = [];
  }
  const id = place.id || `${place.name || place.title}-${place.lat}-${place.lng}`;
  const kind = normalizePlaceType(place) as TripItemKind;
  if (existing.some((item) => item.id === id && item.kind === kind)) return;
  const item: TripItem = {
    id,
    slug: id.replace(/^[^:]+:/, ""),
    name: place.name || place.title || "Saved place",
    kind,
    island,
    image: place.image,
    description: place.description,
    href: placeDetailHref(place),
    day: 1,
    timeOfDay: "flexible",
    addedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify([...existing, item]));
  window.dispatchEvent(new Event("vi-guide-trip-updated"));
}

function geoJsonLineToLatLngs(line: LineString | null): LatLngExpression[] {
  if (!line) return [];
  return line.coordinates
    .map(([lng, lat]) =>
      isFiniteNumber(lat) && isFiniteNumber(lng) ? ([lat, lng] as LatLngExpression) : null,
    )
    .filter((point): point is LatLngExpression => point !== null);
}

function getEstateCenter(estate: EstateRecord): LatLngExpression {
  const point = estate.internalPoint;
  if (isFiniteNumber(point.lat) && isFiniteNumber(point.lng)) {
    return [point.lat, point.lng];
  }
  const rings = getEstatePolygonRings(estate);
  const points = rings.flat().map(toTuple);
  if (!points.length) return ISLAND_VIEW[estate.island].center;
  const total = points.reduce(
    (sum, [lat, lng]) => ({ lat: sum.lat + lat, lng: sum.lng + lng }),
    { lat: 0, lng: 0 },
  );
  return [total.lat / points.length, total.lng / points.length];
}

function getEstateBounds(estate: EstateRecord | null): LatLngBoundsExpression | null {
  if (!estate) return null;
  const points = getEstatePolygonRings(estate).flat();
  return points.length ? L.latLngBounds(points) : null;
}

function getEstatePolygonRings(estate: EstateRecord): LatLngExpression[][] {
  const geometry = estate.geometry;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.flatMap((polygon) =>
    polygon
      .map((ring) =>
        ring
          .map(([lng, lat]) =>
            isFiniteNumber(lat) && isFiniteNumber(lng)
              ? ([lat, lng] as LatLngExpression)
              : null,
          )
          .filter((point): point is LatLngExpression => point !== null),
      )
      .filter((ring) => ring.length >= 3),
  );
}

function toTuple(value: LatLngExpression): [number, number] {
  if (Array.isArray(value)) return [value[0], value[1]];
  if (value instanceof L.LatLng) return [value.lat, value.lng];
  return [18.336, -64.93];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
