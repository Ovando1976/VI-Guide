import type { IslandCode, LngLat } from "@/types/usvi";

export type TerritoryEntityKind =
  | "estate"
  | "place"
  | "beach"
  | "historic"
  | "stay"
  | "transport"
  | "service"
  | "event"
  | "route"
  | "activity";

export type TerritoryEntityStatus =
  | "active"
  | "inactive"
  | "scheduled"
  | "live"
  | "unknown";

export type TerritorySource = {
  provider: string;
  sourceId?: string;
  updatedAt?: string;
  verified?: boolean;
};

export type TerritoryMedia = {
  hero?: string;
  images?: string[];
};

export type TerritoryAction = {
  id: string;
  label: string;
  href?: string;
  intent?: "open" | "directions" | "ride" | "save" | "concierge" | "book";
};

export type TerritoryMapCategory =
  | "Beach"
  | "Hotel"
  | "Landmark"
  | "Transit"
  | "Place"
  | "food"
  | "restaurant"
  | "bar"
  | "cafe"
  | "bakery"
  | "shopping"
  | "shop"
  | "grocery"
  | "nature"
  | "attraction"
  | "services"
  | "service"
  | "transport"
  | "nightlife"
  | string;

export type TerritoryMapPlace = {
  id: string;
  name: string;
  island: TerritoryEntity["island"];
  lat?: number;
  lng?: number;
  category: TerritoryMapCategory;
  type: TerritoryEntityKind;
  location?: string;
  description?: string;
  rating?: number;
  image?: string;
};

/**
 * Canonical record shared by map, discovery, planner, mobility, and Concierge.
 * Domain-specific detail belongs in `attributes`; shared UI reads the stable fields.
 */
export type TerritoryEntity = {
  id: string;
  slug?: string;
  kind: TerritoryEntityKind;
  island: IslandCode;
  title: string;
  summary?: string;
  description?: string;
  position?: LngLat;
  geometry?: GeoJSON.Geometry | null;
  estateGeoid?: string;
  categories: string[];
  tags: string[];
  status: TerritoryEntityStatus;
  rating?: number;
  media?: TerritoryMedia;
  attributes: Record<string, unknown>;
  actions?: TerritoryAction[];
  source: TerritorySource;
};

export type TerritoryQuery = {
  island?: IslandCode;
  kinds?: TerritoryEntityKind[];
  categories?: string[];
  text?: string;
  positionedOnly?: boolean;
};
