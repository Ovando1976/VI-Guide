"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  consumePendingLivingMapFocus,
  createLivingMapFocusDetail,
  tripItemToMapFocusItem,
  VI_MAP_FOCUS_EVENT,
  type LivingMapFocusDetail,
  type LivingMapFocusItem,
  type LivingMapFocusSource,
} from "@/lib/intelligence/map-focus-events";
import {
  TRIP_STORAGE_KEY,
  type TripItem,
} from "@/components/trip-planner/trip-types";
import type { TerritoryMapLens, TerritoryMapSelection } from "@/types/territory-map";
import type { IslandCode } from "@/types/usvi";

const STORAGE_KEY = "vi-guide.unified-workspace";
const UPDATED_EVENT = "vi-guide-unified-workspace-updated";

const VALID_LENSES = new Set<TerritoryMapLens>([
  "places",
  "beaches",
  "stays",
  "historic",
  "drivers",
  "demand",
]);

const VALID_PANELS = new Set<UnifiedWorkspaceState["activePanel"]>([
  "map",
  "timeline",
  "actions",
  "concierge",
]);

const VALID_FOCUS_SOURCES = new Set<LivingMapFocusSource>([
  "concierge-response",
  "concierge-recommendation",
  "concierge-itinerary",
  "saved-stop",
  "map-workspace",
  "external-link",
]);

export type UnifiedWorkspaceState = {
  island: IslandCode;
  lens: TerritoryMapLens;
  selection: TerritoryMapSelection | null;
  pickupGeoid: string | null;
  destinationGeoid: string | null;
  activePanel: "map" | "timeline" | "actions" | "concierge";
  tripItemCount: number;
  savedStops: LivingMapFocusItem[];
  liveFocus: LivingMapFocusDetail | null;
  lastAction?: string;
  updatedAt: string;
};

type UnifiedWorkspaceController = {
  state: UnifiedWorkspaceState;
  patch: (patch: Partial<UnifiedWorkspaceState>) => void;
  selectPlace: (place: TerritoryMapSelection | null) => void;
  setIsland: (island: IslandCode) => void;
  setLens: (lens: TerritoryMapLens) => void;
  setRoute: (pickupGeoid: string | null, destinationGeoid: string | null) => void;
  setActivePanel: (panel: UnifiedWorkspaceState["activePanel"]) => void;
  setLiveFocus: (focus: LivingMapFocusDetail | null) => void;
  clearLiveFocus: () => void;
};

const DEFAULT_STATE: UnifiedWorkspaceState = {
  island: "stt",
  lens: "places",
  selection: null,
  pickupGeoid: null,
  destinationGeoid: null,
  activePanel: "map",
  tripItemCount: 0,
  savedStops: [],
  liveFocus: null,
  updatedAt: new Date(0).toISOString(),
};

const UnifiedWorkspaceContext = createContext<UnifiedWorkspaceController | null>(null);

function validIsland(value: unknown): IslandCode {
  return value === "stj" || value === "stx" ? value : "stt";
}

function validLens(value: unknown): TerritoryMapLens {
  return typeof value === "string" && VALID_LENSES.has(value as TerritoryMapLens)
    ? (value as TerritoryMapLens)
    : "places";
}

function validPanel(value: unknown): UnifiedWorkspaceState["activePanel"] {
  return typeof value === "string" && VALID_PANELS.has(value as UnifiedWorkspaceState["activePanel"])
    ? (value as UnifiedWorkspaceState["activePanel"])
    : "map";
}

function validFocusSource(value: unknown): LivingMapFocusSource | null {
  return typeof value === "string" &&
    VALID_FOCUS_SOURCES.has(value as LivingMapFocusSource)
    ? (value as LivingMapFocusSource)
    : null;
}

function normalizeLiveFocus(value: unknown): LivingMapFocusDetail | null {
  if (!value || typeof value !== "object") return null;
  const focus = value as Partial<LivingMapFocusDetail>;
  const source = validFocusSource(focus.source);
  if (!source) return null;
  const normalized = createLivingMapFocusDetail(
    Array.isArray(focus.items) ? focus.items : [],
    source,
    typeof focus.primaryId === "string" ? focus.primaryId : undefined,
  );
  if (!normalized) return null;
  return {
    ...normalized,
    issuedAt:
      typeof focus.issuedAt === "string" ? focus.issuedAt : normalized.issuedAt,
  };
}

function normalizeSavedStops(value: unknown): LivingMapFocusItem[] {
  if (!Array.isArray(value)) return [];
  const focus = createLivingMapFocusDetail(
    value as LivingMapFocusItem[],
    "saved-stop",
  );
  return focus?.items ?? [];
}

function normalizeState(value: Partial<UnifiedWorkspaceState> | null): UnifiedWorkspaceState {
  if (!value) return DEFAULT_STATE;

  const savedStops = normalizeSavedStops(value.savedStops);

  return {
    ...DEFAULT_STATE,
    ...value,
    island: validIsland(value.island),
    lens: validLens(value.lens),
    activePanel: validPanel(value.activePanel),
    selection: value.selection ?? null,
    pickupGeoid: typeof value.pickupGeoid === "string" ? value.pickupGeoid : null,
    destinationGeoid:
      typeof value.destinationGeoid === "string" ? value.destinationGeoid : null,
    tripItemCount:
      typeof value.tripItemCount === "number" && Number.isFinite(value.tripItemCount)
        ? Math.max(0, Math.floor(value.tripItemCount))
        : savedStops.length,
    savedStops,
    liveFocus: normalizeLiveFocus(value.liveFocus),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : DEFAULT_STATE.updatedAt,
  };
}

