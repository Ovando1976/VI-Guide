"use client";

import { Clock3, MapPinCheck, Navigation, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { buildMissionSnapshot } from "@/lib/mission-orchestration";
import type { JourneyPlan } from "@/lib/journey-planner";
import type { IntelligencePlanStop } from "@/types/intelligence";

export function LiveMissionStatus({
  journey,
  currentStop,
}: {
  journey: JourneyPlan;
  currentStop: IntelligencePlanStop | null;
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1);
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener("vi-guide:mission-stage-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("vi-guide:mission-stage-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const snapshot = useMemo(
    () => buildMissionSnapshot(journey, currentStop),
    [journey, currentStop],
  );

  const presentation = {
    upcoming: {
      icon: Sparkles,
      shell: "border-amber-200 bg-amber-50",
      iconClass: "bg-amber-500 text-[#043331]",
    },
    en_route: {
      icon: Navigation,
      shell: "border-sky-200 bg-sky-50",
      iconClass: "bg-sky-700 text-white",
    },
    arrived: {
      icon: MapPinCheck,
      shell: "border-emerald-200 bg-emerald-50",
      iconClass: "bg-emerald-700 text-white",
    },
    completed: {
      icon: MapPinCheck,
      shell: "border-emerald-200 bg-emerald-50",
      iconClass: "bg-emerald-700 text-white",
    },
  }[snapshot.stage];
  const Icon = presentation.icon;

  return (
    <section className={`rounded-[28px] border p-5 shadow-sm ${presentation.shell}`}>
      <div className="flex items-start gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${presentation.iconClass}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-slate-500">
              Live mission status
            </p>
            {snapshot.etaMinutes !== null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-[8px] font-black uppercase tracking-[.14em] text-slate-500">
                <Clock3 className="h-3 w-3" /> About {snapshot.etaMinutes} min
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-[#043331]">
            {snapshot.label}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {snapshot.summary}
          </p>
        </div>
      </div>
    </section>
  );
}
