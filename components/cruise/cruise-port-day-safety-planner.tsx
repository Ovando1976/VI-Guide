"use client";

import { AlertTriangle, CheckCircle2, Clock3, ShipWheel } from "lucide-react";
import { useMemo, useState } from "react";

import {
  cruisePortDaySafetyLabel,
  evaluateCruisePortDaySafety,
} from "@/lib/cruise-port-day-safety";

export function CruisePortDaySafetyPlanner() {
  const [allAboardTime, setAllAboardTime] = useState("17:30");
  const [plannedReturnDepartureTime, setPlannedReturnDepartureTime] =
    useState("15:30");
  const [estimatedReturnTravelMinutes, setEstimatedReturnTravelMinutes] =
    useState(30);
  const [desiredSafetyBufferMinutes, setDesiredSafetyBufferMinutes] =
    useState(60);

  const evaluation = useMemo(
    () =>
      evaluateCruisePortDaySafety({
        allAboardTime,
        plannedReturnDepartureTime,
        estimatedReturnTravelMinutes,
        desiredSafetyBufferMinutes,
      }),
    [
      allAboardTime,
      plannedReturnDepartureTime,
      estimatedReturnTravelMinutes,
      desiredSafetyBufferMinutes,
    ],
  );

  const result = evaluation.ok ? evaluation.result : null;
  const protectedPlan = result?.status === "safe_buffer";

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
              Enter the ship&apos;s published all-aboard time, when you plan to leave
              your last stop, and your estimated trip back. We&apos;ll show whether
              your plan preserves the safety buffer you choose.
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs font-semibold leading-6 text-white/65">
              This is a planning estimate, not a verified transfer time. Cruise-day
              checkout still uses the stricter server-side verified return-buffer gate.
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <PlannerField label="Ship all-aboard time">
                <input
                  type="time"
                  value={allAboardTime}
                  onChange={(event) => setAllAboardTime(event.target.value)}
                  className={inputClass}
                />
              </PlannerField>
              <PlannerField label="Leave final stop by">
                <input
                  type="time"
                  value={plannedReturnDepartureTime}
                  onChange={(event) =>
                    setPlannedReturnDepartureTime(event.target.value)
                  }
                  className={inputClass}
                />
              </PlannerField>
              <PlannerField label="Estimated trip back (minutes)">
                <input
                  type="number"
                  min={1}
                  max={360}
                  value={estimatedReturnTravelMinutes}
                  onChange={(event) =>
                    setEstimatedReturnTravelMinutes(Number(event.target.value))
                  }
                  className={inputClass}
                />
              </PlannerField>
              <PlannerField label="Safety buffer you want (minutes)">
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={desiredSafetyBufferMinutes}
                  onChange={(event) =>
                    setDesiredSafetyBufferMinutes(Number(event.target.value))
                  }
                  className={inputClass}
                />
              </PlannerField>
            </div>

            {!evaluation.ok ? (
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
                  <ResultMetric
                    label="Safe return deadline"
                    value={formatTime(result.safeReturnDeadline)}
                  />
                  <ResultMetric
                    label="Expected return"
                    value={formatTime(result.expectedPortReturnTime)}
                  />
                  <ResultMetric
                    label="Expected buffer"
                    value={`${result.expectedBufferMinutes} min`}
                  />
                </div>

                {!protectedPlan ? (
                  <p className="mt-4 text-sm font-bold leading-6 text-amber-900/75">
                    Leave earlier, shorten the final stop, or use a faster verified
                    transfer before treating this itinerary as cruise-safe.
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

function PlannerField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
      <p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">
        {label}
      </p>
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
