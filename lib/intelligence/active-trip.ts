import type { JourneyPlan } from "@/lib/journey-planner";
import type {
  IntelligenceActiveTrip,
  IntelligenceActiveTripStop,
  IntelligenceIsland,
} from "@/types/intelligence";

export function summarizeJourneyPlan(
  plan: JourneyPlan | null | undefined,
): IntelligenceActiveTrip | undefined {
  if (!plan) return undefined;
  return {
    id: plan.id.slice(0, 160),
    title: plan.title.slice(0, 160),
    island: plan.island,
    date: plan.date,
    status: plan.status,
    updatedAt: plan.updatedAt,
    stops: plan.plan.slice(0, 12).map((stop) => ({
      id: stop.id.slice(0, 160),
      title: stop.title.slice(0, 160),
      kind: stop.kind.slice(0, 80),
      ...(stop.summary ? { summary: stop.summary.slice(0, 280) } : {}),
      ...(stop.startTime ? { startTime: stop.startTime } : {}),
      ...(typeof stop.durationMinutes === "number"
        ? { durationMinutes: stop.durationMinutes }
        : {}),
      ...(stop.bookingHref ? { bookingHref: stop.bookingHref.slice(0, 500) } : {}),
      ...(stop.mobility
        ? {
            mobility: {
              mode: stop.mobility.mode,
              ...(typeof stop.mobility.estimatedMinutes === "number"
                ? { estimatedMinutes: stop.mobility.estimatedMinutes }
                : {}),
            },
          }
        : {}),
    })),
  };
}

export function normalizeActiveTrip(
  value: unknown,
): IntelligenceActiveTrip | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Partial<IntelligenceActiveTrip> & {
    stops?: unknown;
  };
  const island = normalizeIsland(candidate.island);
  if (
    !island ||
    typeof candidate.id !== "string" ||
    !candidate.id.trim() ||
    typeof candidate.title !== "string" ||
    !candidate.title.trim() ||
    typeof candidate.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(candidate.date)
  ) {
    return undefined;
  }

  const stops = Array.isArray(candidate.stops)
    ? candidate.stops
        .map(normalizeActiveTripStop)
        .filter((stop): stop is IntelligenceActiveTripStop => Boolean(stop))
        .slice(0, 12)
    : [];

  return {
    id: candidate.id.trim().slice(0, 160),
    title: candidate.title.trim().slice(0, 160),
    island,
    date: candidate.date,
    status: candidate.status === "ready" ? "ready" : "draft",
    updatedAt:
      typeof candidate.updatedAt === "string"
        ? candidate.updatedAt.slice(0, 50)
        : new Date().toISOString(),
    stops,
  };
}

export function sameActiveTrip(
  first: IntelligenceActiveTrip | undefined,
  second: IntelligenceActiveTrip | undefined,
) {
  return JSON.stringify(first ?? null) === JSON.stringify(second ?? null);
}

function normalizeActiveTripStop(
  value: unknown,
): IntelligenceActiveTripStop | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<IntelligenceActiveTripStop>;
  if (
    typeof candidate.id !== "string" ||
    !candidate.id.trim() ||
    typeof candidate.title !== "string" ||
    !candidate.title.trim()
  ) {
    return null;
  }
  const mobility = normalizeMobility(candidate.mobility);
  return {
    id: candidate.id.trim().slice(0, 160),
    title: candidate.title.trim().slice(0, 160),
    kind:
      typeof candidate.kind === "string" && candidate.kind.trim()
        ? candidate.kind.trim().slice(0, 80)
        : "place",
    ...(typeof candidate.summary === "string" && candidate.summary.trim()
      ? { summary: candidate.summary.trim().slice(0, 280) }
      : {}),
    ...(typeof candidate.startTime === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(candidate.startTime)
      ? { startTime: candidate.startTime }
      : {}),
    ...(typeof candidate.durationMinutes === "number" &&
    Number.isFinite(candidate.durationMinutes)
      ? {
          durationMinutes: Math.max(
            0,
            Math.min(720, Math.round(candidate.durationMinutes)),
          ),
        }
      : {}),
    ...(typeof candidate.bookingHref === "string" && candidate.bookingHref.trim()
      ? { bookingHref: candidate.bookingHref.trim().slice(0, 500) }
      : {}),
    ...(mobility ? { mobility } : {}),
  };
}

function normalizeMobility(value: unknown): IntelligenceActiveTripStop["mobility"] {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Partial<NonNullable<IntelligenceActiveTripStop["mobility"]>>;
  const mode =
    candidate.mode === "walk" ||
    candidate.mode === "taxi" ||
    candidate.mode === "ferry" ||
    candidate.mode === "drive" ||
    candidate.mode === "transfer"
      ? candidate.mode
      : undefined;
  if (!mode) return undefined;
  return {
    mode,
    ...(typeof candidate.estimatedMinutes === "number" &&
    Number.isFinite(candidate.estimatedMinutes)
      ? {
          estimatedMinutes: Math.max(
            0,
            Math.min(720, Math.round(candidate.estimatedMinutes)),
          ),
        }
      : {}),
  };
}

function normalizeIsland(value: unknown): IntelligenceIsland | undefined {
  return value === "stt" || value === "stj" || value === "stx"
    ? value
    : undefined;
}
