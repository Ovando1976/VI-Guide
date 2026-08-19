"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Save,
  ShipWheel,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  derivePlanningAllAboard,
  getOfficialCruisePortCall,
  listOfficialCruisePortCalls,
  sourceForOfficialCruisePortCall,
  type OfficialCruisePortCall,
} from "@/lib/cruise-port-calls";
import {
  cruisePortDaySafetyLabel,
  evaluateCruisePortDaySafety,
} from "@/lib/cruise-port-day-safety";
import {
  provenanceLabel,
  upsertCruiseSafetyJourneyPlan,
  type CruiseSafetyTimingProvenance,
} from "@/lib/cruise-port-day-trip";
import { readJourneyPlans, upsertJourneyPlan } from "@/lib/journey-planner";
import { writeSelectedTravelerTripPlanId } from "@/lib/traveler-trip-selection";

export function CruisePortDaySafetyPlanner() {
  const [selectedCallId, setSelectedCallId] = useState("");
  const [allAboardTime, setAllAboardTime] = useState("");
  const [plannedReturnDepartureTime, setPlannedReturnDepartureTime] = useState("");
  const [estimatedReturnTravelMinutes, setEstimatedReturnTravelMinutes] = useState("");
  const [desiredSafetyBufferMinutes, setDesiredSafetyBufferMinutes] = useState("");
  const [provenance, setProvenance] = useState<CruiseSafetyTimingProvenance>(
    "traveler_confirmed_all_aboard",
  );
  const [savedPlanId, setSavedPlanId] = useState("");

  const officialCalls = useMemo(
    () => listOfficialCruisePortCalls().sort((left, right) => left.date.localeCompare(right.date)),
    [],
  );
  const selectedCall = useMemo(
    () => (selectedCallId ? getOfficialCruisePortCall(selectedCallId) : null),
    [selectedCallId],
  );
  const source = selectedCall ? sourceForOfficialCruisePortCall(selectedCall) : null;

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("officialPortCall");
    if (!requested) return;
    const call = getOfficialCruisePortCall(requested);
    if (call?.status === "scheduled") applyOfficialCall(call);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const complete = Boolean(
    allAboardTime &&
      plannedReturnDepartureTime &&
      estimatedReturnTravelMinutes &&
      desiredSafetyBufferMinutes,
  );
  const evaluation = useMemo(
    () =>
      complete
        ? evaluateCruisePortDaySafety({
            allAboardTime,
            plannedReturnDepartureTime,
            estimatedReturnTravelMinutes: Number(estimatedReturnTravelMinutes),
            desiredSafetyBufferMinutes: Number(desiredSafetyBufferMinutes),
          })
        : null,
    [
      allAboardTime,
      complete,
      desiredSafetyBufferMinutes,
      estimatedReturnTravelMinutes,
      plannedReturnDepartureTime,
    ],
  );
  const result = evaluation?.ok ? evaluation.result : null;
  const protectedPlan = result?.status === "safe_buffer";

  function applyOfficialCall(call: OfficialCruisePortCall) {
    const proxy = derivePlanningAllAboard(call.departsAt);
    setSelectedCallId(call.id);
    setSavedPlanId("");
    if (proxy) {
      setAllAboardTime(proxy);
      setProvenance("official_departure_proxy");
    }
  }

  function selectOfficialCall(value: string) {
    if (!value) {
      setSelectedCallId("");
      setSavedPlanId("");
      return;
    }
    const call = getOfficialCruisePortCall(value);
    if (call?.status === "scheduled") applyOfficialCall(call);
  }

  function editAllAboard(value: string) {
    setAllAboardTime(value);
    setSavedPlanId("");
    if (selectedCall) setProvenance("traveler_confirmed_all_aboard");
  }

  function saveToMyTrip() {
    if (!selectedCall || !result) return;
    const plan = upsertCruiseSafetyJourneyPlan({
      plans: readJourneyPlans(),
      call: selectedCall,
      result,
      allAboardTime,
      plannedReturnDepartureTime,
      estimatedReturnTravelMinutes: Number(estimatedReturnTravelMinutes),
      desiredSafetyBufferMinutes: Number(desiredSafetyBufferMinutes),
      provenance,
    });
    upsertJourneyPlan(plan);
    writeSelectedTravelerTripPlanId(plan.id);
    setSavedPlanId(plan.id);
  }

  return (
    <section className="px-4 pb-6 sm:px-6 lg:pb-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[34px] border border-teal-900/10 bg-white shadow-xl">
        <div className="grid lg:grid-cols-[.82fr_1.18fr]">
          <div className="bg-[#043331] p-6 text-white sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-[#f5c451]">
                <ShipWheel className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">
                  Port-day safety check
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-.04em]">
                  Protect your return-to-ship buffer
                </h2>
              </div>
            </div>
            <p className="mt-5 text-sm font-semibold leading-7 text-white/70">
              Start from a published VIPA/WICO port call when we have one, then add
              your return route estimate. Save the result into the matching day in My Trip.
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs font-semibold leading-6 text-white/65">
              Official schedules publish ship departure, not the onboard all-aboard
              announcement. A schedule-derived time is therefore a planning proxy only.
              Cruise-day checkout still requires stricter server-side verified return-buffer evidence.
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <PlannerField label="Official USVI port call">
              <select
                value={selectedCallId}
                onChange={(event) => selectOfficialCall(event.target.value)}
                className={inputClass}
              >
                <option value="">Choose a published ship call (optional)</option>
                {officialCalls.map((call) => (
                  <option key={call.id} value={call.id}>
                    {call.date} · {call.shipName} · {call.terminalLabel} · departs {call.departsAt}
                  </option>
                ))}
              </select>
            </PlannerField>

            {selectedCall ? (
              <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[.15em] text-teal-700">
                      Published schedule context
                    </p>
                    <p className="mt-1 text-sm font-black text-[#043331]">
                      {selectedCall.shipName} · {selectedCall.date} · {selectedCall.terminalLabel}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      Arrival {selectedCall.arrivesAt} · Departure {selectedCall.departsAt}
                    </p>
                  </div>
                  {source ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[.12em] text-teal-700"
                    >
                      Official source <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-teal-950/65">
                  All-aboard provenance: {provenanceLabel(provenance)}.
                </p>
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <PlannerField label="Ship all-aboard time">
                <input
                  type="time"
                  value={allAboardTime}
                  onChange={(event) => editAllAboard(event.target.value)}
                  className={inputClass}
                />
              </PlannerField>
              <PlannerField label="Leave final stop by">
                <input
                  type="time"
                  value={plannedReturnDepartureTime}
                  onChange={(event) => {
                    setPlannedReturnDepartureTime(event.target.value);
                    setSavedPlanId("");
                  }}
                  className={inputClass}
                />
              </PlannerField>
              <PlannerField label="Estimated trip back (minutes)">
                <input
                  type="number"
                  min={1}
                  max={360}
                  placeholder="Use your route estimate"
                  value={estimatedReturnTravelMinutes}
                  onChange={(event) => {
                    setEstimatedReturnTravelMinutes(event.target.value);
                    setSavedPlanId("");
                  }}
                  className={inputClass}
                />
              </PlannerField>
              <PlannerField label="Safety buffer you want (minutes)">
                <input
                  type="number"
                  min={1}
                  max={240}
                  placeholder="Choose your buffer"
                  value={desiredSafetyBufferMinutes}
                  onChange={(event) => {
                    setDesiredSafetyBufferMinutes(event.target.value);
                    setSavedPlanId("");
                  }}
                  className={inputClass}
                />
              </PlannerField>
            </div>

            {!complete ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                Add all four timing inputs to check the port-day plan. USVI Explorer
                will not invent a route duration or safety buffer.
              </div>
            ) : evaluation && !evaluation.ok ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
                {evaluation.error}
              </div>
            ) : result ? (
              <div
                className={`mt-6 rounded-[26px] border p-5 ${
                  protectedPlan
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {protectedPlan ? (
                    <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />
                  )}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">
                      Estimated port-day result
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#043331]">
                      {cruisePortDaySafetyLabel(result.status)}
                    </h3>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <ResultMetric label="Safe return deadline" value={formatTime(result.safeReturnDeadline)} />
                  <ResultMetric label="Expected return" value={formatTime(result.expectedPortReturnTime)} />
                  <ResultMetric label="Expected buffer" value={`${result.expectedBufferMinutes} min`} />
                </div>

                {!protectedPlan ? (
                  <p className="mt-4 text-sm font-bold leading-6 text-amber-900/75">
                    Leave earlier, shorten the final stop, or use a faster verified
                    transfer before treating this itinerary as cruise-safe.
                  </p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={saveToMyTrip}
                    disabled={!selectedCall}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.13em] text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Save className="h-4 w-4 text-[#f5c451]" /> Save to My Trip
                  </button>
                  {savedPlanId ? (
                    <Link
                      href={`/trips?trip=${encodeURIComponent(savedPlanId)}`}
                      className="inline-flex min-h-11 items-center rounded-full border border-teal-300 bg-white px-5 text-[9px] font-black uppercase tracking-[.13em] text-teal-800"
                    >
                      Open saved trip
                    </Link>
                  ) : null}
                </div>
                {!selectedCall ? (
                  <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
                    Choose a published port call before saving so My Trip has a trusted island and date anchor.
                  </p>
                ) : savedPlanId ? (
                  <p className="mt-3 text-xs font-bold text-emerald-800">
                    Saved into the matching cruise day in My Trip.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function PlannerField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-black text-slate-700">
        <Clock3 className="h-3.5 w-3.5 text-teal-700" />
        {label}
      </span>
      {children}
    </label>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
      <p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-[#043331]">{value}</p>
    </div>
  );
}

function formatTime(value: string) {
  const [hoursText, minutes] = value.split(":");
  const hours = Number(hoursText);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${suffix}`;
}

const inputClass =
  "min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-[#043331] outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100";
