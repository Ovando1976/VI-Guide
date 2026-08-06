import type { IntelligenceActiveTripStop } from "@/types/intelligence";
import type {
  TripRiskCategory,
  TripRiskIssue,
  TripRiskReport,
  TripRiskSeverity,
  TripReturnWindow,
  TripWeatherAlert,
} from "@/lib/intelligence/trip-risk-types";

export const DEFAULT_STOP_DURATION_MINUTES = 75;
export const NORMAL_TRANSFER_BUFFER_MINUTES = 25;
export const SENSITIVE_TRANSFER_BUFFER_MINUTES = 45;
export const NORMAL_RETURN_BUFFER_MINUTES = 90;
export const SENSITIVE_RETURN_BUFFER_MINUTES = 120;

export function createTripRiskIssue(
  id: string,
  severity: TripRiskSeverity,
  category: TripRiskCategory,
  title: string,
  detail: string,
  recommendation: string,
  penalty: number,
  stopIds?: string[],
  sourceUrl?: string,
): TripRiskIssue {
  return {
    id,
    severity,
    category,
    title,
    detail,
    recommendation,
    penalty,
    ...(stopIds?.length ? { stopIds } : {}),
    ...(sourceUrl ? { sourceUrl } : {}),
  };
}

export function buildTripRiskReport(
  issues: TripRiskIssue[],
  forcedStatus?: TripRiskReport["status"],
  returnWindow?: TripReturnWindow,
): TripRiskReport {
  const sorted = [...issues].sort(
    (first, second) =>
      severityRank(second.severity) - severityRank(first.severity) ||
      first.title.localeCompare(second.title),
  );
  const criticalCount = sorted.filter((item) => item.severity === "critical").length;
  const highCount = sorted.filter((item) => item.severity === "high").length;
  const mediumCount = sorted.filter((item) => item.severity === "medium").length;
  const status =
    forcedStatus ??
    (criticalCount
      ? "critical"
      : highCount
        ? "attention"
        : mediumCount
          ? "watch"
          : "healthy");
  const summary =
    status === "critical"
      ? "Immediate itinerary changes are needed before relying on this plan."
      : status === "attention"
        ? "Important timing or logistics risks should be resolved before departure."
        : status === "watch"
          ? "The trip is workable, but safeguards will make it more resilient."
          : status === "not_ready"
            ? "Save a usable itinerary before VI Guide can protect the trip."
            : status === "past"
              ? "This journey date has passed. Risk monitoring is paused."
              : "No material itinerary risks were detected from the information currently available.";

  return {
    status,
    score: Math.max(
      0,
      Math.min(100, 100 - sorted.reduce((sum, item) => sum + item.penalty, 0)),
    ),
    summary,
    issueCount: sorted.length,
    criticalCount,
    highCount,
    mediumCount,
    issues: sorted,
    ...(returnWindow ? { returnWindow } : {}),
  };
}

export function pastTripRiskReport(): TripRiskReport {
  return buildTripRiskReport([], "past");
}

export function validDuration(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function stopDuration(stop: IntelligenceActiveTripStop) {
  return validDuration(stop.durationMinutes)
    ? stop.durationMinutes
    : DEFAULT_STOP_DURATION_MINUTES;
}

export function minutesFromTime(value?: string) {
  if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return undefined;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function timeFromMinutes(value: number) {
  const normalized = ((Math.round(value) % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(
    normalized % 60,
  ).padStart(2, "0")}`;
}

export function localTripDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/St_Thomas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function normalizeRiskDate(value?: string | Date) {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function stopText(stop: IntelligenceActiveTripStop) {
  return `${stop.title} ${stop.kind} ${stop.summary ?? ""}`.toLowerCase();
}

export function isTransportSensitive(stop: IntelligenceActiveTripStop) {
  if (stop.mobility?.mode === "ferry") return true;
  return /(ferry|airport|terminal|cruise|ship|dock|marina|seaplane|water taxi)/.test(
    stopText(stop),
  );
}

export function hasAccessibilityConcern(
  stop: IntelligenceActiveTripStop,
  avoid: string[],
) {
  const text = `${stopText(stop)} ${avoid.join(" ").toLowerCase()}`;
  return /(steep|stairs|stairway|hike|hiking|trail|climb|rugged|rocky|long walk|limited shade)/.test(
    text,
  );
}

export function hasBookingConcern(stop: IntelligenceActiveTripStop) {
  return /(unconfirmed|pending confirmation|pending request|availability request|request submitted|awaiting confirmation)/.test(
    stopText(stop),
  );
}

export function weatherRiskSeverity(
  value: TripWeatherAlert["severity"],
): TripRiskSeverity {
  if (value === "extreme") return "critical";
  if (value === "severe") return "high";
  if (value === "moderate") return "medium";
  return "low";
}

export function weatherAlertApplies(
  alert: TripWeatherAlert,
  tripDate: string,
  now: Date,
) {
  const today = localTripDate(now);
  if (!alert.onset && !alert.expires) return tripDate === today;
  const onset = alert.onset ? localTripDate(new Date(alert.onset)) : today;
  const expires = alert.expires ? localTripDate(new Date(alert.expires)) : today;
  return tripDate >= onset && tripDate <= expires;
}

export function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h${remainder ? ` ${remainder}m` : ""}`;
}

export function safeRiskId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120) || "signal";
}

export function uniqueRiskIssues(issues: TripRiskIssue[]) {
  return Array.from(new Map(issues.map((item) => [item.id, item])).values());
}

function severityRank(value: TripRiskSeverity) {
  if (value === "critical") return 5;
  if (value === "high") return 4;
  if (value === "medium") return 3;
  if (value === "low") return 2;
  return 1;
}
