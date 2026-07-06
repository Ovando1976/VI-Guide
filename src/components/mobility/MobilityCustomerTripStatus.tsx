import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Car,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  RefreshCw,
  UserCheck,
  X,
} from "lucide-react";

import type {
  SaveMobilityTripRequestResult,
  SavedMobilityTripRequest,
} from "../../services/mobilityTripRequests";
import MobilityMapboxMiniMap from "./MobilityMapboxMiniMap";
import MobilityTripHistoryActions from "./MobilityTripHistoryActions";

const STATUS_STEPS = [
  "requested",
  "accepted",
  "driver_arriving",
  "arrived",
  "in_progress",
  "completed",
] as const;

const STATUS_LABELS: Record<string, string> = {
  requested: "Request submitted",
  accepted: "Driver assigned",
  driver_arriving: "Driver arriving",
  arrived: "Driver arrived",
  in_progress: "Trip started",
  completed: "Trip completed",
  cancelled: "Trip cancelled",
};

const SAVED_EVENT_NAME = "viGuide:mobilityTripRequestSaved";

type Coord = {
  lat: number;
  lng: number;
};

type MiniMapPoint = Coord & {
  id: "driver" | "pickup" | "dropoff";
  label: string;
};

function statusIndex(status?: string) {
  const index = STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);
  return index >= 0 ? index : 0;
}

function displayStatus(request: SavedMobilityTripRequest | null) {
  return request?.dispatchStatus || request?.status || "requested";
}

function hasDriverLocation(request: SavedMobilityTripRequest) {
  return (
    typeof request.driverLat === "number" &&
    typeof request.driverLng === "number"
  );
}

function driverMapsUrl(request: SavedMobilityTripRequest) {
  if (!hasDriverLocation(request)) return "#";

  const lat = Number(request.driverLat);
  const lng = Number(request.driverLng);
  const label = encodeURIComponent(
    request.driverLocationLabel || "Driver location",
  );

  return `https://maps.apple.com/?ll=${lat},${lng}&q=${label}`;
}

function estimatedArrivalText(request: SavedMobilityTripRequest) {
  const status = displayStatus(request);

  if (status === "requested") return "Waiting for dispatch";
  if (status === "accepted") return "6–12 min";
  if (status === "driver_arriving") return "3–7 min";
  if (status === "arrived") return "At pickup";
  if (status === "in_progress") return "On trip";
  if (status === "completed") return "Trip complete";
  if (status === "cancelled") return "Cancelled";

  return "Calculating";
}

function formatDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function placeCoordinates(name?: string): Coord {
  const text = String(name ?? "").toLowerCase();

  if (text.includes("red hook")) {
    return { lat: 18.3269, lng: -64.8496 };
  }

  if (text.includes("sapphire")) {
    return { lat: 18.3347, lng: -64.8491 };
  }

  if (text.includes("cyril") || text.includes("king") || text.includes("airport")) {
    return { lat: 18.3373, lng: -64.9734 };
  }

  if (text.includes("havensight")) {
    return { lat: 18.3357, lng: -64.9207 };
  }

  if (text.includes("cruz bay")) {
    return { lat: 18.3317, lng: -64.7944 };
  }

  if (text.includes("trunk")) {
    return { lat: 18.3548, lng: -64.7686 };
  }

  if (text.includes("christiansted")) {
    return { lat: 17.7466, lng: -64.7041 };
  }

  if (text.includes("frederiksted")) {
    return { lat: 17.7125, lng: -64.8821 };
  }

  return { lat: 18.3419, lng: -64.9307 };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function projectPoint(point: Coord, bounds: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}) {
  const lngSpan = bounds.maxLng - bounds.minLng || 0.001;
  const latSpan = bounds.maxLat - bounds.minLat || 0.001;

  return {
    x: clamp(((point.lng - bounds.minLng) / lngSpan) * 100, 6, 94),
    y: clamp(100 - ((point.lat - bounds.minLat) / latSpan) * 100, 8, 92),
  };
}

function miniMapPoints(request: SavedMobilityTripRequest): MiniMapPoint[] {
  const pickup = placeCoordinates(request.pickupName);
  const dropoff = placeCoordinates(request.dropoffName);

  const points: MiniMapPoint[] = [
    {
      id: "pickup",
      label: request.pickupName || "Pickup",
      ...pickup,
    },
    {
      id: "dropoff",
      label: request.dropoffName || "Dropoff",
      ...dropoff,
    },
  ];

  if (hasDriverLocation(request)) {
    points.unshift({
      id: "driver",
      label: request.driverLocationLabel || "Driver",
      lat: Number(request.driverLat),
      lng: Number(request.driverLng),
    });
  }

  return points;
}

