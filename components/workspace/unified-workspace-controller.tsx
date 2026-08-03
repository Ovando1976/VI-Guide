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

function readStoredState(): UnifiedWorkspaceState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as
      | Partial<UnifiedWorkspaceState>
      | null;
    return parsed
      ? {
          ...DEFAULT_STATE,
          ...parsed,
          island:
            parsed.island === "stj" || parsed.island === "stx" ? parsed.island : "stt",
          updatedAt: parsed.updatedAt ?? DEFAULT_STATE.updatedAt,
        }
      : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function UnifiedWorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UnifiedWorkspaceState>(DEFAULT_STATE);

  useEffect(() => {
    setState(readStoredState());
  }, []);

  const patch = useCallback((nextPatch: Partial<UnifiedWorkspaceState>) => {
    setState((current) => {
      const next = {
        ...current,
        ...nextPatch,
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(UPDATED_EVENT, { detail: next }));
      return next;
    });
  }, []);

  useEffect(() => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<UnifiedWorkspaceState>).detail;
      setState(detail ?? readStoredState());
    };
    window.addEventListener(UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
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
