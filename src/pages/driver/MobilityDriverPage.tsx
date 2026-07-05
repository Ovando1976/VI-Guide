import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  MapPin,
  Navigation,
  RefreshCw,
  UserCheck,
} from "lucide-react";

import type {
  MobilityDriverLocationUpdate,
  MobilityTripDispatchStatus,
  SavedMobilityTripRequest,
} from "../../services/mobilityTripRequests";

const DRIVER_OPTIONS = [
  {
    driverId: "stt-dispatch-driver-01",
    driverName: "St. Thomas Driver 1",
    vehicleLabel: "STT Van 1",
  },
  {
    driverId: "stt-dispatch-driver-02",
    driverName: "St. Thomas Driver 2",
    vehicleLabel: "STT SUV 1",
  },
  {
    driverId: "stj-dispatch-driver-01",
    driverName: "St. John Driver 1",
    vehicleLabel: "STJ Jeep 1",
  },
  {
    driverId: "stx-dispatch-driver-01",
    driverName: "St. Croix Driver 1",
    vehicleLabel: "STX Van 1",
  },
  {
    driverId: "wat-dispatch-driver-01",
    driverName: "Water Island Driver 1",
    vehicleLabel: "Water Island Cart 1",
  },
];

const DRIVER_STORAGE_KEY = "viGuide.mobilityDriverId";

const STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  accepted: "Accepted",
  driver_arriving: "Driver arriving",
  arrived: "Arrived",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function moneyFromCents(cents?: number) {
  const safeCents = typeof cents === "number" ? cents : 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: safeCents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: safeCents % 100 === 0 ? 0 : 2,
  }).format(safeCents / 100);
}

