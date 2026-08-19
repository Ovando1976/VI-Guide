import type { OfficialCruisePortCall } from "@/lib/cruise-port-calls";
import type { CruisePortDaySafetyResult } from "@/lib/cruise-port-day-safety";
import {
  createJourneyPlan,
  type JourneyPlan,
} from "@/lib/journey-planner";

export type CruiseSafetyTimingProvenance =
  | "official_departure_proxy"
  | "traveler_confirmed_all_aboard";

export function upsertCruiseSafetyJourneyPlan(input: {
  plans: JourneyPlan[];
  call: OfficialCruisePortCall;
  result: CruisePortDaySafetyResult;
  allAboardTime: string;
  plannedReturnDepartureTime: string;
  estimatedReturnTravelMinutes: number;
  desiredSafetyBufferMinutes: number;
  provenance: CruiseSafetyTimingProvenance;
}): JourneyPlan {
  const existing = input.plans.find(
    (plan) => plan.island === input.call.island && plan.date === input.call.date,
  );
  const target =
    existing ??
    ({
      ...createJourneyPlan(
        input.call.island,
        `${input.call.shipName} · ${input.call.terminalLabel}`,
      ),
      date: input.call.date,
      notes: "Cruise port day saved from the USVI Explorer safety planner.",
    } satisfies JourneyPlan);

  const stopId = cruiseSafetyStopId(input.call.id);
  const summary = [
    `Return-to-ship safety plan for ${input.call.shipName} at ${input.call.terminalLabel}.`,
    `Ship schedule departure: ${input.call.departsAt}.`,
    `All-aboard used: ${input.allAboardTime} (${provenanceLabel(input.provenance)}).`,
    `Leave final stop by ${input.plannedReturnDepartureTime}; estimated travel back ${input.estimatedReturnTravelMinutes} min.`,
    `Safe return deadline ${input.result.safeReturnDeadline}; expected port return ${input.result.expectedPortReturnTime}; expected buffer ${input.result.expectedBufferMinutes} min; requested buffer ${input.desiredSafetyBufferMinutes} min.`,
    `Status: ${input.result.status}. This saved plan is planning evidence only and does not create server-side buffer_verified evidence.`,
  ].join(" ");

  const stop = {
    id: stopId,
    placeId: input.call.id,
    title: `Return to ship · ${input.call.shipName}`,
    island: input.call.island,
    kind: "cruise_safety",
    summary,
    startTime: input.plannedReturnDepartureTime,
    endTime: input.result.expectedPortReturnTime,
    durationMinutes: input.estimatedReturnTravelMinutes,
    href: `/cruises/plan?officialPortCall=${encodeURIComponent(input.call.id)}`,
  } as const;

  return {
    ...target,
    title: target.title || `${input.call.shipName} · ${input.call.terminalLabel}`,
    plan: [...target.plan.filter((candidate) => candidate.id !== stopId), stop],
    updatedAt: new Date().toISOString(),
  };
}

export function cruiseSafetyStopId(portCallId: string) {
  return `cruise_safety_${portCallId}`.slice(0, 160);
}

export function provenanceLabel(value: CruiseSafetyTimingProvenance) {
  return value === "official_departure_proxy"
    ? "official departure minus 30-minute planning proxy"
    : "traveler-confirmed ship all-aboard time";
}