function readStoredState(): UnifiedWorkspaceState {
  if (typeof window === "undefined") return DEFAULT_STATE;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as
      | Partial<UnifiedWorkspaceState>
      | null;
    return normalizeState(parsed);
  } catch {
    return DEFAULT_STATE;
  }
}

function validTripItem(value: unknown): value is TripItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<TripItem>;
  return Boolean(
    typeof item.id === "string" &&
      typeof item.name === "string" &&
      (item.kind === "place" ||
        item.kind === "beach" ||
        item.kind === "stay" ||
        item.kind === "historic") &&
      (item.island === "stt" || item.island === "stj" || item.island === "stx"),
  );
}

function readSavedStops() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(TRIP_STORAGE_KEY) ?? "[]",
    ) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(validTripItem)
      .slice(-20)
      .map(tripItemToMapFocusItem);
  } catch {
    return [];
  }
}

function statesMatch(
  current: UnifiedWorkspaceState,
  nextPatch: Partial<UnifiedWorkspaceState>,
) {
  return Object.entries(nextPatch).every(
    ([key, value]) => current[key as keyof UnifiedWorkspaceState] === value,
  );
}

function persistState(state: UnifiedWorkspaceState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The workspace remains functional when storage is unavailable or full.
  }
}

export function UnifiedWorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UnifiedWorkspaceState>(DEFAULT_STATE);

  useEffect(() => {
    const stored = readStoredState();
    const savedStops = readSavedStops();
    const pendingFocus = consumePendingLivingMapFocus();
    setState(
      normalizeState({
        ...stored,
        savedStops,
        tripItemCount: savedStops.length,
        liveFocus: pendingFocus ?? stored.liveFocus,
      }),
    );
  }, []);

  const patch = useCallback((nextPatch: Partial<UnifiedWorkspaceState>) => {
    setState((current) => {
      if (statesMatch(current, nextPatch)) return current;

      const next = normalizeState({
        ...current,
        ...nextPatch,
        updatedAt: new Date().toISOString(),
      });

      persistState(next);
      window.dispatchEvent(new CustomEvent(UPDATED_EVENT, { detail: next }));
      return next;
    });
  }, []);

  useEffect(() => {
    const syncCustomEvent = (event: Event) => {
      const detail = (event as CustomEvent<UnifiedWorkspaceState>).detail;
      setState(normalizeState(detail));
    };

    const syncMapFocus = (event: Event) => {
      const detail = normalizeLiveFocus(
        (event as CustomEvent<LivingMapFocusDetail>).detail,
      );
      if (!detail) return;
      consumePendingLivingMapFocus();
      setState((current) => {
        const next = normalizeState({
          ...current,
          liveFocus: detail,
          lastAction: `map.focus.${detail.source}`,
          updatedAt: new Date().toISOString(),
        });
        persistState(next);
        return next;
      });
    };

    const syncTrip = () => {
      const savedStops = readSavedStops();
      setState((current) => {
        const next = normalizeState({
          ...current,
          savedStops,
          tripItemCount: savedStops.length,
          updatedAt: new Date().toISOString(),
        });
        persistState(next);
        return next;
      });
    };

    const syncStorage = (event: StorageEvent) => {
      if (event.key === TRIP_STORAGE_KEY) {
        syncTrip();
        return;
      }
      if (event.key && event.key !== STORAGE_KEY) return;
      const stored = readStoredState();
      const savedStops = readSavedStops();
      setState(
        normalizeState({
          ...stored,
          savedStops,
          tripItemCount: savedStops.length,
        }),
      );
    };

    window.addEventListener(UPDATED_EVENT, syncCustomEvent);
    window.addEventListener(VI_MAP_FOCUS_EVENT, syncMapFocus);
    window.addEventListener("vi-guide-trip-updated", syncTrip);
    window.addEventListener("storage", syncStorage);
    return () => {
      window.removeEventListener(UPDATED_EVENT, syncCustomEvent);
      window.removeEventListener(VI_MAP_FOCUS_EVENT, syncMapFocus);
      window.removeEventListener("vi-guide-trip-updated", syncTrip);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  const value = useMemo<UnifiedWorkspaceController>(
    () => ({
      state,
      patch,
      selectPlace: (selection) =>
        patch({
          selection,
          activePanel: "map",
          lastAction: selection ? "map.place.selected" : "map.selection.cleared",
        }),
      setIsland: (island) =>
        patch({ island, selection: null, lastAction: "map.island.changed" }),
      setLens: (lens) => patch({ lens, lastAction: "map.lens.changed" }),
      setRoute: (pickupGeoid, destinationGeoid) =>
        patch({
          pickupGeoid,
          destinationGeoid,
          lastAction: "map.route.changed",
        }),
      setActivePanel: (activePanel) => patch({ activePanel }),
      setLiveFocus: (liveFocus) =>
        patch({
          liveFocus,
          lastAction: liveFocus
            ? `map.focus.${liveFocus.source}`
            : "map.focus.cleared",
        }),
      clearLiveFocus: () =>
        patch({ liveFocus: null, lastAction: "map.focus.cleared" }),
    }),
    [patch, state],
  );

  return (
    <UnifiedWorkspaceContext.Provider value={value}>
      {children}
    </UnifiedWorkspaceContext.Provider>
  );
}

export function useUnifiedWorkspace() {
  const value = useContext(UnifiedWorkspaceContext);
  if (!value) {
    throw new Error("useUnifiedWorkspace must be used inside UnifiedWorkspaceProvider.");
  }
  return value;
}
