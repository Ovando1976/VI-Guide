"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LineString } from "geojson";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import L from "leaflet";
import {
  Circle,
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

type PositionedPlace = PlaceRecord & {
  lat: number;
  lng: number;
};
type DriverMarker = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  status: "available" | "assigned" | "repositioning";
  nearEstate?: string;
};

type DemandHotspot = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  radius: number;
  intensity: "low" | "medium" | "high";
};

const ISLAND_VIEW: Record<
  IslandCode,
  { center: LatLngExpression; zoom: number; bounds?: LatLngBoundsExpression }
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

const estateStroke = "#67e8f9";
const estateFill = "#0891b2";
const selectedStroke = "#fbbf24";
const pickupStroke = "#14b8a6";
const destinationStroke = "#f59e0b";
const routeGlow = "#38bdf8";
const routeCore = "#2563eb";

const pickupIcon = makePinIcon("#14b8a6", "P");
const destinationIcon = makePinIcon("#f59e0b", "D");
const driverAvailableIcon = makeDriverIcon("#22c55e");
const driverAssignedIcon = makeDriverIcon("#3b82f6");
const driverRepositionIcon = makeDriverIcon("#f59e0b");

const syntheticOperationsEnabled =
  process.env.NEXT_PUBLIC_ENABLE_SYNTHETIC_OPERATIONS === "true";

const placeIcons: Record<
  PlaceType,
  { normal: L.DivIcon; selected: L.DivIcon }
