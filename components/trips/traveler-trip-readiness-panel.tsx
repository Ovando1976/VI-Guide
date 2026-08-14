"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Route,
  ShieldCheck,
} from "lucide-react";

import {
  getIntelligenceMemory,
  INTELLIGENCE_MEMORY_UPDATED_EVENT,
} from "@/lib/intelligence/client";
import { summarizeJourneyPlan } from "@/lib/intelligence/active-trip";
import {
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
  type JourneyPlan,
} from "@/lib/journey-planner";
import {
  evaluateTravelerTripReadiness,
  travelerTripReadinessLabel,
  type TravelerTripReadinessItemStatus,
  type TravelerTripReadinessStatus,
} from "@/lib/traveler-trip-readiness";
import type {
  TravelerAdvisorTrip,
  TravelerCommerceBooking,
  TravelerStayRequest,
} from "@/lib/traveler-trip-command";
import {
  buildTravelerTripScopes,
  plansForTravelerTripScope,
  resolveTravelerTripScope,
  scopeTravelerTripRecords,
  travelerTripScopeLabel,
} from "@/lib/traveler-trip-scope";
import { readSelectedTravelerTripPlanId } from "@/lib/traveler-trip-selection";
import type { IntelligenceActiveTrip } from "@/types/intelligence";

