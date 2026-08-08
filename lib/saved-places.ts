export const SAVED_PLACES_STORAGE_KEY = "vi-guide.saved-places";
export const SAVED_PLACES_UPDATED_EVENT = "vi-guide-saved-places-updated";

export type SavedPlace = {
  id: string;
  title: string;
  island: "stt" | "stj" | "stx";
  kind: string;
  summary: string;
  image?: string;
  href?: string;
  mapHref?: string;
  rideHref?: string;
  bookingHref?: string;
  lat?: number;
  lng?: number;
  savedAt: string;
};

export type SavedPlaceInput = Omit<SavedPlace, "savedAt">;

export function readSavedPlaces(): SavedPlace[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(SAVED_PLACES_STORAGE_KEY) ?? "[]",
    );
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeSavedPlace)
      .filter((place): place is SavedPlace => Boolean(place))
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  } catch {
    return [];
  }
}

export function isPlaceSaved(id: string) {
  return readSavedPlaces().some((place) => place.id === id);
}

export function savePlace(input: SavedPlaceInput) {
  if (typeof window === "undefined") return;
  const normalized = normalizeSavedPlace({
    ...input,
    savedAt: new Date().toISOString(),
  });
  if (!normalized) return;
  const current = readSavedPlaces();
  writeSavedPlaces([
    normalized,
    ...current.filter((place) => place.id !== normalized.id),
  ]);
}

export function removeSavedPlace(id: string) {
  if (typeof window === "undefined") return;
  writeSavedPlaces(readSavedPlaces().filter((place) => place.id !== id));
}

export function toggleSavedPlace(input: SavedPlaceInput) {
  if (isPlaceSaved(input.id)) {
    removeSavedPlace(input.id);
    return false;
  }
  savePlace(input);
  return true;
}

function writeSavedPlaces(places: SavedPlace[]) {
  try {
    window.localStorage.setItem(SAVED_PLACES_STORAGE_KEY, JSON.stringify(places));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(SAVED_PLACES_UPDATED_EVENT));
}

function normalizeSavedPlace(value: unknown): SavedPlace | null {
  if (!value || typeof value !== "object") return null;
  const place = value as Partial<SavedPlace>;
  if (
    typeof place.id !== "string" ||
    !place.id.trim() ||
    typeof place.title !== "string" ||
    !place.title.trim() ||
    (place.island !== "stt" && place.island !== "stj" && place.island !== "stx")
  ) {
    return null;
  }

  const image = boundedInternalImage(place.image);

  return {
    id: place.id.trim().slice(0, 180),
    title: place.title.trim().slice(0, 220),
    island: place.island,
    kind:
      typeof place.kind === "string" && place.kind.trim()
        ? place.kind.trim().slice(0, 100)
        : "place",
    summary:
      typeof place.summary === "string" ? place.summary.trim().slice(0, 1200) : "",
    ...(image ? { image } : {}),
    ...(boundedHref(place.href) ? { href: boundedHref(place.href) } : {}),
    ...(boundedHref(place.mapHref) ? { mapHref: boundedHref(place.mapHref) } : {}),
    ...(boundedHref(place.rideHref) ? { rideHref: boundedHref(place.rideHref) } : {}),
    ...(boundedHref(place.bookingHref)
      ? { bookingHref: boundedHref(place.bookingHref) }
      : {}),
    ...(finiteCoordinate(place.lat, -90, 90) !== undefined
      ? { lat: place.lat }
      : {}),
    ...(finiteCoordinate(place.lng, -180, 180) !== undefined
      ? { lng: place.lng }
      : {}),
    savedAt:
      typeof place.savedAt === "string" && place.savedAt
        ? place.savedAt
        : new Date().toISOString(),
  };
}

function boundedInternalImage(value: unknown) {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) return "";
  return normalized.slice(0, 1200);
}

function boundedHref(value: unknown) {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  return normalized ? normalized.slice(0, 1200) : "";
}

function finiteCoordinate(value: unknown, minimum: number, maximum: number) {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
    ? value
    : undefined;
}
