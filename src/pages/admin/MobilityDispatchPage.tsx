import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Clock,
  Database,
  MapPin,
  RefreshCw,
  Ship,
  Users,
} from "lucide-react";

import type { SavedMobilityTripRequest } from "../../services/mobilityTripRequests";

const ISLAND_LABELS: Record<string, string> = {
  st_thomas: "St. Thomas",
  st_john: "St. John",
  st_croix: "St. Croix",
  water_island: "Water Island",
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

function statusLabel(status?: string) {
  if (!status) return "Unknown";
  return status.replaceAll("_", " ");
}

function statusBadgeClass(status?: string) {
  if (status === "requested") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "cancelled" || status === "disputed") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

function RequestCard({ request }: { request: SavedMobilityTripRequest }) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${statusBadgeClass(
                  request.status,
                )}`}
              >
                {statusLabel(request.status)}
              </span>

              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500">
                {request.connectorLabel ?? "Local"}
              </span>
            </div>

            <h3 className="mt-3 text-xl font-black text-slate-950">
              {request.pickupName ?? "Unknown pickup"} →{" "}
              {request.dropoffName ?? "Unknown dropoff"}
            </h3>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {ISLAND_LABELS[String(request.pickupIsland)] ??
                request.pickupIsland ??
                "Unknown island"}{" "}
              →{" "}
              {ISLAND_LABELS[String(request.dropoffIsland)] ??
                request.dropoffIsland ??
                "Unknown island"}
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

      <div className="grid gap-3 p-5 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <Clock className="mb-3 h-5 w-5 text-amber-700" />
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Requested
          </p>
          <p className="mt-1 font-black">{formatDate(request.requestedAt)}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <Users className="mb-3 h-5 w-5 text-amber-700" />
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Riders
          </p>
          <p className="mt-1 font-black">
            {request.passengers ?? 0} passenger(s)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <Car className="mb-3 h-5 w-5 text-amber-700" />
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Service
          </p>
          <p className="mt-1 font-black capitalize">
            {request.serviceClass ?? "Unknown"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <Ship className="mb-3 h-5 w-5 text-amber-700" />
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Bags
          </p>
          <p className="mt-1 font-black">{request.luggage ?? 0}</p>
        </div>
      </div>

      <div className="border-t border-slate-100 p-5">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Route
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
            {request.routeDescription ?? "No route description saved."}
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Taxi
            </p>
            <p className="mt-1 font-black">
              {moneyFromCents(request.taxiFareCents)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Ferry
            </p>
            <p className="mt-1 font-black">
              {moneyFromCents(request.ferryFareCents)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Firestore
            </p>
            <p className="mt-1 truncate text-sm font-black">{request.path}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MobilityDispatchPage() {
  const [requests, setRequests] = useState<SavedMobilityTripRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    async function connectDispatchFeed() {
      setLoaded(false);
      setError(null);

      try {
        const { subscribeRecentMobilityTripRequests } = await import(
          "../../services/mobilityTripRequests"
        );

        if (cancelled) return;

        unsubscribe = subscribeRecentMobilityTripRequests({
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
            : "Could not load Firebase dispatch service.",
        );
        setLoaded(true);
      }
    }

    connectDispatchFeed();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const requestedCount = useMemo(() => {
    return requests.filter((request) => request.status === "requested").length;
  }, [requests]);

  const totalFareCents = useMemo(() => {
    return requests.reduce((sum, request) => {
      return sum + (request.totalFareCents ?? 0);
    }, 0);
  }, [requests]);

  return (
    <main className="min-h-screen bg-[#f7edcf] px-4 py-8 text-slate-950 sm:px-6 lg:px-10">
      <section className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-amber-100 bg-white shadow-2xl shadow-amber-950/10">
        <div className="bg-[#020617] px-6 py-10 text-white sm:px-10 lg:px-12">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-[0.35em] text-slate-950">
              USVI Dispatch
            </span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-white/70">
              Live read-only board
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Mobility dispatch dashboard.
              </h1>
              <p className="mt-5 max-w-3xl text-base font-medium leading-8 text-slate-300 sm:text-lg">
                This page is route-safe. Firebase loads after render, so the
                admin route will not blank the app if Firestore has an issue.
              </p>

              <a
                href="/mobility"
                className="mt-6 inline-flex rounded-2xl bg-amber-300 px-5 py-4 text-sm font-black text-slate-950 shadow-lg shadow-amber-950/20"
              >
                Back to Mobility
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <Database className="mb-3 h-6 w-6 text-amber-300" />
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                  Loaded
                </p>
                <p className="mt-1 text-3xl font-black">{requests.length}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <CheckCircle2 className="mb-3 h-6 w-6 text-amber-300" />
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                  Requested
                </p>
                <p className="mt-1 text-3xl font-black">{requestedCount}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <MapPin className="mb-3 h-6 w-6 text-amber-300" />
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                  Fare volume
                </p>
                <p className="mt-1 text-3xl font-black">
                  {moneyFromCents(totalFareCents)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#fff9e8] p-6 sm:p-8 lg:p-10">
          {error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-900">
              <div className="flex gap-3">
                <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-black">Could not load dispatch requests</p>
                  <p className="mt-1 text-sm font-semibold leading-6">
                    {error}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6">
                    The page itself is stable. This is now a Firebase config,
                    auth, or Firestore rules issue.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {!error && !loaded ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
              <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-amber-700" />
              <p className="text-lg font-black">Loading dispatch requests…</p>
            </div>
          ) : null}

          {!error && loaded && requests.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
              <Database className="mx-auto mb-4 h-8 w-8 text-amber-700" />
              <p className="text-lg font-black">No trip requests yet.</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Create one from the Mobility planner, then return here.
              </p>
            </div>
          ) : null}

          {!error && requests.length > 0 ? (
            <div className="space-y-5">
              {requests.map((request) => (
                <RequestCard key={request.firestoreId} request={request} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