> = {
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
  const [showEstateLabels, setShowEstateLabels] = useState(false);
  const [showEstateBoundaries, setShowEstateBoundaries] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<"satellite" | "dark">("satellite");
  const [islandResetNonce, setIslandResetNonce] = useState(0);

  const showDrivers = activeLens === "drivers";
  const showDemand = activeLens === "demand";
  const showTerritoryPlaces = isTerritoryLens(activeLens);

  const constrainedTouchDevice = useMemo(() => {
    if (typeof navigator === "undefined") return false;

    const looksLikeIPad =
      /iPad/i.test(navigator.userAgent) ||
      (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;

    return looksLikeIPad || (deviceMemory !== undefined && deviceMemory <= 4);
  }, []);

  const selectedEstate =
    estates.find((estate) => estate.geoid === selectedEstateGeoid) ?? null;
  const fromEstate =
    estates.find((estate) => estate.geoid === fromGeoid) ?? null;
  const toEstate = estates.find((estate) => estate.geoid === toGeoid) ?? null;

  const routeLatLngs = useMemo(
    () => geoJsonLineToLatLngs(routeGeoJson),
    [routeGeoJson],
  );

  // EstateMap receives the complete positioned territory catalog.
  // Normalize it once, then let the active lens determine marker visibility.
  const validPlaces = useMemo(
    () =>
      places.filter(
        (place): place is PositionedPlace =>
          isFiniteNumber(place.lat) &&
          isFiniteNumber(place.lng) &&
          placeIslandMatches(place, island),
      ),
    [island, places],
  );

  const placesByType = useMemo(
    () => ({
      place: validPlaces.filter(
        (place) => normalizePlaceType(place) === "place",
      ),
      beach: validPlaces.filter(
        (place) => normalizePlaceType(place) === "beach",
      ),
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
  const selectedPlacePoint = useMemo<LatLngExpression | null>(
    () => (selectedPlace ? [selectedPlace.lat, selectedPlace.lng] : null),
    [selectedPlace],
  );

  useEffect(() => {
    if (focusedPlaceId) setSelectedPlaceId(focusedPlaceId);
  }, [focusedPlaceId]);

  useEffect(() => {
    setSelectedPlaceId(null);
    onSelectPlace?.(null);
  }, [activeLens, island, onSelectPlace]);

  const nearestEstateToSelectedPlace = useMemo(() => {
    if (
      !selectedPlace ||
      !isFiniteNumber(selectedPlace.lat) ||
      !isFiniteNumber(selectedPlace.lng)
    ) {
      return null;
    }

    const selectedLat = selectedPlace.lat;
    const selectedLng = selectedPlace.lng;

    return (
      estates
        .map((estate) => {
          const point = estateInternalPoint(estate);
          if (!point) return null;

          return {
            estate,
            distance:
              Math.pow(point.lat - selectedLat, 2) +
              Math.pow(point.lng - selectedLng, 2),
          };
        })
        .filter(
          (
            candidate,
          ): candidate is {
            estate: EstateRecord;
            distance: number;
          } => candidate !== null,
        )
        .sort((a, b) => a.distance - b.distance)[0]?.estate ?? null
    );
  }, [estates, selectedPlace]);

  const driverMarkers = useMemo(
    () =>
      syntheticOperationsEnabled ? buildSyntheticDrivers(estates, island) : [],
    [estates, island],
  );

  const demandHotspots = useMemo(
    () =>
      syntheticOperationsEnabled
        ? buildDemandHotspots(estates, validPlaces, island)
        : [],
    [estates, validPlaces, island],
  );

  const selectedEstateBounds = useMemo(
    () => getEstateBounds(selectedEstate),
    [selectedEstate],
  );

  const visibleResultCount = showDrivers
    ? driverMarkers.length
    : showDemand
      ? demandHotspots.length
      : visiblePlaces.length;

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#06131b]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex items-start justify-between gap-3 bg-[linear-gradient(180deg,rgba(3,10,18,0.86),rgba(3,10,18,0.34),transparent)] px-4 py-4 md:px-5">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[0.26em] text-amber-300/90">
            Living territory map
          </div>
          <div className="mt-1 truncate text-lg font-black tracking-tight text-white md:text-xl">
            {selectedEstate
              ? selectedEstate.baseName
              : fromEstate && toEstate
                ? `${fromEstate.baseName} → ${toEstate.baseName}`
                : `${islandName(island)} · all island`}
          </div>
        </div>

        <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
          <span className="rounded-full border border-cyan-300/25 bg-[#051923d9] px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100 backdrop-blur-xl">
            {lensLabel(activeLens)} · {visibleResultCount}
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

      <div className="absolute left-4 top-[88px] z-[1050] hidden w-[220px] overflow-hidden rounded-[22px] border border-white/15 bg-[#061520e8] shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl xl:block">
        <div className="border-b border-white/10 px-4 py-3">
          <div className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45">
            Live map layers
          </div>
          <div className="mt-1 text-sm font-black text-white">
            {lensLabel(activeLens)} layer
          </div>
        </div>

        <div className="space-y-1 p-2">
          <LayerRow
            label="Places"
            icon="⌖"
            count={placesByType.place.length}
            color="#f97316"
            active={activeLens === "places"}
            onClick={() => onChangeLens?.("places")}
          />
          <LayerRow
            label="Beaches"
            icon="≈"
            count={placesByType.beach.length}
            color="#22d3ee"
            active={activeLens === "beaches"}
            onClick={() => onChangeLens?.("beaches")}
          />
          <LayerRow
            label="Historic"
            icon="⌂"
            count={placesByType.historic.length}
            color="#a78bfa"
            active={activeLens === "historic"}
            onClick={() => onChangeLens?.("historic")}
          />
          <LayerRow
            label="Stays"
            icon="▰"
            count={placesByType.stay.length}
            color="#60a5fa"
            active={activeLens === "stays"}
            onClick={() => onChangeLens?.("stays")}
          />
          <LayerRow
            label="Drivers"
            icon="↗"
            count={driverMarkers.length}
            color="#2dd4bf"
            active={activeLens === "drivers"}
            disabled={!syntheticOperationsEnabled}
            onClick={() => onChangeLens?.("drivers")}
          />
          <LayerRow
            label="Demand"
            icon="◒"
            count={demandHotspots.length}
            color="#f59e0b"
            active={activeLens === "demand"}
            disabled={!syntheticOperationsEnabled}
            onClick={() => onChangeLens?.("demand")}
          />
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
          <span className="text-[10px] font-bold text-white/45">
            Visible results
          </span>
          <span className="text-lg font-black text-cyan-200">
            {visibleResultCount}
          </span>
        </div>
      </div>

      <div className="absolute right-4 top-[88px] z-[1050] hidden gap-2 sm:flex">
        <button
          type="button"
          onClick={() =>
            setMapStyle((value) =>
              value === "satellite" ? "dark" : "satellite",
            )
          }
          className="rounded-xl border border-white/15 bg-[#061520e8] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-lg backdrop-blur-xl hover:bg-[#0a2230]"
        >
          {mapStyle === "satellite" ? "Satellite" : "Dark map"}
        </button>
        <button
          type="button"
          onClick={() => setIslandResetNonce((value) => value + 1)}
          className="rounded-xl border border-white/15 bg-[#061520e8] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-lg backdrop-blur-xl hover:bg-[#0a2230]"
        >
          Full island
        </button>
      </div>

      <div className="h-[700px] w-full md:h-[760px]">
        <MapContainer
          center={ISLAND_VIEW[island].center}
          zoom={ISLAND_VIEW[island].zoom}
          zoomControl={false}
          className="h-full w-full bg-[#071019]"
          preferCanvas
          touchZoom
          doubleClickZoom={false}
          zoomAnimation={!constrainedTouchDevice}
          fadeAnimation={!constrainedTouchDevice}
          markerZoomAnimation={!constrainedTouchDevice}
          inertia={!constrainedTouchDevice}
        >
          <ZoomControl position="bottomright" />

          <Pane name="territory-vectors" style={{ zIndex: 400 }} />
          <Pane name="drivers" style={{ zIndex: 550 }} />
          <Pane name="route" style={{ zIndex: 650 }} />
          <Pane name="pins" style={{ zIndex: 700 }} />

          {mapStyle === "satellite" ? (
            <>
              <TileLayer
                attribution="Tiles &copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                updateWhenIdle
                updateWhenZooming={false}
                keepBuffer={1}
              />
              <TileLayer
                attribution="Labels &copy; Esri"
                url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                opacity={0.72}
                updateWhenIdle
                updateWhenZooming={false}
                keepBuffer={1}
              />
            </>
          ) : (
            <TileLayer
              attribution="&copy; OpenStreetMap contributors &copy; CARTO"
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              updateWhenIdle
              updateWhenZooming={false}
              keepBuffer={1}
            />
          )}

          {showDemand &&
            demandHotspots.map((hotspot) => (
              <DemandLayer key={hotspot.id} hotspot={hotspot} />
            ))}

          {estates.map((estate) => {
            const rings = getEstatePolygonRings(estate);
            if (!rings.length) return null;

            const isSelected = estate.geoid === selectedEstateGeoid;
            const isPickup = estate.geoid === fromGeoid;
            const isDestination = estate.geoid === toGeoid;

            const stroke = isPickup
              ? pickupStroke
              : isDestination
                ? destinationStroke
                : isSelected
                  ? selectedStroke
                  : estateStroke;

            const fillColor = isPickup
              ? "#14b8a6"
              : isDestination
                ? "#f59e0b"
                : isSelected
                  ? "#0ea5e9"
                  : estateFill;

            const emphasized = isPickup || isDestination || isSelected;
            const fillOpacity = emphasized
              ? 0.24
              : showEstateBoundaries
                ? 0.055
                : 0;
            const visibleWeight = emphasized
              ? 3.25
              : showEstateBoundaries
                ? 1.1
                : 0;
            const visibleOpacity = emphasized
              ? 0.98
              : showEstateBoundaries
                ? 0.58
                : 0;

            return (
              <Polygon
                key={estate.geoid}
                pane="territory-vectors"
                positions={rings}
                interactive
                pathOptions={{
                  color: stroke,
                  weight: visibleWeight,
                  fillColor,
                  fillOpacity,
                  opacity: visibleOpacity,
                }}
                eventHandlers={{
                  click: () => onSelectEstate(estate),
                  contextmenu: () => onSelectFrom(estate.geoid),
                  dblclick: () => onSelectTo(estate.geoid),
                }}
              >
                <Popup className="estate-popup">
                  <div className="min-w-[220px]">
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                      Estate
                    </div>
                    <div className="mt-1 text-lg font-black text-slate-900">
                      {estate.baseName}
                    </div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {estate.fullName || "Official estate record"}
                    </div>

                    <div className="mt-4 grid gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectEstate(estate)}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white"
                      >
                        Focus estate
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectFrom(estate.geoid)}
                        className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white"
                      >
                        Use as pickup
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectTo(estate.geoid)}
                        className="rounded-xl bg-amber-400 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#5b3800]"
                      >
                        Use as destination
                      </button>
                    </div>
                  </div>
                </Popup>

                {showEstateLabels || isSelected ? (
                  <Tooltip
                    direction="center"
                    permanent={isSelected}
                    sticky={!isSelected && !constrainedTouchDevice}
                    opacity={1}
                    className="estate-label"
                  >
                    <div className="rounded-full border border-white/10 bg-[#05121bcc] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-[0_6px_30px_rgba(0,0,0,0.28)]">
                      {estate.baseName}
                    </div>
                  </Tooltip>
                ) : null}
              </Polygon>
            );
          })}

          {showTerritoryPlaces &&
            visiblePlaces.map((place, index) => {
              const label = place.name || place.title || `Place ${index + 1}`;
              const type = normalizePlaceType(place);
              const placeKey = placeIdentity(place, index);
              const selected = selectedPlaceId === placeKey;

              return (
                <Marker
                  key={placeKey}
                  position={[place.lat, place.lng]}
                  pane="pins"
                  icon={
                    selected
                      ? placeIcons[type].selected
                      : placeIcons[type].normal
                  }
                  eventHandlers={{
                    click: () => {
                      setSelectedPlaceId(placeKey);
                      onSelectPlace?.(toTerritoryMapSelection(place, index));
                    },
                  }}
                >
                  <Tooltip direction="top" offset={[0, -18]} opacity={1}>
                    <div className="rounded-full border border-white/10 bg-[#07131fe8] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-xl">
                      {label}
                    </div>
                  </Tooltip>
                </Marker>
              );
            })}

          {showDrivers &&
            driverMarkers.map((driver) => (
              <Marker
                key={driver.id}
                position={[driver.lat, driver.lng]}
                pane="drivers"
                icon={
                  driver.status === "available"
                    ? driverAvailableIcon
                    : driver.status === "assigned"
                      ? driverAssignedIcon
                      : driverRepositionIcon
                }
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                      Driver
                    </div>
                    <div className="mt-1 text-base font-black text-slate-900">
                      {driver.label}
                    </div>
                    <div className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Status: {driver.status}
                    </div>
                    {driver.nearEstate ? (
                      <div className="mt-1 text-xs font-semibold text-slate-600">
                        Near {driver.nearEstate}
                      </div>
                    ) : null}
                  </div>
                </Popup>
              </Marker>
            ))}

          {routeLatLngs.length > 1 ? (
            <>
              <Polyline
                pane="route"
                positions={routeLatLngs}
                pathOptions={{
                  color: routeGlow,
                  weight: 12,
                  opacity: 0.35,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              <Polyline
                pane="route"
                positions={routeLatLngs}
                pathOptions={{
                  color: routeCore,
                  weight: 5,
                  opacity: 0.95,
                  lineCap: "round",
                  lineJoin: "round",
                  dashArray: "10 10",
                }}
              />
            </>
          ) : null}

          {fromEstate ? (
            <Marker
              pane="pins"
              position={getEstateCenter(fromEstate)}
              icon={pickupIcon}
            />
          ) : null}

          {toEstate ? (
            <Marker
              pane="pins"
              position={getEstateCenter(toEstate)}
              icon={destinationIcon}
            />
          ) : null}

          <MapViewportController
            island={island}
            selectedEstateBounds={selectedEstateBounds}
            routeLatLngs={routeLatLngs}
            islandBounds={ISLAND_VIEW[island].bounds}
            routeFocusNonce={routeFocusNonce}
            islandResetNonce={islandResetNonce}
            selectedPlacePoint={selectedPlacePoint}
            animate={!constrainedTouchDevice}
          />
        </MapContainer>
      </div>

      {selectedPlace ? (
        <div className="pointer-events-auto absolute bottom-28 left-4 right-4 z-[1100] md:bottom-24 md:left-5 md:right-auto md:w-[390px]">
          <article className="overflow-hidden rounded-[24px] border border-white/15 bg-[#07131ff2] shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
                  {placeTypeLabel(normalizePlaceType(selectedPlace))}
                </div>
                <h3 className="mt-1 truncate text-xl font-black text-white">
                  {selectedPlace.name ||
                    selectedPlace.title ||
                    "Selected place"}
                </h3>
                <p className="mt-1 text-sm text-white/60">
                  {selectedPlace.location ||
                    nearestEstateToSelectedPlace?.baseName ||
                    "US Virgin Islands"}
                  {typeof selectedPlace.rating === "number"
                    ? ` · ★ ${selectedPlace.rating.toFixed(1)}`
                    : ""}
                </p>
                {selectedPlace.description ? (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/70">
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
                aria-label="Close place card"
                className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/70 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-3">
              <Link
                href={placeDetailHref(selectedPlace)}
                className="rounded-xl bg-white px-3 py-2.5 text-center text-xs font-black text-[#06202a] transition hover:bg-cyan-50"
              >
                View details
              </Link>
              <button
                type="button"
                disabled={!nearestEstateToSelectedPlace}
                onClick={() =>
                  nearestEstateToSelectedPlace &&
                  onSelectEstate(nearestEstateToSelectedPlace)
                }
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-black text-white transition hover:bg-white/10 disabled:opacity-40"
              >
                Explore area
              </button>
              <button
                type="button"
                disabled={!nearestEstateToSelectedPlace}
                onClick={() =>
                  nearestEstateToSelectedPlace &&
                  onSelectTo(nearestEstateToSelectedPlace.geoid)
                }
                className="rounded-xl bg-cyan-300 px-3 py-2.5 text-xs font-black text-[#06202a] transition hover:bg-cyan-200 disabled:opacity-40"
              >
                Directions
              </button>
              <button
                type="button"
                onClick={() => savePlaceToTrip(selectedPlace, island)}
                className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2.5 text-xs font-black text-amber-100 transition hover:bg-amber-300/20"
              >
                Add to trip
              </button>
            </div>
          </article>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] flex justify-center bg-[linear-gradient(0deg,rgba(2,8,14,0.82),transparent)] px-4 pb-4 pt-14">
        <div className="pointer-events-auto flex max-w-full gap-1.5 overflow-x-auto rounded-full border border-white/12 bg-[#061520e8] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.4)] backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <LegendChip
            label={`Places ${placesByType.place.length}`}
            color="#f97316"
            active={activeLens === "places"}
            onClick={() => onChangeLens?.("places")}
          />
          <LegendChip
            label={`Beaches ${placesByType.beach.length}`}
            color="#22d3ee"
            active={activeLens === "beaches"}
            onClick={() => onChangeLens?.("beaches")}
          />
          <LegendChip
            label={`Historic ${placesByType.historic.length}`}
            color="#a78bfa"
            active={activeLens === "historic"}
            onClick={() => onChangeLens?.("historic")}
          />
          <LegendChip
            label={`Stays ${placesByType.stay.length}`}
            color="#60a5fa"
            active={activeLens === "stays"}
            onClick={() => onChangeLens?.("stays")}
          />
          <LegendChip
            label={
              syntheticOperationsEnabled
                ? `Drivers ${driverMarkers.length}`
                : "Drivers unavailable"
            }
            color="#2dd4bf"
            active={activeLens === "drivers"}
            disabled={!syntheticOperationsEnabled}
            onClick={() => onChangeLens?.("drivers")}
          />
          <LegendChip
            label={
              syntheticOperationsEnabled
                ? `Demand ${demandHotspots.length}`
                : "Demand unavailable"
            }
            color="#f59e0b"
            active={activeLens === "demand"}
            disabled={!syntheticOperationsEnabled}
            onClick={() => onChangeLens?.("demand")}
          />
        </div>
      </div>
    </div>
  );
}

function LayerRow({
  label,
  icon,
  count,
  color,
  active,
  onClick,
  disabled = false,
}: {
  label: string;
  icon: string;
  count: number;
  color: string;
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-35 ${
        active ? "bg-white/10" : "bg-white/[0.025] hover:bg-white/[0.06]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="grid h-7 w-7 place-items-center rounded-full text-xs font-black text-white shadow-inner"
          style={{ backgroundColor: color }}
        >
          {icon}
        </span>
        <span
          className={`text-xs font-bold ${
            active ? "text-white" : "text-white/60"
          }`}
        >
          {label}
        </span>
      </div>
      <span className="rounded-md bg-black/25 px-2 py-1 text-[10px] font-black text-white/70">
        {count}
      </span>
    </button>
  );
}

function LegendChip({
  label,
  color,
  active,
  onClick,
  disabled = false,
}: {
  label: string;
  color: string;
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-[10px] font-black transition disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? "bg-white text-slate-950"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </button>
  );
}

function MapViewportController({
  island,
  selectedEstateBounds,
  routeLatLngs,
  islandBounds,
  routeFocusNonce,
  islandResetNonce,
  selectedPlacePoint,
  animate,
}: {
  island: IslandCode;
  selectedEstateBounds: LatLngBoundsExpression | null;
  routeLatLngs: LatLngExpression[];
  islandBounds?: LatLngBoundsExpression;
  routeFocusNonce: number;
  islandResetNonce: number;
  selectedPlacePoint: LatLngExpression | null;
  animate: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (islandBounds) {
      map.fitBounds(islandBounds, {
        padding: [40, 40],
        animate,
      });
      return;
    }

    map.setView(ISLAND_VIEW[island].center, ISLAND_VIEW[island].zoom, {
      animate,
    });
  }, [animate, island, islandBounds, islandResetNonce, map]);

  useEffect(() => {
    if (routeLatLngs.length > 1) {
      map.fitBounds(L.latLngBounds(routeLatLngs), {
        padding: [80, 80],
        animate,
      });
      return;
    }

    if (selectedEstateBounds) {
      map.fitBounds(selectedEstateBounds, {
        padding: [60, 60],
        animate,
      });
    }
  }, [animate, map, routeFocusNonce, routeLatLngs, selectedEstateBounds]);

  useEffect(() => {
    if (!selectedPlacePoint || routeLatLngs.length > 1) return;
    map.flyTo(selectedPlacePoint, Math.max(map.getZoom(), 14), {
      animate,
      duration: animate ? 0.7 : 0,
    });
  }, [animate, map, routeLatLngs.length, selectedPlacePoint]);

  return null;
}

function DemandLayer({ hotspot }: { hotspot: DemandHotspot }) {
  const fillColor =
    hotspot.intensity === "high"
      ? "#f97316"
      : hotspot.intensity === "medium"
        ? "#eab308"
        : "#22c55e";

  const glowRadius =
    hotspot.intensity === "high"
      ? hotspot.radius * 1.45
      : hotspot.intensity === "medium"
        ? hotspot.radius * 1.28
        : hotspot.radius * 1.18;

  return (
    <>
      <Circle
        pane="territory-vectors"
        center={[hotspot.lat, hotspot.lng]}
        radius={glowRadius}
        pathOptions={{
          color: fillColor,
          weight: 0,
          fillColor,
          fillOpacity: 0.12,
        }}
      />
      <Circle
        pane="territory-vectors"
        center={[hotspot.lat, hotspot.lng]}
        radius={hotspot.radius}
        pathOptions={{
          color: fillColor,
          weight: 1,
          opacity: 0.35,
          fillColor,
          fillOpacity: 0.2,
        }}
      >
        <Tooltip direction="top" opacity={1}>
          <div className="rounded-full border border-white/10 bg-[#07131fcc] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
            {hotspot.label} · {hotspot.intensity} demand
          </div>
        </Tooltip>
      </Circle>
    </>
  );
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
      className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition ${
        active
          ? "bg-cyan-400 text-slate-950"
          : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

function isTerritoryLens(
  lens: Lens,
): lens is Exclude<Lens, "drivers" | "demand"> {
  return (
    lens === "places" ||
    lens === "beaches" ||
    lens === "historic" ||
    lens === "stays"
  );
}

function normalizePlaceType(place: PlaceRecord): PlaceType {
  const explicitType = String(place.type ?? "")
    .trim()
    .toLowerCase();

  if (explicitType === "beach") return "beach";
  if (explicitType === "stay") return "stay";
  if (explicitType === "historic") return "historic";
  if (explicitType === "place") return "place";

  const haystack = `${place.type ?? ""} ${place.category ?? ""}`.toLowerCase();

  if (/\b(beach|bay)\b/.test(haystack)) return "beach";
  if (/\b(stay|hotel|villa|resort|lodging|accommodation)\b/.test(haystack)) {
    return "stay";
  }
  if (/\b(historic|museum|fort|landmark|heritage|ruins?)\b/.test(haystack)) {
    return "historic";
  }

  return "place";
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

function placeIslandMatches(place: PlaceRecord, island: IslandCode): boolean {
  if (!place.island) return true;

  return String(place.island).trim().toLowerCase() === island;
}

function placeIdentity(place: PlaceRecord, index: number): string {
  return (
    place.id ||
    `${place.name || place.title || "place"}-${place.lat}-${place.lng}-${index}`
  );
}

function placeTypeLabel(type: PlaceType): string {
  if (type === "beach") return "Beach";
  if (type === "stay") return "Stay";
  if (type === "historic") return "Historic";
  return "Place";
}

function geoJsonLineToLatLngs(line: LineString | null): LatLngExpression[] {
  if (!line) return [];

  return line.coordinates
    .map((point): LatLngExpression | null => {
      if (!Array.isArray(point) || point.length < 2) {
        return null;
      }

      const [lng, lat] = point;

      if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) {
        return null;
      }

      return [lat, lng];
    })
    .filter((point): point is LatLngExpression => point !== null);
}

function getEstateCenter(estate: EstateRecord): LatLngExpression {
  const internalPoint = estateInternalPoint(estate);

  if (internalPoint) {
    return [internalPoint.lat, internalPoint.lng];
  }

  const rings = getEstatePolygonRings(estate);
  const firstRing = rings[0];

  if (firstRing?.length) {
    return centroidOfRing(firstRing);
  }

  return ISLAND_VIEW[estate.island].center;
}

function getEstateBounds(
  estate: EstateRecord | null,
): LatLngBoundsExpression | null {
  if (!estate) return null;

  const rings = getEstatePolygonRings(estate);
  const points = rings.flat();

  if (points.length) {
    return L.latLngBounds(points);
  }

  return expandPointBounds(getEstateCenter(estate));
}

function getEstatePolygonRings(estate: EstateRecord): LatLngExpression[][] {
  const { geometry } = estate;

  switch (geometry.type) {
    case "Polygon":
      return polygonCoordinatesToLeaflet(geometry.coordinates);

    case "MultiPolygon":
      return geometry.coordinates.flatMap((polygon) =>
        polygonCoordinatesToLeaflet(polygon),
      );
  }
}

function polygonCoordinatesToLeaflet(
  coordinates: GeoJSON.Position[][],
): LatLngExpression[][] {
  return coordinates

    .map((ring) =>
      ring

        .map((position): LatLngExpression | null => {
          const [lng, lat] = position;

          if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) {
            return null;
          }

          return [lat, lng];
        })

        .filter((point): point is LatLngExpression => point !== null),
    )

    .filter((ring) => ring.length >= 3);
}

function centroidOfRing(ring: LatLngExpression[]): LatLngExpression {
  if (!ring.length) {
    return [18.336, -64.93];
  }

  const points = ring.map(toLatLngTuple);

  const first = points[0];
  const last = points.at(-1);

  const usablePoints =
    points.length > 1 && last && first[0] === last[0] && first[1] === last[1]
      ? points.slice(0, -1)
      : points;

  if (!usablePoints.length) {
    return [18.336, -64.93];
  }

  const total = usablePoints.reduce(
    (accumulator, [lat, lng]) => ({
      lat: accumulator.lat + lat,
      lng: accumulator.lng + lng,
    }),
    { lat: 0, lng: 0 },
  );

  return [total.lat / usablePoints.length, total.lng / usablePoints.length];
}

function estateInternalPoint(
  estate: EstateRecord,
): { lat: number; lng: number } | null {
  const { lat, lng } = estate.internalPoint;

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    (lat === 0 && lng === 0)
  ) {
    return null;
  }

  return { lat, lng };
}

function buildSyntheticDrivers(
  estates: EstateRecord[],
  island: IslandCode,
): DriverMarker[] {
  const pool = estates.slice(0, 9);

  return pool.map((estate, index) => {
    const center = toLatLngTuple(getEstateCenter(estate));
    const latOffset = ((index % 3) - 1) * 0.0038;
    const lngOffset = ((index % 4) - 1.5) * 0.0042;

    return {
      id: `${island}-driver-${estate.geoid}-${index}`,
      label: `Driver ${index + 1}`,
      lat: center[0] + latOffset,
      lng: center[1] + lngOffset,
      status:
        index % 3 === 0
          ? "available"
          : index % 3 === 1
            ? "assigned"
            : "repositioning",
      nearEstate: estate.baseName,
    };
  });
}

function buildDemandHotspots(
  estates: EstateRecord[],
  places: PositionedPlace[],
  island: IslandCode,
): DemandHotspot[] {
  const fromPlaces = places.slice(0, 5).map(
    (place, index): DemandHotspot => ({
      id: `${island}-place-hotspot-${placeIdentity(place, index)}`,
      label: place.name || place.title || `Zone ${index + 1}`,
      lat: place.lat,
      lng: place.lng,
      radius: index % 3 === 0 ? 520 : index % 3 === 1 ? 700 : 920,
      intensity: index % 3 === 0 ? "high" : index % 3 === 1 ? "medium" : "low",
    }),
  );

  if (fromPlaces.length) {
    return fromPlaces;
  }

  return estates.slice(0, 4).map((estate, index): DemandHotspot => {
    const [lat, lng] = toLatLngTuple(getEstateCenter(estate));

    return {
      id: `${island}-estate-hotspot-${estate.geoid}`,
      label: estate.baseName,
      lat,
      lng,
      radius: index % 2 === 0 ? 760 : 560,
      intensity: index % 2 === 0 ? "medium" : "high",
    };
  });
}

function lensLabel(lens: Lens): string {
  if (lens === "beaches") return "Beaches";
  if (lens === "stays") return "Stays";
  if (lens === "historic") return "Historic";
  if (lens === "drivers") return "Drivers";
  if (lens === "demand") return "Demand";
  return "Places";
}

function savePlaceToTrip(place: PlaceRecord, island: IslandCode) {
  if (typeof window === "undefined") return;

  let existing: TripItem[] = [];

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(TRIP_STORAGE_KEY) || "[]",
    );
    existing = Array.isArray(parsed) ? parsed : [];
  } catch {
    existing = [];
  }

  const id =
    place.id || `${place.name || place.title}-${place.lat}-${place.lng}`;
  const kind = normalizePlaceType(place) as TripItemKind;
  if (existing.some((item) => item.id === id && item.kind === kind)) return;

  const slug = id.replace(/^[^:]+:/, "");
  const item: TripItem = {
    id,
    slug,
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

  window.localStorage.setItem(
    TRIP_STORAGE_KEY,
    JSON.stringify([...existing, item]),
  );
  window.dispatchEvent(new Event("vi-guide-trip-updated"));
}

function placeDetailHref(place: PlaceRecord) {
  const kind = normalizePlaceType(place);
  const slug = (place.id || place.name || place.title || "place").replace(
    /^[^:]+:/,
    "",
  );
  if (kind === "beach") return `/beaches/${slug}`;
  if (kind === "stay") return `/accommodations/${slug}`;
  if (kind === "historic") return `/historic/${slug}`;
  return `/places/${slug}`;
}

function islandName(island: IslandCode) {
  return island === "stt"
    ? "St. Thomas"
    : island === "stj"
      ? "St. John"
      : "St. Croix";
}

function makePlaceIcon(type: PlaceType, selected: boolean) {
  const color = placeColor(type);
  const glyph = placeGlyph(type);
  const size = selected ? 40 : 32;

  return L.divIcon({
    className: "vi-place-marker",
    html: `<div class="vi-place-marker__pin${
      selected ? " is-selected" : ""
    }" style="--marker-color:${color};width:${size}px;height:${size}px"><span>${glyph}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function placeGlyph(type: PlaceType) {
  if (type === "beach") return "≈";
  if (type === "stay") return "▰";
  if (type === "historic") return "⌂";
  return "●";
}

function placeColor(type: PlaceType): string {
  if (type === "beach") return "#38bdf8";
  if (type === "stay") return "#a78bfa";
  if (type === "historic") return "#f59e0b";
  return "#f97316";
}

function makePinIcon(color: string, letter: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 30px;
        height: 30px;
        border-radius: 999px;
        background: ${color};
        color: white;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight: 900;
        font-size: 12px;
        border: 2px solid rgba(255,255,255,0.9);
        box-shadow: 0 8px 22px rgba(0,0,0,0.35);
      ">
        ${letter}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function makeDriverIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 18px;
        height: 18px;
        border-radius: 999px;
        background: ${color};
        border: 2px solid white;
        box-shadow: 0 8px 20px rgba(0,0,0,0.35);
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function toLatLngTuple(value: LatLngExpression): [number, number] {
  if (Array.isArray(value)) {
    return [value[0], value[1]];
  }

  if (value instanceof L.LatLng) {
    return [value.lat, value.lng];
  }

  return [18.336, -64.93];
}

function expandPointBounds(
  center: LatLngExpression,
  delta = 0.01,
): LatLngBoundsExpression {
  const [lat, lng] = toLatLngTuple(center);

  return [
    [lat - delta, lng - delta],
    [lat + delta, lng + delta],
  ];
}
