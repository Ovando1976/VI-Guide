import type { IntelligenceIsland, IntelligencePlanStop } from "@/types/intelligence";

export const JOURNEY_PLANS_STORAGE_KEY = "vi-guide.intelligence.saved-plans";
export const JOURNEY_PLAN_UPDATED_EVENT = "vi-guide-intelligence-plan-saved";

export type JourneyPlan = {
  id: string;
  title: string;
  island: IntelligenceIsland;
  date: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "ready";
  notes: string;
  plan: IntelligencePlanStop[];
};

export type JourneyStopInput = {
  id: string;
  title: string;
  island: IntelligenceIsland;
  kind: string;
  summary: string;
  lat?: number;
  lng?: number;
  href?: string;
  mapHref?: string;
  bookingHref?: string;
};

export function createJourneyPlan(
  island: IntelligenceIsland = "stt",
  title = "My Virgin Islands day",
): JourneyPlan {
  const now = new Date().toISOString();
  return {
    id: createId("plan"),
    title,
    island,
    date: now.slice(0, 10),
    createdAt: now,
    updatedAt: now,
    status: "draft",
    notes: "",
    plan: [],
  };
}

export function normalizeJourneyPlan(value: unknown): JourneyPlan | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<JourneyPlan> & {
    plan?: unknown;
    island?: unknown;
  };
  if (typeof candidate.id !== "string" || !candidate.id.trim()) return null;
  const island = normalizeIsland(candidate.island);
  if (!island) return null;
  const now = new Date().toISOString();
  const stops = Array.isArray(candidate.plan)
    ? candidate.plan.map(normalizeStop).filter(isJourneyStop)
    : [];

  return {
    id: candidate.id.slice(0, 160),
    title:
      typeof candidate.title === "string" && candidate.title.trim()
        ? candidate.title.trim().slice(0, 120)
        : "My Virgin Islands day",
    island,
    date:
      typeof candidate.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(candidate.date)
        ? candidate.date
        : now.slice(0, 10),
    createdAt:
      typeof candidate.createdAt === "string" ? candidate.createdAt : now,
    updatedAt:
      typeof candidate.updatedAt === "string" ? candidate.updatedAt : now,
    status: candidate.status === "ready" ? "ready" : "draft",
    notes: typeof candidate.notes === "string" ? candidate.notes.slice(0, 2000) : "",
    plan: stops,
  };
}

export function readJourneyPlans(): JourneyPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(JOURNEY_PLANS_STORAGE_KEY) ?? "[]",
    );
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeJourneyPlan)
      .filter(isJourneyPlan)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export function writeJourneyPlans(plans: JourneyPlan[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(JOURNEY_PLANS_STORAGE_KEY, JSON.stringify(plans));
  window.dispatchEvent(new Event(JOURNEY_PLAN_UPDATED_EVENT));
}

export function upsertJourneyPlan(plan: JourneyPlan) {
  const normalized = normalizeJourneyPlan({
    ...plan,
    updatedAt: new Date().toISOString(),
  });
  if (!normalized) return;
  const plans = readJourneyPlans();
  writeJourneyPlans([
    normalized,
    ...plans.filter((candidate) => candidate.id !== normalized.id),
  ]);
}

export function addStopToJourney(input: JourneyStopInput): JourneyPlan {
  const plans = readJourneyPlans();
  const existing = plans.find((plan) => plan.island === input.island) ?? plans[0];
  const target = existing ?? createJourneyPlan(input.island);
  const duplicate = target.plan.some(
    (stop) => stop.placeId === input.id || stop.id === `place_${input.id}`,
  );
  if (duplicate) return target;

  const mapCoordinates = coordinatesFromMapHref(input.mapHref);
  const stop: IntelligencePlanStop = {
    id: `place_${input.id}`.slice(0, 160),
    placeId: input.id,
    title: input.title.slice(0, 160),
    island: input.island,
    kind: input.kind.slice(0, 80),
    summary: input.summary.slice(0, 1200),
    ...(finiteNumber(input.lat ?? mapCoordinates?.lat)
      ? { lat: input.lat ?? mapCoordinates?.lat }
      : {}),
    ...(finiteNumber(input.lng ?? mapCoordinates?.lng)
      ? { lng: input.lng ?? mapCoordinates?.lng }
      : {}),
    ...(input.href ? { href: input.href } : {}),
    ...(input.mapHref ? { mapHref: input.mapHref } : {}),
    ...(input.bookingHref ? { bookingHref: input.bookingHref } : {}),
  };
  const updated: JourneyPlan = {
    ...target,
    island: input.island,
    plan: [...target.plan, stop],
    updatedAt: new Date().toISOString(),
  };
  upsertJourneyPlan(updated);
  return updated;
}

export function deleteJourneyPlan(planId: string) {
  writeJourneyPlans(readJourneyPlans().filter((plan) => plan.id !== planId));
}

export function buildJourneyMapHref(plan: JourneyPlan) {
  const params = new URLSearchParams({
    island: plan.island,
    trip: plan.id,
    tripName: plan.title,
  });
  const firstPositionedStop = plan.plan.find(
    (stop) => Boolean(stop.mapHref) && Boolean(stop.placeId),
  );
  if (firstPositionedStop?.placeId) {
    params.set("place", firstPositionedStop.placeId);
  }
  return `/map?${params.toString()}`;
}

function normalizeIsland(value: unknown): IntelligenceIsland | null {
  return value === "stt" || value === "stj" || value === "stx" ? value : null;
}

function normalizeStop(value: unknown): IntelligencePlanStop | null {
  if (!value || typeof value !== "object") return null;
  const stop = value as Partial<IntelligencePlanStop>;
  const island = normalizeIsland(stop.island);
  if (!island || typeof stop.id !== "string" || typeof stop.title !== "string") {
    return null;
  }
  return {
    id: stop.id.slice(0, 160),
    title: stop.title.trim().slice(0, 160),
    island,
    kind: typeof stop.kind === "string" ? stop.kind.slice(0, 80) : "place",
    summary: typeof stop.summary === "string" ? stop.summary.slice(0, 1200) : "",
    ...(typeof stop.startTime === "string" ? { startTime: stop.startTime } : {}),
    ...(typeof stop.endTime === "string" ? { endTime: stop.endTime } : {}),
    ...(typeof stop.durationMinutes === "number"
      ? { durationMinutes: stop.durationMinutes }
      : {}),
    ...(typeof stop.placeId === "string" ? { placeId: stop.placeId } : {}),
    ...(finiteNumber(stop.lat) ? { lat: stop.lat } : {}),
    ...(finiteNumber(stop.lng) ? { lng: stop.lng } : {}),
    ...(typeof stop.href === "string" ? { href: stop.href } : {}),
    ...(typeof stop.mapHref === "string" ? { mapHref: stop.mapHref } : {}),
    ...(typeof stop.bookingHref === "string"
      ? { bookingHref: stop.bookingHref }
      : {}),
    ...(stop.mobility ? { mobility: stop.mobility } : {}),
  };
}

function coordinatesFromMapHref(mapHref?: string) {
  if (!mapHref) return null;
  const query = mapHref.split("?")[1];
  if (!query) return null;
  const params = new URLSearchParams(query);
  const lat = Number(params.get("placeLat"));
  const lng = Number(params.get("placeLng"));
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isJourneyPlan(value: JourneyPlan | null): value is JourneyPlan {
  return value !== null;
}

function isJourneyStop(
  value: IntelligencePlanStop | null,
): value is IntelligencePlanStop {
  return value !== null;
}

function createId(prefix: string) {
  const random =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}
