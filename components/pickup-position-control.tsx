"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Crosshair,
  LocateFixed,
  MapPinned,
  RotateCcw,
} from "lucide-react";

import type { EstateRecord, IslandCode, LngLat } from "@/types/usvi";

const PickupPinMap = dynamic(
  () => import("@/components/pickup-pin-map").then((module) => module.PickupPinMap),
  {
    ssr: false,
    loading: () => <div className="h-[250px] animate-pulse rounded-[22px] bg-slate-100 sm:h-[280px]" />,
  },
);

const COOKIE_NAME = "vi_pickup_context";
const COOKIE_MAX_AGE_SECONDS = 2 * 60 * 60;
const COOKIE_MAX_AGE_MS = COOKIE_MAX_AGE_SECONDS * 1000;

const MEETING_POINTS = [
  "Hotel lobby",
  "Resort entrance",
  "Airport arrivals",
  "Ferry dock",
  "Villa / gate",
  "Beach entrance",
  "Roadside pickup",
] as const;

type MeetingPoint = (typeof MEETING_POINTS)[number];

type PickupContext = {
  v: 1;
  estateGeoid: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
  source?: "device" | "pin";
  meetingPoint?: MeetingPoint;
  updatedAt: number;
};

type Props = {
  estates: EstateRecord[];
  island: IslandCode;
  selectedGeoid: string;
  onSelectEstate: (geoid: string) => void;
};

