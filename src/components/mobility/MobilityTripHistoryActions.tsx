import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  History,
  RotateCcw,
  XCircle,
} from "lucide-react";

import type { SavedMobilityTripRequest } from "../../services/mobilityTripRequests";

const TRIP_HISTORY_STORAGE_KEY = "viGuide.mobilityTripHistory";

type TripHistoryItem = {
  firestoreId: string;
  path: string;
  status: string;
  pickupName?: string;
  dropoffName?: string;
  assignedDriverName?: string;
  assignedVehicleLabel?: string;
  totalFareCents?: number;
  requestedAt?: string;
  updatedAt?: string;
};

function displayStatus(request: SavedMobilityTripRequest) {
  return request.dispatchStatus || request.status || "requested";
}

function statusLabel(status?: string) {
  if (!status) return "Unknown";
  return status.replaceAll("_", " ");
}

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

function readTripHistory(): TripHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const rawValue = window.localStorage.getItem(TRIP_HISTORY_STORAGE_KEY);
    if (!rawValue) return [];

    const parsed = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item.firestoreId === "string")
      .slice(0, 10) as TripHistoryItem[];
  } catch {
    return [];
  }
}

function writeTripHistory(items: TripHistoryItem[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      TRIP_HISTORY_STORAGE_KEY,
      JSON.stringify(items.slice(0, 10)),
    );
  } catch {
    // Ignore storage failures. Firestore tracking still works.
  }
}

function toTripHistoryItem(request: SavedMobilityTripRequest): TripHistoryItem {
  return {
    firestoreId: request.firestoreId,
    path: request.path,
    status: displayStatus(request),
    pickupName: request.pickupName,
    dropoffName: request.dropoffName,
    assignedDriverName: request.assignedDriverName,
    assignedVehicleLabel: request.assignedVehicleLabel,
    totalFareCents: request.totalFareCents,
    requestedAt: request.requestedAt,
    updatedAt: request.updatedAt,
  };
}

function saveTripToHistory(request: SavedMobilityTripRequest) {
  const nextItem = toTripHistoryItem(request);
  const currentItems = readTripHistory();

  const nextItems = [
    nextItem,
    ...currentItems.filter((item) => item.firestoreId !== nextItem.firestoreId),
  ];

  writeTripHistory(nextItems);
  return nextItems;
}

export default function MobilityTripHistoryActions({
  request,
  onStartNew,
}: {
  request: SavedMobilityTripRequest;
  onStartNew: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [recentTrips, setRecentTrips] = useState<TripHistoryItem[]>([]);
  const [startedNew, setStartedNew] = useState(false);

  const currentStatus = displayStatus(request);
  const tripEnded =
    currentStatus === "completed" || currentStatus === "cancelled";

  useEffect(() => {
    if (!request.firestoreId) return;

    setRecentTrips(saveTripToHistory(request));
  }, [
    request.firestoreId,
    request.path,
    request.dispatchStatus,
    request.status,
    request.pickupName,
    request.dropoffName,
    request.assignedDriverName,
    request.assignedVehicleLabel,
    request.totalFareCents,
    request.requestedAt,
    request.updatedAt,
  ]);

  const visibleRecentTrips = useMemo(() => {
    return recentTrips.slice(0, 5);
  }, [recentTrips]);

  if (!tripEnded) return null;

  return (
    <div className="mt-4 rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
              {currentStatus === "completed" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {currentStatus === "completed" ? "Trip completed" : "Trip cancelled"}
            </span>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-900">
              {formatDate(request.updatedAt)}
            </span>
          </div>

          <h3 className="mt-3 text-xl font-black text-slate-950">
            {request.pickupName ?? "Pickup"} → {request.dropoffName ?? "Dropoff"}
          </h3>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            {request.assignedDriverName
              ? `${request.assignedDriverName}${
                  request.assignedVehicleLabel
                    ? ` · ${request.assignedVehicleLabel}`
                    : ""
                }`
              : "No driver saved"}
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
            Fare
          </p>
          <p className="text-xl font-black text-emerald-950">
            {moneyFromCents(request.totalFareCents)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5"
        >
          <History className="h-4 w-4" />
          {expanded ? "Hide trip details" : "View completed trip"}
        </button>

        <button
          type="button"
          onClick={async () => {
            const { clearLastMobilityTripRequest } = await import(
              "../../services/mobilityTripRequests"
            );

            clearLastMobilityTripRequest();
            setStartedNew(true);
            onStartNew();

            if (typeof window !== "undefined") {
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5"
        >
          <RotateCcw className="h-4 w-4" />
          Start new request
        </button>

        <div className="rounded-2xl bg-emerald-50 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
            Saved
          </p>
          <p className="mt-1 text-sm font-black text-emerald-950">
            {startedNew ? "Ready for a new request" : "Saved to recent trips"}
          </p>
        </div>
      </div>

      {expanded ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Completed trip details
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-white p-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Status
              </p>
              <p className="mt-1 font-black capitalize">
                {statusLabel(currentStatus)}
              </p>
            </div>

            <div className="rounded-xl bg-white p-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Requested
              </p>
              <p className="mt-1 font-black">
                {formatDate(request.requestedAt)}
              </p>
            </div>

            <div className="rounded-xl bg-white p-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Updated
              </p>
              <p className="mt-1 font-black">{formatDate(request.updatedAt)}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Recent trips
            </p>

            <div className="mt-3 space-y-2">
              {visibleRecentTrips.map((trip) => (
                <div
                  key={trip.firestoreId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3"
                >
                  <div>
                    <p className="font-black text-slate-950">
                      {trip.pickupName ?? "Pickup"} →{" "}
                      {trip.dropoffName ?? "Dropoff"}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {statusLabel(trip.status)} · {formatDate(trip.updatedAt)}
                    </p>
                  </div>

                  <p className="font-black text-slate-950">
                    {moneyFromCents(trip.totalFareCents)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
