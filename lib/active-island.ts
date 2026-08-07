export type ActiveIsland = "stt" | "stj" | "stx";

export const ACTIVE_ISLAND_STORAGE_KEY = "vi-guide.active-island";
export const ACTIVE_ISLAND_UPDATED_EVENT = "vi-guide-active-island-updated";

export function normalizeActiveIsland(value: unknown): ActiveIsland | null {
  return value === "stt" || value === "stj" || value === "stx" ? value : null;
}

export function readActiveIsland(fallback: ActiveIsland = "stt"): ActiveIsland {
  if (typeof window === "undefined") return fallback;
  return normalizeActiveIsland(window.localStorage.getItem(ACTIVE_ISLAND_STORAGE_KEY)) ?? fallback;
}

export function writeActiveIsland(island: ActiveIsland) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_ISLAND_STORAGE_KEY, island);
  } catch {
    // Navigation continuity still works in memory when storage is unavailable.
  }
  window.dispatchEvent(
    new CustomEvent<ActiveIsland>(ACTIVE_ISLAND_UPDATED_EVENT, { detail: island }),
  );
}

export function activeIslandLabel(island: ActiveIsland) {
  if (island === "stj") return "St. John";
  if (island === "stx") return "St. Croix";
  return "St. Thomas";
}
