import type { IslandCode } from "../types";
import type { BusinessCategory, LeadSource } from "./business";

export type DiscoverySource =
  | "firestore_business"
  | "firestore_place"
  | "firestore_beach"
  | "firestore_event"
  | "geographic_index"
  | "dictionary"
  | "estate"
  | "historic_site"
  | "unknown";

export type DiscoveryKind =
  | "business"
  | "place"
  | "beach"
  | "event"
  | "estate"
  | "historic_site"
  | "dictionary"
  | "transportation"
  | "parcel"
  | "unknown";

export type DiscoveryCoordinates = {
  lat: number;
  lng: number;
};

export type UnifiedDiscoveryItem = {
  id: string;
  stableKey: string;
  source: DiscoverySource;
  sources: DiscoverySource[];

  name: string;
  title: string;
  slug: string;

  kind: DiscoveryKind;
  type?: string;
  category?: string | BusinessCategory;

  island?: IslandCode;
  estate?: string;
  address?: string;

  description?: string;
  imageUrl?: string;
  coverImage?: string;
  thumbnailUrl?: string;
  tags: string[];

  coordinates?: DiscoveryCoordinates;

  businessId?: string;
  placeId?: string;
  beachId?: string;
  eventId?: string;
  estateId?: string;
  dictionaryId?: string;
  historicSiteId?: string;

  phone?: string;
  email?: string;
  website?: string;

  featured?: boolean;
  premium?: boolean;
  verified?: boolean;
  claimStatus?: string;

  revenueEligible: boolean;
  leadEligible: boolean;
  bookingEligible: boolean;
  mobilityEligible: boolean;
  mapEligible: boolean;

  leadSource?: LeadSource | "explore" | "map" | "nearby";

  searchText: string;

  raw?: unknown[];
};

export type UnifiedDiscoveryOptions = {
  island?: IslandCode;
  includeBusinesses?: boolean;
  includePlaces?: boolean;
  includeBeaches?: boolean;
  includeEvents?: boolean;
  includeGeographicIndex?: boolean;
  placeLimitPerCategory?: number;
};