export function PickupPositionControl({
  estates,
  island,
  selectedGeoid,
  onSelectEstate,
}: Props) {
  const selectedEstate = useMemo(
    () => estates.find((estate) => estate.geoid === selectedGeoid) ?? null,
    [estates, selectedGeoid],
  );
  const [context, setContext] = useState<PickupContext | null>(null);
  const [locating, setLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"ok" | "error" | "info">("info");

  useEffect(() => {
    const stored = readPickupCookie();
    if (!stored) return;
    if (Date.now() - stored.updatedAt > COOKIE_MAX_AGE_MS) {
      clearPickupCookie();
      return;
    }
    if (selectedGeoid && stored.estateGeoid === selectedGeoid) {
      setContext(stored);
      if (hasPrecisePoint(stored)) setShowMap(true);
    }
  }, []);

  useEffect(() => {
    if (!context || !selectedGeoid || context.estateGeoid === selectedGeoid) return;
    setContext(null);
    setMessage("Precise pickup cleared because the pickup area changed.");
    setTone("info");
    clearPickupCookie();
  }, [context, selectedGeoid]);

  function persist(next: PickupContext | null) {
    setContext(next);
    if (!next) {
      clearPickupCookie();
      return;
    }
    writePickupCookie(next);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setTone("error");
      setMessage("Location services are not available in this browser.");
      return;
    }

    setLocating(true);
    setMessage("Finding your pickup and verifying its official fare area…");
    setTone("info");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const matches = estates.filter((estate) => geometryContains(estate.geometry, point));
        if (matches.length !== 1) {
          setLocating(false);
          setTone("error");
          setMessage(
            matches.length === 0
              ? "Your location could not be resolved to one official island fare area. Search your pickup instead."
              : "Your location touches more than one fare area. Search your pickup so we can verify it safely.",
          );
          return;
        }

        const matched = matches[0];
        onSelectEstate(matched.geoid);
        const next: PickupContext = {
          v: 1,
          estateGeoid: matched.geoid,
          lat: point.lat,
          lng: point.lng,
          accuracy: Math.max(0, Math.round(position.coords.accuracy || 0)),
          source: "device",
          meetingPoint:
            context?.estateGeoid === matched.geoid ? context.meetingPoint : undefined,
          updatedAt: Date.now(),
        };
        persist(next);
        setShowMap(true);
        setTone("ok");
        setMessage(`Live pickup verified inside ${matched.baseName}.`);
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        setTone("error");
        if (error.code === error.PERMISSION_DENIED) {
          setMessage("Location permission was declined. Search your pickup or adjust the pin manually.");
        } else if (error.code === error.TIMEOUT) {
          setMessage("Location timed out. Try again or search your pickup manually.");
        } else {
          setMessage("We could not read your location. Search your pickup or try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }

  function updatePin(point: LngLat) {
    if (!selectedEstate) {
      setTone("error");
      setMessage("Choose a pickup area before adjusting the pin.");
      return;
    }
    if (!geometryContains(selectedEstate.geometry, point)) {
      setTone("error");
      setMessage(`Keep the pickup pin inside the verified ${selectedEstate.baseName} fare area.`);
      return;
    }

    persist({
      v: 1,
      estateGeoid: selectedEstate.geoid,
      lat: point.lat,
      lng: point.lng,
      source: "pin",
      meetingPoint:
        context?.estateGeoid === selectedEstate.geoid ? context.meetingPoint : undefined,
      updatedAt: Date.now(),
    });
    setTone("ok");
    setMessage("Exact pickup pin saved for the driver.");
  }

  function selectMeetingPoint(meetingPoint: MeetingPoint) {
    if (!selectedEstate) return;
    const next: PickupContext = {
      v: 1,
      estateGeoid: selectedEstate.geoid,
      ...(context?.estateGeoid === selectedEstate.geoid && hasPrecisePoint(context)
        ? {
            lat: context.lat,
            lng: context.lng,
            accuracy: context.accuracy,
            source: context.source,
          }
        : {}),
      meetingPoint,
      updatedAt: Date.now(),
    };
    persist(next);
    setTone("ok");
    setMessage(`${meetingPoint} will be included in the driver pickup details.`);
  }

  function removePrecisePin() {
    if (!selectedEstate) return;
    if (context?.meetingPoint) {
      persist({
        v: 1,
        estateGeoid: selectedEstate.geoid,
        meetingPoint: context.meetingPoint,
        updatedAt: Date.now(),
      });
    } else {
      persist(null);
    }
    setShowMap(false);
    setTone("info");
    setMessage("Exact pin removed. The governed fare area remains selected.");
  }

  const precise = context?.estateGeoid === selectedGeoid && hasPrecisePoint(context);
  const mapPosition: LngLat | null = selectedEstate
    ? precise
      ? { lat: context!.lat!, lng: context!.lng! }
      : selectedEstate.internalPoint
    : null;

  return (
    <section className="mt-4 rounded-[26px] border border-teal-100 bg-[linear-gradient(145deg,#f3fbf9,#ffffff)] p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-teal-700">
            <Crosshair className="h-4 w-4" /> Exact pickup
          </div>
          <div className="mt-1 text-base font-black text-[#043331]">
            {precise ? "Driver-ready pickup pin" : "Help the driver find you faster"}
          </div>
          <p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-slate-500">
            GPS and map pins improve pickup precision only. Pricing still comes from the verified official fare area.
          </p>
        </div>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.12em] text-white shadow-sm disabled:opacity-60"
        >
          <LocateFixed className={`h-4 w-4 ${locating ? "animate-pulse" : ""}`} />
          {locating ? "Locating…" : "Use my location"}
        </button>
      </div>

      {selectedEstate ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-[8px] font-black uppercase tracking-[.1em] text-emerald-700 ring-1 ring-emerald-100">
            <BadgeCheck className="h-3.5 w-3.5" /> Fare area · {selectedEstate.baseName}
          </span>
          <button
            type="button"
            onClick={() => setShowMap((value) => !value)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[8px] font-black uppercase tracking-[.1em] text-slate-700"
          >
            <MapPinned className="h-3.5 w-3.5" /> {showMap ? "Hide pin map" : "Adjust pickup pin"}
          </button>
          {precise ? (
            <button
              type="button"
              onClick={removePrecisePin}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[8px] font-black uppercase tracking-[.1em] text-slate-500"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Remove exact pin
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-xs font-semibold text-slate-500 ring-1 ring-slate-100">
          Search a pickup first, or use your current location to resolve the official {island.toUpperCase()} fare area automatically.
        </p>
      )}

      {selectedEstate ? (
        <div className="mt-4">
          <div className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">Where should the driver meet you?</div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {MEETING_POINTS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => selectMeetingPoint(item)}
                aria-pressed={context?.estateGeoid === selectedGeoid && context.meetingPoint === item}
                className={`min-h-10 shrink-0 rounded-full border px-3 text-[9px] font-black transition ${
                  context?.estateGeoid === selectedGeoid && context.meetingPoint === item
                    ? "border-[#0f766e] bg-[#0f766e] text-white"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {showMap && selectedEstate && mapPosition ? (
        <div className="mt-4">
          <PickupPinMap
            center={selectedEstate.internalPoint}
            position={mapPosition}
            precise={precise}
            onChange={updatePin}
          />
          <p className="mt-2 text-[10px] font-semibold leading-5 text-slate-500">
            Tap the map or drag the pin to your exact pickup. The pin must remain inside {selectedEstate.baseName}; the server verifies this again before creating the ride.
          </p>
        </div>
      ) : null}

      {message ? (
        <div
          role="status"
          className={`mt-3 rounded-2xl px-3 py-2 text-[10px] font-bold leading-5 ${
            tone === "error"
              ? "bg-rose-50 text-rose-700"
              : tone === "ok"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-50 text-slate-600"
          }`}
        >
          {message}
        </div>
      ) : null}
    </section>
  );
}

function hasPrecisePoint(context: PickupContext) {
  return Number.isFinite(context.lat) && Number.isFinite(context.lng);
}

function readPickupCookie(): PickupContext | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as PickupContext;
    return parsed?.v === 1 && typeof parsed.estateGeoid === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function writePickupCookie(context: PickupContext) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(context))}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

function clearPickupCookie() {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

function geometryContains(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  point: LngLat,
) {
  if (geometry.type === "Polygon") return polygonContains(geometry.coordinates, point);
  return geometry.coordinates.some((polygon) => polygonContains(polygon, point));
}

function polygonContains(coordinates: GeoJSON.Position[][], point: LngLat) {
  if (!coordinates.length || !ringContains(coordinates[0], point)) return false;
  for (let index = 1; index < coordinates.length; index += 1) {
    if (ringContains(coordinates[index], point)) return false;
  }
  return true;
}

function ringContains(ring: GeoJSON.Position[], point: LngLat) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}