function formatDate(value?: string) {
  if (!value) return "Unknown time";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function displayStatus(request: SavedMobilityTripRequest) {
  return request.dispatchStatus || request.status || "requested";
}

function activeTrips(requests: SavedMobilityTripRequest[]) {
  return requests.filter((request) => {
    const status = displayStatus(request);
    return status !== "completed" && status !== "cancelled";
  });
}

function placeCoordinates(name?: string): { lat: number; lng: number } {
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

  if (text.includes("christiansted")) {
    return { lat: 17.7466, lng: -64.7041 };
  }

  return { lat: 18.3419, lng: -64.9307 };
}

function midpoint(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  return {
    lat: Number(((a.lat + b.lat) / 2).toFixed(6)),
    lng: Number(((a.lng + b.lng) / 2).toFixed(6)),
  };
}

function simulatedLocationForRequest(
  request: SavedMobilityTripRequest,
  statusOverride?: MobilityTripDispatchStatus,
): MobilityDriverLocationUpdate {
  const status = statusOverride ?? displayStatus(request);
  const pickup = placeCoordinates(request.pickupName);
  const dropoff = placeCoordinates(request.dropoffName);

  if (status === "arrived") {
    return {
      ...pickup,
      label: `Arrived at pickup: ${request.pickupName ?? "pickup"}`,
    };
  }

  if (status === "in_progress") {
    return {
      ...midpoint(pickup, dropoff),
      label: `On trip: ${request.pickupName ?? "pickup"} to ${
        request.dropoffName ?? "dropoff"
      }`,
    };
  }

  if (status === "completed") {
    return {
      ...dropoff,
      label: `Completed near dropoff: ${request.dropoffName ?? "dropoff"}`,
    };
  }

  if (status === "driver_arriving") {
    const nearPickup = midpoint(pickup, {
      lat: pickup.lat + 0.012,
      lng: pickup.lng - 0.012,
    });

    return {
      ...nearPickup,
      label: `Approaching pickup: ${request.pickupName ?? "pickup"}`,
    };
  }

  return {
    ...midpoint(pickup, {
      lat: pickup.lat + 0.018,
      lng: pickup.lng - 0.018,
    }),
    label: `Staged near pickup: ${request.pickupName ?? "pickup"}`,
  };
}

function DriverTripCard({
  request,
  updating,
  locating,
  onStatusChange,
  onLocationUpdate,
}: {
  request: SavedMobilityTripRequest;
  updating: boolean;
  locating: boolean;
  onStatusChange: (
    request: SavedMobilityTripRequest,
    status: MobilityTripDispatchStatus,
  ) => void;
  onLocationUpdate: (
    firestoreId: string,
    location: MobilityDriverLocationUpdate,
  ) => void;
}) {
  const status = displayStatus(request);
  const simulatedLocation = simulatedLocationForRequest(request);

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="bg-slate-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-white">
              {STATUS_LABELS[status] ?? status}
            </span>

            <h2 className="mt-4 text-2xl font-black text-slate-950">
              {request.pickupName ?? "Pickup"} →{" "}
              {request.dropoffName ?? "Dropoff"}
            </h2>

            <p className="mt-1 text-sm font-bold text-slate-500">
              Requested {formatDate(request.requestedAt)}
            </p>
          </div>

          <div className="rounded-2xl bg-white px-5 py-4 text-right shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Fare
            </p>
            <p className="text-2xl font-black text-slate-950">
              {moneyFromCents(request.totalFareCents)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 p-4">
          <MapPin className="mb-3 h-5 w-5 text-emerald-700" />
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Pickup
          </p>
          <p className="mt-1 font-black">{request.pickupName}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <Navigation className="mb-3 h-5 w-5 text-emerald-700" />
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Dropoff
          </p>
          <p className="mt-1 font-black">{request.dropoffName}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <Car className="mb-3 h-5 w-5 text-emerald-700" />
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Riders
          </p>
          <p className="mt-1 font-black">
            {request.passengers ?? 0} passenger(s), {request.luggage ?? 0} bag(s)
          </p>
        </div>
      </div>

      <div className="border-t border-slate-100 p-5">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Driver location
          </p>

          <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
            {request.driverLocationLabel ?? "No location update sent yet."}
          </p>

          {typeof request.driverLat === "number" &&
          typeof request.driverLng === "number" ? (
            <p className="mt-1 text-xs font-bold text-slate-500">
              {request.driverLat.toFixed(5)}, {request.driverLng.toFixed(5)} ·{" "}
              {formatDate(request.driverLocationUpdatedAt)}
            </p>
          ) : null}

          <button
            type="button"
            disabled={locating}
            onClick={() =>
              onLocationUpdate(request.firestoreId, simulatedLocation)
            }
            className="mt-4 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {locating ? "Updating location..." : "Update my location"}
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Route
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
            {request.routeDescription ?? "Route pending"}
          </p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {([
            ["driver_arriving", "I’m arriving"],
            ["arrived", "I arrived"],
            ["in_progress", "Start trip"],
            ["completed", "Complete"],
          ] as Array<[MobilityTripDispatchStatus, string]>).map(
            ([nextStatus, label]) => (
              <button
                key={nextStatus}
                type="button"
                disabled={
                  updating ||
                  status === nextStatus ||
                  status === "completed" ||
                  status === "cancelled"
                }
                onClick={() => onStatusChange(request, nextStatus)}
                className="rounded-2xl bg-slate-950 px-4 py-4 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {updating ? "Updating..." : label}
              </button>
            ),
          )}
        </div>
      </div>
    </article>
  );
}

export default function MobilityDriverPage() {
  const [driverId, setDriverId] = useState(() => {
    if (typeof window === "undefined") return DRIVER_OPTIONS[0].driverId;

    return (
      window.localStorage.getItem(DRIVER_STORAGE_KEY) ||
      DRIVER_OPTIONS[0].driverId
    );
  });

  const [requests, setRequests] = useState<SavedMobilityTripRequest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [locatingId, setLocatingId] = useState<string | null>(null);

  const selectedDriver =
    DRIVER_OPTIONS.find((driver) => driver.driverId === driverId) ||
    DRIVER_OPTIONS[0];

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DRIVER_STORAGE_KEY, driverId);
    }

    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    async function connect() {
      setLoaded(false);
      setError(null);

      try {
        const { subscribeAssignedMobilityTripRequests } = await import(
          "../../services/mobilityTripRequests"
        );

        if (cancelled) return;

        unsubscribe = subscribeAssignedMobilityTripRequests({
          driverId,
          limitCount: 50,
          onData: (nextRequests) => {
            if (cancelled) return;
            setRequests(nextRequests);
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
            : "Could not load assigned driver trips.",
        );
        setLoaded(true);
      }
    }

    connect();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [driverId]);

  async function handleStatusChange(
    request: SavedMobilityTripRequest,
    status: MobilityTripDispatchStatus,
  ) {
    setUpdatingId(request.firestoreId);
    setError(null);

    try {
      const {
        updateMobilityTripRequestStatus,
        updateMobilityTripRequestDriverLocation,
      } = await import("../../services/mobilityTripRequests");

      await updateMobilityTripRequestStatus({
        firestoreId: request.firestoreId,
        status,
      });

      await updateMobilityTripRequestDriverLocation({
        firestoreId: request.firestoreId,
        location: simulatedLocationForRequest(request, status),
      });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not update trip status and driver location.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleLocationUpdate(
    firestoreId: string,
    location: MobilityDriverLocationUpdate,
  ) {
    setLocatingId(firestoreId);
    setError(null);

    try {
      const { updateMobilityTripRequestDriverLocation } = await import(
        "../../services/mobilityTripRequests"
      );

      await updateMobilityTripRequestDriverLocation({
        firestoreId,
        location,
      });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not update driver location.",
      );
    } finally {
      setLocatingId(null);
    }
  }

  const active = useMemo(() => activeTrips(requests), [requests]);

  const completedCount = useMemo(() => {
    return requests.filter((request) => displayStatus(request) === "completed")
      .length;
  }, [requests]);

  return (
    <main className="min-h-screen bg-[#f7edcf] px-4 py-8 text-slate-950 sm:px-6 lg:px-10">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-amber-100 bg-white shadow-2xl shadow-amber-950/10">
        <div className="bg-[#020617] px-6 py-10 text-white sm:px-10">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-[0.35em] text-slate-950">
              USVI Driver
            </span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-white/70">
              Assigned trip board
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
                Driver trip board.
              </h1>
              <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-300">
                View trips assigned by dispatch and update the rider in real
                time as you arrive, start, and complete the trip.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/mobility"
                  className="rounded-2xl bg-amber-300 px-5 py-4 text-sm font-black text-slate-950 shadow-lg shadow-amber-950/20"
                >
                  Rider page
                </a>

                <a
                  href="/admin/mobility"
                  className="rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white ring-1 ring-white/15"
                >
                  Dispatch board
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <UserCheck className="mb-3 h-6 w-6 text-amber-300" />
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                Active
              </p>
              <p className="mt-1 text-3xl font-black">{active.length}</p>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                Completed
              </p>
              <p className="mt-1 text-3xl font-black">{completedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#fff9e8] p-6 sm:p-8">
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5">
            <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Driver
            </label>
            <select
              value={driverId}
              onChange={(event) => setDriverId(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-black text-slate-950 outline-none"
            >
              {DRIVER_OPTIONS.map((driver) => (
                <option key={driver.driverId} value={driver.driverId}>
                  {driver.driverName} — {driver.vehicleLabel}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <div className="mb-5 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-900">
              <div className="flex gap-3">
                <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-black">Driver board error</p>
                  <p className="mt-1 text-sm font-semibold leading-6">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {!error && !loaded ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
              <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-amber-700" />
              <p className="text-lg font-black">Loading assigned trips…</p>
            </div>
          ) : null}

          {!error && loaded && active.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-8 w-8 text-emerald-700" />
              <p className="text-lg font-black">
                No active trips for {selectedDriver.driverName}.
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Assign a trip from the dispatch board.
              </p>
            </div>
          ) : null}

          {active.length > 0 ? (
            <div className="space-y-5">
              {active.map((request) => (
                <DriverTripCard
                  key={request.firestoreId}
                  request={request}
                  updating={updatingId === request.firestoreId}
                  locating={locatingId === request.firestoreId}
                  onStatusChange={handleStatusChange}
                  onLocationUpdate={handleLocationUpdate}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
