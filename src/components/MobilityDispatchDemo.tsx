import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Briefcase, CalendarClock, Car, CheckCircle2, Clock, MapPin, Phone, RefreshCw, RotateCcw, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  clearDemoMobilityRequests,
  islandLabels,
  readDemoMobilityRequests,
  seedDemoMobilityRequests,
  serviceLabels,
  statusLabels,
  updateDemoMobilityRequestStatus,
  type DemoMobilityRequest,
  type DemoMobilityRequestStatus,
} from "../lib/mobility/demoMobilityStore";
import {
  subscribeToFirestoreMobilityRequests,
  updateFirestoreMobilityRequestStatus,
} from "../lib/firestore/mobilityRequests";

const statusFlow: DemoMobilityRequestStatus[] = [
  "new",
  "quoted",
  "accepted",
  "driver_en_route",
  "arrived",
  "completed",
];

function nextStatus(status: DemoMobilityRequestStatus): DemoMobilityRequestStatus {
  const index = statusFlow.indexOf(status);
  if (index < 0 || index === statusFlow.length - 1) return status;
  return statusFlow[index + 1];
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function MobilityDispatchDemo() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DemoMobilityRequest[]>(() =>
    readDemoMobilityRequests()
  );
  const [filter, setFilter] = useState<DemoMobilityRequestStatus | "all">("all");

  function refresh() {
    setRequests(readDemoMobilityRequests());
  }

  useEffect(() => {
    let unsubscribe: undefined | (() => void);

    try {
      unsubscribe = subscribeToFirestoreMobilityRequests(
        (firestoreRequests) => {
          if (firestoreRequests.length > 0) {
            setRequests(
              firestoreRequests.map((request) => ({
                ...request,
                createdAt: new Date(request.createdAt).toISOString(),
                updatedAt: new Date(request.updatedAt).toISOString(),
              }))
            );
          } else {
            refresh();
          }
        },
        (error) => {
          console.warn("Firestore mobility subscription failed; using local demo store.", error);
          refresh();
        }
      );
    } catch (error) {
      console.warn("Firestore mobility subscription unavailable; using local demo store.", error);
      refresh();
    }

    const handler = () => refresh();
    window.addEventListener("vi-guide-demo-mobility-updated", handler);
    window.addEventListener("storage", handler);

    return () => {
      unsubscribe?.();
      window.removeEventListener("vi-guide-demo-mobility-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((request) => request.status === filter);
  }, [filter, requests]);

  const stats = {
    active: requests.filter((request) =>
      ["new", "quoted", "accepted", "driver_en_route", "arrived"].includes(request.status)
    ).length,
    new: requests.filter((request) => request.status === "new").length,
    accepted: requests.filter((request) => request.status === "accepted").length,
    completed: requests.filter((request) => request.status === "completed").length,
  };

  async function advance(request: DemoMobilityRequest) {
    const status = nextStatus(request.status);

    updateDemoMobilityRequestStatus(request.id, status);
    refresh();

    try {
      await updateFirestoreMobilityRequestStatus(request.id, status, request.status);
    } catch (error) {
      console.warn("Firestore status update failed; local demo status was still updated.", error);
    }
  }

  function reset() {
    clearDemoMobilityRequests();
    seedDemoMobilityRequests();
    refresh();
  }

  return (
    <div className="min-h-screen pb-48 pt-24">
      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-[2.5rem] bg-ink p-5 text-white shadow-2xl md:p-8 lg:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-turquoise">
                <Car className="h-4 w-4" />
                Mobility Dispatch Demo
              </div>

              <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
                Operator request board
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
                A dispatcher can review visitor transportation requests, prioritize
                pickups, and move each request through the service lifecycle.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/mobility")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Visitor Request Flow
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white active:scale-95"
              >
                Reset Demo
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Active Requests", value: stats.active, icon: Clock },
              { label: "New Requests", value: stats.new, icon: RefreshCw },
              { label: "Accepted", value: stats.accepted, icon: CheckCircle2 },
              { label: "Completed", value: stats.completed, icon: CalendarClock },
            ].map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="rounded-[2rem] bg-white p-4 text-ink"
                >
                  <Icon className="h-6 w-6 text-emerald-700" />
                  <p className="mt-4 text-4xl font-black">
                    {card.value.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                    {card.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {(["all", ...statusFlow] as Array<DemoMobilityRequestStatus | "all">).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={[
                  "rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition active:scale-95",
                  filter === status
                    ? "bg-turquoise text-ink"
                    : "bg-white/10 text-white/65 hover:bg-white/15",
                ].join(" ")}
              >
                {status === "all" ? "All" : statusLabels[status]}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4">
            {filtered.map((request) => (
              <article
                key={request.id}
                className="rounded-[2rem] bg-white p-5 text-ink shadow-xl"
              >
                <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800">
                        {statusLabels[request.status]}
                      </span>
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-stone-600">
                        {serviceLabels[request.serviceType]}
                      </span>
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-stone-600">
                        {islandLabels[request.island]}
                      </span>
                    </div>

                    <h2 className="mt-4 text-2xl font-black">
                      {request.pickup} → {request.dropoff}
                    </h2>

                    <div className="mt-4 grid gap-3 text-sm font-bold text-stone-600 md:grid-cols-2">
                      <p className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-emerald-700" />
                        {request.pickupTime}
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-700" />
                        {request.passengers} passenger{request.passengers === 1 ? "" : "s"}
                      </p>
                      <p className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-emerald-700" />
                        {request.luggage} bag{request.luggage === 1 ? "" : "s"}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-emerald-700" />
                        {request.visitorName} · {request.visitorPhone}
                      </p>
                    </div>

                    {request.notes && (
                      <div className="mt-4 rounded-3xl bg-stone-50 p-4">
                        <p className="text-sm leading-6 text-stone-600">
                          {request.notes}
                        </p>
                      </div>
                    )}

                    <p className="mt-3 text-xs font-bold text-stone-400">
                      Created {formatDate(request.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-[2rem] bg-stone-50 p-4 lg:w-56">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                      Estimate
                    </p>
                    <p className="mt-2 text-4xl font-black">${request.estimatedFare}</p>

                    <div className="mt-4 grid gap-2">
                      {request.status !== "completed" && request.status !== "cancelled" && (
                        <button
                          onClick={() => advance(request)}
                          className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white active:scale-95"
                        >
                          Move to {statusLabels[nextStatus(request.status)]}
                        </button>
                      )}

                      <button
                        onClick={async () => {
                          updateDemoMobilityRequestStatus(request.id, "cancelled");
                          refresh();

                          try {
                            await updateFirestoreMobilityRequestStatus(
                              request.id,
                              "cancelled",
                              request.status
                            );
                          } catch (error) {
                            console.warn("Firestore cancel update failed; local demo status was still updated.", error);
                          }
                        }}
                        className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-stone-600 ring-1 ring-stone-200 active:scale-95"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {filtered.length === 0 && (
              <div className="rounded-[2rem] bg-white p-8 text-center text-ink">
                <MapPin className="mx-auto h-8 w-8 text-emerald-700" />
                <p className="mt-3 text-lg font-black">No requests in this filter.</p>
                <p className="mt-1 text-sm text-stone-500">
                  Submit a visitor request from the mobility page.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
