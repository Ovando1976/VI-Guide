import type { IslandCode } from "@/types/usvi";

/**
 * Controls how the map is presented.
 */
export type TerritoryMapLens =
  | "beaches"
  | "places"
  | "stays"
  | "historic"
  | "drivers"
  | "demand";

/**
 * Canonical territory marker categories.
 */
export type TerritoryMapPlaceType = "beach" | "place" | "stay" | "historic";

/**
 * Raw map marker data used to render the map.
 * Fields remain optional because not every upstream source
 * guarantees complete data.
 */
export type TerritoryMapPlace = {
  id?: string;
  name?: string;
  title?: string;
  island?: IslandCode | string;
  lat?: number;
  lng?: number;
  category?: string;
  type?: string;
  location?: string;
  description?: string;
  rating?: number;
  image?: string;
};

/**
 * Canonical mapped place selected by the user.
 * Everything required for interaction is guaranteed.
 */
export type TerritoryMapSelection = {
  id: string;
  name: string;
  type: TerritoryMapPlaceType;
  lat: number;
  lng: number;
  location?: string;
  description?: string;
  rating?: number;
};

/**
 * The application's single territorial selection.
 *
 * Only ONE thing may be selected at a time.
 */
export type TerritorySelection =
  | {
      kind: "estate";
      geoid: string;
    }
  | {
      kind: "place";
      place: TerritoryMapSelection;
    };

/**
 * Canonical Territory OS state.
 *
 * This intentionally contains only territorial state.
 * UI state (dialogs, drawers, filters, loading indicators,
 * etc.) belongs elsewhere.
 */
export type TerritoryState = {
  island: IslandCode;

  lens: TerritoryMapLens;

  selection: TerritorySelection | null;

  pickupGeoid: string | null;

  destinationGeoid: string | null;
};
