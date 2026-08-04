import type { JourneyPlan } from "@/lib/journey-planner";
import type { IntelligencePlanStop } from "@/types/intelligence";

export type MissionStage = "upcoming" | "en_route" | "arrived" | "completed";

export type MissionSnapshot = {
  stage: MissionStage;
  label: string;
  summary: string;
  etaMinutes: number | null;
  currentStop: IntelligencePlanStop | null;
};

export function buildMissionSnapshot(
  journey: JourneyPlan,
  currentStop: IntelligencePlanStop | null,
  now = new Date(),
): MissionSnapshot {
  if (journey.status === "ready" && journey.plan.length === 0) {
    return {
      stage: "completed",
      label: "Mission complete",
      summary: "All active stops are finished or skipped.",
      etaMinutes: null,
      currentStop: null,
    };
  }

  const missionDate = parseMissionDate(journey.date);
  if (missionDate && startOfDay(missionDate).getTime() > startOfDay(now).getTime()) {
    return {
      stage: "upcoming",
      label: "Upcoming",
      summary: currentStop
        ? `Prepare transportation and reservations for ${currentStop.title}.`
        : "Add the next useful stop before the mission begins.",
      etaMinutes: null,
      currentStop,
    };
  }

  const storedStage = readStoredStage(journey.id);
  if (storedStage === "arrived") {
    return {
      stage: "arrived",
      label: "Arrived",
      summary: currentStop
        ? `You are at ${currentStop.title}. Complete, skip, or replace this stop when ready.`
        : "Choose the next mission stop.",
      etaMinutes: 0,
      currentStop,
    };
  }

  if (storedStage === "en_route") {
    return {
      stage: "en_route",
      label: "En route",
      summary: currentStop
        ? `Navigation is active for ${currentStop.title}.`
        : "Navigation is active for the mission.",
      etaMinutes: estimateEtaMinutes(currentStop),
      currentStop,
    };
  }

  return {
    stage: "upcoming",
    label: "Ready",
    summary: currentStop
      ? `${currentStop.title} is the next active stop.`
      : "Add the next useful stop to continue the mission.",
    etaMinutes: currentStop ? estimateEtaMinutes(currentStop) : null,
    currentStop,
  };
}

export function writeMissionStage(journeyId: string, stage: MissionStage) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(stageKey(journeyId), stage);
  window.dispatchEvent(new CustomEvent("vi-guide:mission-stage-updated"));
}

export function clearMissionStage(journeyId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(stageKey(journeyId));
  window.dispatchEvent(new CustomEvent("vi-guide:mission-stage-updated"));
}

function readStoredStage(journeyId: string): MissionStage | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(stageKey(journeyId));
  return value === "en_route" || value === "arrived" ? value : null;
}

function stageKey(journeyId: string) {
  return `vi-guide:mission-stage:${journeyId}`;
}

function estimateEtaMinutes(stop: IntelligencePlanStop | null) {
  if (!stop) return null;
  const text = `${stop.kind} ${stop.title}`.toLowerCase();
  if (text.includes("ferry") || text.includes("airport")) return 35;
  if (text.includes("beach") || text.includes("restaurant")) return 20;
  if (text.includes("hotel") || text.includes("resort") || text.includes("villa")) return 15;
  return 25;
}

function parseMissionDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}
