export const JOURNEY_TOMBSTONES_STORAGE_KEY =
  "vi-guide.journey-tombstones.v1";

const MAX_TOMBSTONES = 120;

export type JourneyTombstone = {
  id: string;
  deletedAt: string;
};

export function normalizeJourneyTombstones(value: unknown): JourneyTombstone[] {
  if (!Array.isArray(value)) return [];
  const latest = new Map<string, JourneyTombstone>();

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<JourneyTombstone>;
    const id = cleanId(candidate.id);
    const deletedAt = normalizeTimestamp(candidate.deletedAt);
    if (!id || !deletedAt) continue;
    const existing = latest.get(id);
    if (!existing || deletedAt > existing.deletedAt) {
      latest.set(id, { id, deletedAt });
    }
  }

  return [...latest.values()]
    .sort((left, right) => right.deletedAt.localeCompare(left.deletedAt))
    .slice(0, MAX_TOMBSTONES);
}

export function mergeJourneyTombstones(
  first: JourneyTombstone[],
  second: JourneyTombstone[],
) {
  return normalizeJourneyTombstones([...first, ...second]);
}

export function journeyTombstoneIds(tombstones: JourneyTombstone[]) {
  return new Set(normalizeJourneyTombstones(tombstones).map((item) => item.id));
}

export function readJourneyTombstones() {
  if (typeof window === "undefined") return [];
  try {
    return normalizeJourneyTombstones(
      JSON.parse(window.localStorage.getItem(JOURNEY_TOMBSTONES_STORAGE_KEY) ?? "[]"),
    );
  } catch {
    return [];
  }
}

export function writeJourneyTombstones(tombstones: JourneyTombstone[]) {
  const normalized = normalizeJourneyTombstones(tombstones);
  if (typeof window === "undefined") return normalized;
  try {
    window.localStorage.setItem(
      JOURNEY_TOMBSTONES_STORAGE_KEY,
      JSON.stringify(normalized),
    );
  } catch {
    // Local storage policy should never block itinerary use.
  }
  return normalized;
}

export function rememberJourneyDeletion(
  planId: string,
  deletedAt = new Date().toISOString(),
) {
  const id = cleanId(planId);
  const timestamp = normalizeTimestamp(deletedAt);
  if (!id || !timestamp) return readJourneyTombstones();
  return writeJourneyTombstones([
    { id, deletedAt: timestamp },
    ...readJourneyTombstones(),
  ]);
}

export function forgetJourneyDeletion(planId: string) {
  const id = cleanId(planId);
  if (!id) return readJourneyTombstones();
  return writeJourneyTombstones(
    readJourneyTombstones().filter((item) => item.id !== id),
  );
}

function cleanId(value: unknown) {
  return typeof value === "string"
    ? value.replace(/\s+/g, "").trim().slice(0, 160)
    : "";
}

function normalizeTimestamp(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "";
  const timestamp = new Date(value).toISOString();
  return Number.isFinite(Date.parse(timestamp)) ? timestamp : "";
}
