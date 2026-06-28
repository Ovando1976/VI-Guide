import type { IslandCode } from "../../types";

export type LngLat = [number, number];

export type MainTab = "map" | "properties" | "insights" | "favorites";
export type SearchTab = "all" | "estates" | "places" | "parcels";

export type SearchItemType =
  | "business"
  | "estate"
  | "town"
  | "ferry"
  | "beach"
  | "parcel"
  | "historic"
  | "archive"
  | "dictionary"
  | "place";

export type FocusBusiness = {
  id: string;
  name: string;
  category?: string;
  lat?: number;
  lng?: number;
  estate?: string;
  island?: string;
  imageUrl?: string;
};

export type SelectedMapItem = {
  id?: string | number;
  geoid?: string;
  name?: string;
  fullName?: string;
  baseName?: string;
  estate?: string;
  quarter?: string;
  QUARTER?: string;
  ADDRESS?: string;
  address?: string;
  type?: SearchItemType | string;
  coords: LngLat;
  isEstate?: boolean;
  isParcel?: boolean;
  isPoint?: boolean;
  source?: string;
  description?: string;
  island?: IslandCode | string;
  imageUrl?: string;
  coverImage?: string;
  thumbnailUrl?: string;
  category?: string;
  [key: string]: unknown;
};

export type SearchItem = {
  id: string;
  name: string;
  subtitle: string;
  tag: string;
  type: SearchItemType;
  island: IslandCode;
  coords: LngLat;
  quarter?: string;
  geoid?: string;
  source?: string;
  description?: string;
  imageUrl?: string;
  coverImage?: string;
  thumbnailUrl?: string;
};