export function TravelerTripReadinessPanel({
  bookings,
  stayRequests,
  advisorTrips,
}: {
  bookings: TravelerCommerceBooking[];
  stayRequests: TravelerStayRequest[];
  advisorTrips: TravelerAdvisorTrip[];
}) {
  const [plans, setPlans] = useState<JourneyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [memoryActiveTrip, setMemoryActiveTrip] =
    useState<IntelligenceActiveTrip | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    function refresh() {
      const nextPlans = readJourneyPlans();
      const memory = getIntelligenceMemory();
      setPlans(nextPlans);
      setSelectedPlanId(readSelectedTravelerTripPlanId());
      setMemoryActiveTrip(memory.activeTrip ?? null);
      setHydrated(true);
    }

    refresh();
    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, refresh);
    window.addEventListener(INTELLIGENCE_MEMORY_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, refresh);
      window.removeEventListener(INTELLIGENCE_MEMORY_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const scopes = useMemo(() => buildTravelerTripScopes(plans), [plans]);
  const selectedScope = useMemo(
    () => resolveTravelerTripScope(scopes, selectedPlanId),
    [scopes, selectedPlanId],
  );
  const selectedPlans = useMemo(
    () => plansForTravelerTripScope(plans, selectedScope),
    [plans, selectedScope],
  );
  const activeTrip = useMemo(
    () => summarizeJourneyPlan(selectedPlans[0]) ?? memoryActiveTrip,
    [memoryActiveTrip, selectedPlans],
  );
  const scoped = useMemo(
    () =>
      scopeTravelerTripRecords({
        scope: selectedScope,
        bookings,
        stayRequests,
        advisorTrips,
      }),
    [advisorTrips, bookings, selectedScope, stayRequests],
  );
  const readiness = useMemo(
    () =>
      evaluateTravelerTripReadiness({
        activeTrip,
        bookings: scoped.bookings,
        stayRequests: scoped.stayRequests,
        advisorTrips: scoped.advisorTrips,
      }),
    [activeTrip, scoped],
  );
  const theme = readinessTheme(readiness.status);

  return (
    <section className={`overflow-hidden rounded-[32px] border bg-white shadow-sm ${theme.border}`}>
      <div className="grid lg:grid-cols-[240px_1fr]">
        <div className={`p-6 text-white sm:p-7 ${theme.score}`}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[9px] font-black uppercase tracking-[.18em] text-white/70">
              Trip readiness
            </span>
            <ShieldCheck className="h-5 w-5 text-white/80" />
          </div>
          <div className="mt-5 text-6xl font-black tracking-[-.07em]">
            {hydrated ? readiness.score : "—"}
          </div>
          <div className="mt-2 text-xs font-black uppercase tracking-[.14em] text-white/80">
            {hydrated ? travelerTripReadinessLabel(readiness.status) : "Connecting trip"}
          </div>
          <div className="mt-6 rounded-[20px] bg-white/10 p-4">
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.15em] text-white/60">
              <CalendarClock className="h-4 w-4" /> Travel window
            </div>
            <div className="mt-2 text-lg font-black">
              {hydrated ? countdownLabel(readiness.daysUntilTrip) : "Checking…"}
            </div>
            {readiness.tripDate ? (
              <div className="mt-1 text-xs font-semibold text-white/65">
                {formatTripDate(readiness.tripDate)}
              </div>
            ) : null}
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.17em] text-teal-700">
                <Route className="h-4 w-4" /> Readiness checklist
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-[#043331] sm:text-3xl">
                Know what is ready before travel day.
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                {hydrated
                  ? readiness.summary
                  : "USVI Explorer is connecting the itinerary and verified booking records on this device."}
              </p>
              {hydrated && selectedScope ? (
                <p className="mt-2 text-[10px] font-black uppercase tracking-[.12em] text-teal-700">
                  Scoped to {travelerTripScopeLabel(selectedScope)}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/today"
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.13em] text-white"
              >
                <ShieldCheck className="h-4 w-4 text-[#f5c451]" /> My Day
              </Link>
              <Link
                href="/notifications"
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[9px] font-black uppercase tracking-[.13em] text-[#043331]"
              >
                <Bell className="h-4 w-4 text-teal-700" /> Alerts
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-2">
            {readiness.items.slice(0, 8).map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`group rounded-[22px] border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${itemTheme(item.status)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/75 shadow-sm">
                    <ItemIcon status={item.status} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black">{item.label}</h3>
                      <span className="rounded-full bg-white/70 px-2 py-1 text-[7px] font-black uppercase tracking-[.12em] opacity-70">
                        {itemStatusLabel(item.status)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold leading-5 opacity-75">
                      {item.detail}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs font-semibold text-slate-500">
            <span>
              Readiness uses synchronized USVI Explorer itinerary, booking, payment, stay, and advisor records from the selected trip window.
            </span>
            <span className="font-bold text-slate-400">
              It is not a supplier confirmation or guarantee of availability.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ItemIcon({ status }: { status: TravelerTripReadinessItemStatus }) {
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-emerald-700" />;
  if (status === "blocked") return <AlertTriangle className="h-4 w-4 text-rose-700" />;
  if (status === "attention") return <AlertTriangle className="h-4 w-4 text-amber-700" />;
  return <CircleDashed className="h-4 w-4 text-slate-500" />;
}

function readinessTheme(status: TravelerTripReadinessStatus) {
  if (status === "blocked") {
    return { border: "border-rose-200", score: "bg-rose-700" };
  }
  if (status === "attention") {
    return { border: "border-amber-200", score: "bg-amber-600" };
  }
  if (status === "ready") {
    return { border: "border-emerald-200", score: "bg-emerald-700" };
  }
  if (status === "past") {
    return { border: "border-slate-200", score: "bg-slate-700" };
  }
  return { border: "border-teal-200", score: "bg-[#0f766e]" };
}

function itemTheme(status: TravelerTripReadinessItemStatus) {
  if (status === "blocked") return "border-rose-200 bg-rose-50 text-rose-950";
  if (status === "attention") return "border-amber-200 bg-amber-50 text-amber-950";
  if (status === "done") return "border-emerald-200 bg-emerald-50 text-emerald-950";
  return "border-slate-200 bg-[#fbfaf6] text-[#043331]";
}

function itemStatusLabel(status: TravelerTripReadinessItemStatus) {
  if (status === "done") return "Ready";
  if (status === "blocked") return "Action";
  if (status === "attention") return "Review";
  return "Planning";
}

function countdownLabel(daysUntilTrip: number | null) {
  if (daysUntilTrip === null) return "Dates needed";
  if (daysUntilTrip < 0) return "Past trip";
  if (daysUntilTrip === 0) return "Travel today";
  if (daysUntilTrip === 1) return "Travel tomorrow";
  return `${daysUntilTrip} days to go`;
}

function formatTripDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(date)
    : value;
}
