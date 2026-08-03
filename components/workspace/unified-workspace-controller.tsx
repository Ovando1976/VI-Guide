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

export type UnifiedWorkspaceState = {
  island: IslandCode;
  lens: TerritoryMapLens;
  selection: TerritoryMapSelection | null;
  pickupGeoid: string | null;
  destinationGeoid: string | null;
  activePanel: "map" | "timeline" | "actions" | "concierge";
  tripItemCount: number;
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
};

const DEFAULT_STATE: UnifiedWorkspaceState = {
  island: "stt",
  lens: "places",
  selection: null,
  pickupGeoid: null,
  destinationGeoid: null,
  activePanel: "map",
  tripItemCount: 0,
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

function normalizeState(value: Partial<UnifiedWorkspaceState> | null): UnifiedWorkspaceState {
  if (!value) return DEFAULT_STATE;

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
        : 0,
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

function statesMatch(
  current: UnifiedWorkspaceState,
  nextPatch: Partial<UnifiedWorkspaceState>,
) {
  return Object.entries(nextPatch).every(
    ([key, value]) => current[key as keyof UnifiedWorkspaceState] === value,
  );
}

export function UnifiedWorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UnifiedWorkspaceState>(DEFAULT_STATE);

  useEffect(() => {
    setState(readStoredState());
  }, []);

  const patch = useCallback((nextPatch: Partial<UnifiedWorkspaceState>) => {
    setState((current) => {
      if (statesMatch(current, nextPatch)) return current;

      const next = normalizeState({
        ...current,
        ...nextPatch,
        updatedAt: new Date().toISOString(),
      });

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // The workspace remains functional when storage is unavailable or full.
      }

      window.dispatchEvent(new CustomEvent(UPDATED_EVENT, { detail: next }));
      return next;
    });
  }, []);

  useEffect(() => {
    const syncCustomEvent = (event: Event) => {
      const detail = (event as CustomEvent<UnifiedWorkspaceState>).detail;
      setState(normalizeState(detail));
    };

    const syncStorage = (event: StorageEvent) => {
      if (event.key && event.key !== STORAGE_KEY) return;
      setState(readStoredState());
    };

    window.addEventListener(UPDATED_EVENT, syncCustomEvent);
    window.addEventListener("storage", syncStorage);
    return () => {
      window.removeEventListener(UPDATED_EVENT, syncCustomEvent);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  const value = useMemo<UnifiedWorkspaceController>(
    () => ({
      state,
      patch,
      selectPlace: (selection) => patch({ selection, activePanel: "map" }),
      setIsland: (island) => patch({ island, selection: null }),
      setLens: (lens) => patch({ lens }),
      setRoute: (pickupGeoid, destinationGeoid) =>
        patch({ pickupGeoid, destinationGeoid }),
      setActivePanel: (activePanel) => patch({ activePanel }),
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
