import type {
  IntelligenceIsland,
  IntelligencePlanStop,
} from "@/types/intelligence";
import { prioritizeSelectedTravelerPlan } from "@/lib/traveler-trip-selection";

export const JOURNEY_PLANS_STORAGE_KEY = "vi-guide.intelligence.saved-plans";
export const JOURNEY_PLAN_UPDATED_EVENT = "vi-guide-intelligence-plan-saved";
const LEGACY_TRIP_STORAGE_KEY = "vi-guide-trip-v1";

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

type LegacyTripItem = {
  id?: unknown;
  name?: unknown;
  kind?: unknown;
  island?: unknown;
  description?: unknown;
  href?: unknown;
  day?: unknown;
  timeOfDay?: unknown;
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
    const plans = parsed
      .map(normalizeJourneyPlan)
      .filter(isJourneyPlan)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return prioritizeSelectedTravelerPlan(plans);
  } catch {
    return [];
  }
}

export function importLegacyTripPlans(): JourneyPlan[] {
  if (typeof window === "undefined") return [];
  const existing = readJourneyPlans();
  if (existing.length) return existing;

  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(LEGACY_TRIP_STORAGE_KEY) ?? "[]",
    );
    if (!Array.isArray(parsed) || !parsed.length) return [];

    const normalized = parsed
      .map(normalizeLegacyTripItem)
      .filter(isLegacyTripItem)
      .sort((a, b) => a.day - b.day);
    if (!normalized.length) return [];

    const groups = new Map<string, typeof normalized>();
    for (const item of normalized) {
      const key = `${item.day}:${item.island}`;
      const group = groups.get(key) ?? [];
      group.push(item);
      groups.set(key, group);
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const plans = Array.from(groups.entries())
      .map(([key, stops]) => {
        const [dayText, island] = key.split(":") as [string, IntelligenceIsland];
        const day = Number(dayText);
        const date = new Date(now);
        date.setDate(now.getDate() + Math.max(0, day - 1));

        return {
          id: createId("plan"),
          title: `Day ${day} · ${islandLabel(island)}`,
          island,
          date: date.toISOString().slice(0, 10),
          createdAt: nowIso,
          updatedAt: nowIso,
          status: "draft" as const,
          notes: "Imported automatically from the earlier VI Guide trip planner.",
          plan: stops.map((item) => ({
            id: `legacy_${item.id}`.slice(0, 160),
            placeId: item.id,
            title: item.name,
            island: item.island,
            kind: item.kind,
            summary:
              item.description ||
              `Saved ${item.kind} on ${islandLabel(item.island)}.`,
            ...(item.href ? { href: item.href } : {}),
            ...(daypartTime(item.timeOfDay)
              ? { startTime: daypartTime(item.timeOfDay) }
              : {}),
          })),
        } satisfies JourneyPlan;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    writeJourneyPlans(plans);
    return plans;
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
  const existing = plans.find((plan) => plan.island === input.island);
  const target =
    existing ??
    createJourneyPlan(input.island, `My ${islandLabel(input.island)} day`);
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
    (stop) =>
      typeof stop.lat === "number" && typeof stop.lng === "number",
  );
  const mapPlaceId = placeIdFromMapHref(firstPositionedStop?.mapHref);
  if (firstPositionedStop) {
    params.set(
      "place",
      mapPlaceId || firstPositionedStop.placeId || firstPositionedStop.id,
    );
    params.set("placeName", firstPositionedStop.title);
    params.set("placeType", mapPlaceType(firstPositionedStop.kind));
    params.set("placeLat", String(firstPositionedStop.lat));
    params.set("placeLng", String(firstPositionedStop.lng));
    if (firstPositionedStop.summary) {
      params.set("placeDescription", firstPositionedStop.summary.slice(0, 500));
    }
  }
  return `/map?${params.toString()}`;
}

function mapPlaceType(kind: string) {
  const normalized = kind.toLowerCase();
  if (normalized.includes("beach")) return "beach";
  if (normalized.includes("stay") || normalized.includes("hotel")) return "stay";
  if (normalized.includes("historic") || normalized.includes("heritage")) {
    return "historic";
  }
  return "place";
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

function normalizeLegacyTripItem(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const item = value as LegacyTripItem;
  const island = normalizeIsland(item.island);
  if (
    !island ||
    typeof item.id !== "string" ||
    !item.id.trim() ||
    typeof item.name !== "string" ||
    !item.name.trim()
  ) {
    return null;
  }

  const day = Number(item.day);
  const timeOfDay =
    item.timeOfDay === "morning" ||
    item.timeOfDay === "afternoon" ||
    item.timeOfDay === "evening" ||
    item.timeOfDay === "flexible"
      ? item.timeOfDay
      : "flexible";

  return {
    id: item.id.trim().slice(0, 150),
    name: item.name.trim().slice(0, 160),
    island,
    kind:
      typeof item.kind === "string" && item.kind.trim()
        ? item.kind.trim().slice(0, 80)
        : "place",
    description:
      typeof item.description === "string"
        ? item.description.trim().slice(0, 1200)
        : "",
    href:
      typeof item.href === "string" && item.href.trim()
        ? item.href.trim().slice(0, 500)
        : "",
    day: Number.isFinite(day) ? Math.max(1, Math.min(7, Math.round(day))) : 1,
    timeOfDay,
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

function placeIdFromMapHref(mapHref?: string) {
  if (!mapHref) return "";
  const query = mapHref.split("?")[1];
  if (!query) return "";
  return new URLSearchParams(query).get("place")?.trim() || "";
}

function daypartTime(value: string) {
  if (value === "morning") return "09:00";
  if (value === "afternoon") return "13:00";
  if (value === "evening") return "18:00";
  return "";
}

function islandLabel(island: IntelligenceIsland) {
  if (island === "stj") return "St. John";
  if (island === "stx") return "St. Croix";
  return "St. Thomas";
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

function isLegacyTripItem(
  value: ReturnType<typeof normalizeLegacyTripItem>,
): value is NonNullable<ReturnType<typeof normalizeLegacyTripItem>> {
  return value !== null;
}

function createId(prefix: string) {
  const random =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}
