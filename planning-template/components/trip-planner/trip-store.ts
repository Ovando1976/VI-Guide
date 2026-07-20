import {
  TRIP_DAYS_STORAGE_KEY,
  TRIP_STORAGE_KEY,
  TRIP_UPDATED_EVENT,
  type TripItem,
  type TripItemKind,
} from "./trip-types";

export type NewTripItem = Pick<
  TripItem,
  "id" | "slug" | "name" | "kind" | "island" | "href"
> &
  Partial<Omit<TripItem, "id" | "slug" | "name" | "kind" | "island" | "href">>;

const KINDS = new Set<TripItemKind>(["place", "beach", "stay", "historic"]);
const ISLANDS = new Set(["stt", "stj", "stx"]);
const DAYPARTS = new Set(["morning", "afternoon", "evening", "flexible"]);

export function tripItemKey(item: Pick<TripItem, "id" | "kind">) {
  return `${item.kind}:${item.id}`;
}

export function readTrip(): TripItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(TRIP_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed.flatMap((value) => {
      const item = normalizeTripItem(value);
      if (!item) return [];
      const key = tripItemKey(item);
      if (seen.has(key)) return [];
      seen.add(key);
      return [item];
    });
  } catch {
    return [];
  }
}

export function writeTrip(items: TripItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(TRIP_UPDATED_EVENT, { detail: items }));
}

export function readTripDays() {
  if (typeof window === "undefined") return 3;
  const value = Number(localStorage.getItem(TRIP_DAYS_STORAGE_KEY));
  return Number.isInteger(value) && value >= 1 && value <= 14 ? value : 3;
}

export function writeTripDays(days: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TRIP_DAYS_STORAGE_KEY, String(clampDay(days, 14)));
}

export function addTripItem(item: NewTripItem, schedule?: Partial<Pick<TripItem, "day" | "timeOfDay">>) {
  const current = readTrip();
  const key = tripItemKey(item);
  const existing = current.find((entry) => tripItemKey(entry) === key);
  if (existing) return { items: current, item: existing, added: false };

  const days = readTripDays();
  const nextItem: TripItem = {
    ...item,
    day: clampDay(schedule?.day ?? suggestDay(current, days), days),
    timeOfDay: schedule?.timeOfDay ?? suggestDaypart(item.kind),
    addedAt: item.addedAt ?? new Date().toISOString(),
  };
  const next = [...current, nextItem];
  writeTrip(next);
  return { items: next, item: nextItem, added: true };
}

export function subscribeToTrip(callback: (items: TripItem[]) => void) {
  const sync = () => callback(readTrip());
  window.addEventListener(TRIP_UPDATED_EVENT, sync);
  window.addEventListener("storage", sync);
  return () => {
    window.removeEventListener(TRIP_UPDATED_EVENT, sync);
    window.removeEventListener("storage", sync);
  };
}

export function optimizeTrip(items: TripItem[], days: number) {
  const partRank = { morning: 0, afternoon: 1, evening: 2, flexible: 3 } as const;
  const islands = Array.from(new Set(items.map((item) => item.island)));
  const baseDays = Math.max(1, Math.floor(days / Math.max(1, islands.length)));
  let dayCursor = 1;
  const result: TripItem[] = [];

  islands.forEach((island, islandIndex) => {
    const remainingDays = days - dayCursor + 1;
    const allocation = islandIndex === islands.length - 1
      ? Math.max(1, remainingDays)
      : Math.max(1, Math.min(baseDays, remainingDays));
    const group = items
      .filter((item) => item.island === island)
      .sort((a, b) => partRank[a.timeOfDay] - partRank[b.timeOfDay]);
    group.forEach((item, index) => {
      const slot = index % allocation;
      result.push({
        ...item,
        day: Math.min(days, dayCursor + slot),
        timeOfDay: item.timeOfDay === "flexible"
          ? (["morning", "afternoon", "evening"] as const)[Math.floor(index / allocation) % 3]
          : item.timeOfDay,
      });
    });
    dayCursor = Math.min(days, dayCursor + allocation);
  });

  return result.sort((a, b) =>
    a.day - b.day || partRank[a.timeOfDay] - partRank[b.timeOfDay],
  );
}

function suggestDay(items: TripItem[], days: number) {
  const counts = Array.from({ length: days }, (_, index) =>
    items.filter((item) => item.day === index + 1).length,
  );
  return counts.indexOf(Math.min(...counts)) + 1;
}

function suggestDaypart(kind: TripItemKind) {
  if (kind === "beach" || kind === "historic") return "morning" as const;
  if (kind === "stay") return "evening" as const;
  return "flexible" as const;
}

function clampDay(value: number, days: number) {
  return Math.max(1, Math.min(days, Math.round(value || 1)));
}

function normalizeTripItem(value: unknown): TripItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<TripItem>;
  if (
    typeof item.id !== "string" || typeof item.slug !== "string" ||
    typeof item.name !== "string" || typeof item.href !== "string" ||
    !KINDS.has(item.kind as TripItemKind) || !ISLANDS.has(item.island ?? "")
  ) return null;
  return {
    ...item,
    id: item.id,
    slug: item.slug,
    name: item.name,
    href: item.href,
    kind: item.kind as TripItemKind,
    island: item.island as TripItem["island"],
    day: clampDay(Number(item.day), 14),
    timeOfDay: DAYPARTS.has(item.timeOfDay ?? "") ? item.timeOfDay! : "flexible",
    addedAt: typeof item.addedAt === "string" ? item.addedAt : new Date().toISOString(),
  };
}