function MiniTripMap({ request }: { request: SavedMobilityTripRequest }) {
  const points = miniMapPoints(request);
  const pickup = points.find((point) => point.id === "pickup") ?? points[0];
  const dropoff = points.find((point) => point.id === "dropoff") ?? points[1];
  const driver = points.find((point) => point.id === "driver");

  const latValues = points.map((point) => point.lat);
  const lngValues = points.map((point) => point.lng);

  const latPadding = Math.max(
    (Math.max(...latValues) - Math.min(...latValues)) * 0.25,
    0.01,
  );
  const lngPadding = Math.max(
    (Math.max(...lngValues) - Math.min(...lngValues)) * 0.25,
    0.01,
  );

  const bounds = {
    minLat: Math.min(...latValues) - latPadding,
    maxLat: Math.max(...latValues) + latPadding,
    minLng: Math.min(...lngValues) - lngPadding,
    maxLng: Math.max(...lngValues) + lngPadding,
  };

  const pickupProjected = projectPoint(pickup, bounds);
  const dropoffProjected = projectPoint(dropoff, bounds);
  const driverProjected = driver ? projectPoint(driver, bounds) : null;

  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50 px-4 py-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">
            In-app mini map
          </p>
          <p className="mt-1 text-sm font-bold text-emerald-950">
            Driver, pickup, and dropoff preview
          </p>
        </div>

        {hasDriverLocation(request) ? (
          <a
            href={driverMapsUrl(request)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Open map
          </a>
        ) : null}
      </div>

      <div className="relative h-72 overflow-hidden bg-[#dff8ef]">
        <div className="absolute inset-0 opacity-70">
          <div className="absolute -left-16 top-20 h-64 w-64 rounded-full bg-emerald-200 blur-3xl" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-sky-200 blur-3xl" />
          <div className="absolute bottom-[-5rem] left-1/3 h-56 w-56 rounded-full bg-amber-100 blur-3xl" />
        </div>

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={`M ${pickupProjected.x} ${pickupProjected.y} C ${
              (pickupProjected.x + dropoffProjected.x) / 2
            } ${pickupProjected.y - 18}, ${
              (pickupProjected.x + dropoffProjected.x) / 2
            } ${dropoffProjected.y + 18}, ${dropoffProjected.x} ${
              dropoffProjected.y
            }`}
            fill="none"
            stroke="rgba(15, 23, 42, 0.25)"
            strokeDasharray="3 3"
            strokeLinecap="round"
            strokeWidth="1.7"
          />

          {driverProjected ? (
            <path
              d={`M ${driverProjected.x} ${driverProjected.y} L ${pickupProjected.x} ${pickupProjected.y}`}
              fill="none"
              stroke="rgba(4, 120, 87, 0.7)"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
          ) : null}
        </svg>

        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${pickupProjected.x}%`,
            top: `${pickupProjected.y}%`,
          }}
        >
          <div className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-lg">
            Pickup
          </div>
          <div className="mx-auto mt-1 h-4 w-4 rounded-full border-4 border-white bg-slate-950 shadow-lg" />
        </div>

        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${dropoffProjected.x}%`,
            top: `${dropoffProjected.y}%`,
          }}
        >
          <div className="rounded-2xl bg-amber-300 px-3 py-2 text-xs font-black text-slate-950 shadow-lg">
            Dropoff
          </div>
          <div className="mx-auto mt-1 h-4 w-4 rounded-full border-4 border-white bg-amber-400 shadow-lg" />
        </div>

        {driver && driverProjected ? (
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${driverProjected.x}%`,
              top: `${driverProjected.y}%`,
            }}
          >
            <div className="animate-pulse rounded-2xl bg-emerald-700 px-3 py-2 text-xs font-black text-white shadow-lg">
              Driver
            </div>
            <div className="mx-auto mt-1 grid h-8 w-8 place-items-center rounded-full border-4 border-white bg-emerald-700 text-white shadow-xl">
              <Car className="h-4 w-4" />
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-2 border-t border-emerald-100 p-4 text-xs font-bold text-slate-600 sm:grid-cols-3">
        <div>
          <span className="block text-slate-400">Pickup</span>
          {pickup.label}
        </div>
        <div>
          <span className="block text-slate-400">Dropoff</span>
          {dropoff.label}
        </div>
        <div>
          <span className="block text-slate-400">Driver</span>
          {driver?.label ?? "Waiting for location"}
        </div>
      </div>
    </div>
  );
}

export default function MobilityCustomerTripStatus() {
  const [requestId, setRequestId] = useState<string | null>(null);
  const [request, setRequest] = useState<SavedMobilityTripRequest | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const connectToRequest = useCallback((firestoreId: string) => {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    async function connect() {
      setLoaded(false);
      setError(null);
      setRequestId(firestoreId);

      try {
        const { subscribeMobilityTripRequestById } = await import(
          "../../services/mobilityTripRequests"
        );

        if (cancelled) return;

        unsubscribe = subscribeMobilityTripRequestById({
          firestoreId,
          onData: (nextRequest) => {
            if (cancelled) return;
            setRequest(nextRequest);
            setLoaded(true);
          },
          onError: (nextError) => {
            if (cancelled) return;
            setError(nextError.message);
            setLoaded(true);
          },
        });
      } catch (nextError) {
        if (cancelled) return;

        setError(
          nextError instanceof Error
            ? nextError.message
            : "Could not load trip tracking.",
        );
        setLoaded(true);
      }
    }

    connect();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function loadLastRequest() {
      try {
        const { readLastMobilityTripRequest } = await import(
          "../../services/mobilityTripRequests"
        );

        const lastRequest = readLastMobilityTripRequest();

        if (!lastRequest?.firestoreId) {
          setLoaded(true);
          return;
        }

        cleanup = connectToRequest(lastRequest.firestoreId);
      } catch (nextError) {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Could not load trip tracking.",
        );
        setLoaded(true);
      }
    }

    loadLastRequest();

    function handleSaved(event: Event) {
      const detail = (event as CustomEvent<SaveMobilityTripRequestResult>)
        .detail;

      if (!detail?.firestoreId) return;

      setDismissed(false);
      cleanup?.();
      cleanup = connectToRequest(detail.firestoreId);
    }

    window.addEventListener(SAVED_EVENT_NAME, handleSaved);

    return () => {
      window.removeEventListener(SAVED_EVENT_NAME, handleSaved);
      cleanup?.();
    };
  }, [connectToRequest]);

  const currentStatus = displayStatus(request);
  const currentStep = statusIndex(currentStatus);
  const isCancelled = currentStatus === "cancelled";

  const progressPercent = useMemo(() => {
    if (isCancelled) return 100;
    return Math.round((currentStep / (STATUS_STEPS.length - 1)) * 100);
  }, [currentStep, isCancelled]);

  if (dismissed || (!requestId && loaded)) return null;

  return (
    <section className="mx-auto mb-6 max-w-7xl rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-white">
              Live trip tracking
            </span>

            {request?.updatedAt ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-900">
                Updated {formatDate(request.updatedAt)}
              </span>
            ) : null}
          </div>

          <h2 className="mt-3 text-2xl font-black text-slate-950">
            {STATUS_LABELS[currentStatus] ?? "Tracking trip"}
          </h2>

          <p className="mt-1 text-sm font-semibold text-emerald-950">
            {request?.pickupName ?? "Pickup"} →{" "}
            {request?.dropoffName ?? "Dropoff"}
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            const { clearLastMobilityTripRequest } = await import(
              "../../services/mobilityTripRequests"
            );
            clearLastMobilityTripRequest();
            setDismissed(true);
          }}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 ring-1 ring-emerald-200"
          aria-label="Dismiss live trip tracking"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {!loaded ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-700" />
          Connecting to live trip status…
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-white p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      {request ? (
        <>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
            <div
              className={`h-full rounded-full ${
                isCancelled ? "bg-red-500" : "bg-emerald-700"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
              <Clock className="mb-3 h-5 w-5 text-emerald-700" />
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Status
              </p>
              <p className="mt-1 font-black text-slate-950">
                {STATUS_LABELS[currentStatus] ?? currentStatus}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
              <UserCheck className="mb-3 h-5 w-5 text-emerald-700" />
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Driver
              </p>
              <p className="mt-1 font-black text-slate-950">
                {request.assignedDriverName || "Waiting for assignment"}
              </p>
              {request.assignedVehicleLabel ? (
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {request.assignedVehicleLabel}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
              <Navigation className="mb-3 h-5 w-5 text-emerald-700" />
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Driver location
              </p>

              <p className="mt-1 font-black text-slate-950">
                {request.driverLocationLabel || "No location update yet"}
              </p>

              {hasDriverLocation(request) ? (
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {request.driverLat?.toFixed(5)},{" "}
                  {request.driverLng?.toFixed(5)}
                  {request.driverLocationUpdatedAt
                    ? ` · ${formatDate(request.driverLocationUpdatedAt)}`
                    : ""}
                </p>
              ) : null}

              <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
                  Estimated arrival
                </p>
                <p className="mt-1 text-sm font-black text-emerald-950">
                  {estimatedArrivalText(request)}
                </p>
              </div>

              {hasDriverLocation(request) ? (
                <a
                  href={driverMapsUrl(request)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open map
                </a>
              ) : null}
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
              <MapPin className="mb-3 h-5 w-5 text-emerald-700" />
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Route
              </p>
              <p className="mt-1 text-sm font-black text-slate-950">
                {request.routeDescription ?? "Route pending"}
              </p>
            </div>
          </div>

          <MobilityMapboxMiniMap request={request} />

          <MobilityTripHistoryActions
            request={request}
            onStartNew={() => setDismissed(true)}
          />

          <div className="mt-4 grid gap-2 sm:grid-cols-6">
            {STATUS_STEPS.map((step, index) => {
              const complete = index <= currentStep && !isCancelled;

              return (
                <div
                  key={step}
                  className={`rounded-2xl p-3 text-xs font-black ${
                    complete
                      ? "bg-emerald-700 text-white"
                      : "bg-white text-slate-500 ring-1 ring-emerald-100"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    {complete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : step === "driver_arriving" ? (
                      <Car className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    <span>{STATUS_LABELS[step] ?? step}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </section>
  );
}
