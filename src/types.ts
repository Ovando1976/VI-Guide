/**
 * VI Explorer - Canonical Type System
 */

export type IslandCode = "st_thomas" | "st_john" | "st_croix" | "water_island";

export type AreaKind = "town" | "estate" | "district" | "harbor" | "beach_area";

export type Coordinates = {
  lat: number;
  lng: number;
};

export type IslandDoc = {
  id?: string;
  code: IslandCode;
  name: string;
  shortName: string;
  featured?: boolean;
  heroImage?: string;
  description?: string;
  sortOrder: number;
};

export type AreaDoc = {
  id?: string;
  slug: string;
  name: string;
  islandCode: IslandCode;
  kind: AreaKind;
  coordinates?: Coordinates;
};

export type PublishStatus = "draft" | "published";

export type BaseContentDoc = {
  id?: string;
  slug: string;
  title: string;
  islandCode: IslandCode;
  areaSlug?: string;
  description: string;
  shortDescription?: string;
  coverImage?: string;
  gallery?: string[];
  tags?: string[];
  coordinates?: Coordinates;
  featured?: boolean;
  status: PublishStatus;
  createdAt: number;
  updatedAt: number;
};

export type BeachDoc = BaseContentDoc & {
  amenities?: string[];
  familyFriendly?: boolean;
  snorkeling?: boolean;
  swimmable?: boolean;
  foodNearby?: boolean;
  parkingInfo?: string;
  sandType?: string;
  waterColor?: string;
};

export type PlaceCategory =
  | "restaurant"
  | "bar"
  | "cafe"
  | "nightlife"
  | "attraction"
  | "shopping"
  | "excursion"
  | "service"
  | "provisioning"
  | "concierge";

export type PlaceDoc = BaseContentDoc & {
  category: PlaceCategory;
  address?: string;
  phone?: string;
  website?: string;
  hours?: Record<string, string>;
  priceTier?: "$" | "$$" | "$$$" | "$$$$";
  rating?: number;
};

export type EventDoc = BaseContentDoc & {
  category?:
    | "event"
    | "music"
    | "culture"
    | "food"
    | "sports"
    | "nightlife"
    | "tourism";
  venueName?: string;
  address?: string;
  website?: string;
  source?: string;
  sourceStatus?: string;
  verifiedAt?: string;

  startAt: number;
  endAt?: number;

  price?: string;

  imageCredits?: string;
  imageSource?: string;
};

export type FeaturedSectionKey =
  | "home_hero"
  | "featured_beaches"
  | "top_food"
  | "weekend_events";

export type FeaturedSectionDoc = {
  id?: string;
  key: FeaturedSectionKey;
  title: string;
  subtitle?: string;
  enabled: boolean;
  itemRefs: Array<{
    collection: "beaches" | "places" | "events";
    slug: string;
  }>;
  updatedAt: number;
};

// User & Auth Types
export type UserRole = "user" | "merchant" | "admin";

export interface UserProfile {
  selectedIsland: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  islandPreference?: IslandCode;
  favorites?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Inquiry {
  id: string;
  merchantId: string;
  listingId: string;
  listingName: string;
  userId: string;
  userName: string;
  userEmail: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Document & Collaboration Types
export type DocumentType =
  | "report"
  | "proposal"
  | "memo"
  | "itinerary"
  | "draft";

export interface AIDocument {
  id: string;
  title: string;
  content: string;
  type: DocumentType;
  userId: string;
  islandCode?: IslandCode;
  estateSlug?: string;
  tags?: string[];
  version: number;
  createdAt: number;
  updatedAt: number;
  sharedWith?: string[]; // Array of user IDs
}

// Community & Content Types
export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  islandCode: IslandCode;
  estateSlug?: string; // Anchored to a real estate
  images?: string[];
  likes: number;
  commentsCount: number;
  createdAt: number;
  updatedAt: number;
}

// Transit & Logistics Types
export type TransitType =
  | "ferry"
  | "shuttle"
  | "bus"
  | "helicopter"
  | "seaplane";

export interface TransitRoute {
  id: string;
  type: TransitType;
  name: string;
  operatorId: string;
  islandCode: IslandCode;
  from: string; // Hub or Estate
  to: string; // Hub or Estate
  schedule: string; // Human readable or structured
  price: string;
  status: "active" | "delayed" | "cancelled";
  lastUpdated: number;
}

// AI Memory Types
export interface UserMemory {
  id: string;
  userId: string;
  key: string; // e.g., 'preferred_beaches', 'last_search_context'
  value: any;
  importance: number; // 0-10
  createdAt: number;
  updatedAt: number;
}

// Mobility & Ride-Sharing Types
export type MobilityIsland = "stt" | "stj" | "stx" | "wat" | "unk";
export type TripStatus =
  | "requested"
  | "quoted"
  | "matched"
  | "driver_en_route"
  | "arrived"
  | "in_progress"
  | "ferry_leg"
  | "completed"
  | "cancelled";
export type TripType =
  | "direct"
  | "shared"
  | "airport"
  | "cruise"
  | "ferry_transfer";
export type ServiceClass = "private" | "shared";
export type VehicleClass = "standard" | "premium" | "shared";
export type ServiceMode = "airport" | "town" | "ferry" | "shared" | "private";
export type VehicleType = "sedan" | "suv" | "van" | "safari";

export interface Driver {
  id: string;
  fullName: string;
  phone: string;
  island: MobilityIsland;
  status: "pending" | "active" | "suspended";
  serviceModes: ServiceMode[];
  vehicleType: VehicleType;
  seats: number;
  luggageCapacity: number;
  licenseNumber: string;
  taxiPermitNumber?: string;
  documents: {
    licenseVerified: boolean;
    insuranceVerified: boolean;
    registrationVerified: boolean;
  };
  payoutAccountConnected: boolean;
  rating: number;
  createdAt: number;
  updatedAt: number;
}

export interface Vehicle {
  id: string;
  driverId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  plate: string;
  class: VehicleClass;
  island: MobilityIsland;
  active: boolean;
}

export interface Trip {
  id: string;
  riderId: string;
  driverId: string | null;
  status: TripStatus;
  tripType: TripType;
  island: MobilityIsland | "multi";
  pickup: TripLocation;
  dropoff: TripLocation;
  passengers: number;
  luggage: number;
  serviceClass: ServiceClass;
  quote: {
    baseFare: number;
    luggageFee: number;
    waitingFee: number;
    premiumFee: number;
    total: number;
    currency: "USD";
  };
  ferryPlan?: {
    route: "red_hook_cruz_bay" | "crown_bay_cruz_bay";
    departureWindow?: string;
    leg1DriverId?: string;
    leg3DriverId?: string;
  };
  createdAt: number;
  updatedAt: number;
}

export type TripLocation = {
  label: string;
  lat: number;
  lng: number;
  type:
    | "estate"
    | "hotel"
    | "beach"
    | "airport"
    | "ferry"
    | "custom"
    | "parcel";
  estateGeoid?: string;
  estateName?: string;
  parcelId?: string;
  island: MobilityIsland;
};

export type EstateRecord = {
  geoid: string;
  island: MobilityIsland;
  name: string;
  aliases: string[];
  quarter?: string;
  centroid: Coordinates;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  geometry: any; // GeoJSON.Polygon | GeoJSON.MultiPolygon
};

export type ParcelRecord = {
  parcelId: string;
  sourceParcelId?: string | null;
  sourceParcelNo?: string | null;
  address?: string | null;
  estateName?: string | null;
  island: MobilityIsland;
  ownerName?: string | null;
  zoning?: string | null;
  centroid: Coordinates;
  bbox: [number, number, number, number];
  geometry: any; // GeoJSON.Polygon | GeoJSON.MultiPolygon
};

export type GeoContext = {
  lat: number;
  lng: number;
  island: MobilityIsland;
  estate?: {
    geoid: string;
    name: string;
    aliases?: string[];
    quarter?: string;
  };
  parcel?: {
    parcelId: string;
    sourceParcelId?: string | null;
    sourceParcelNo?: string | null;
    address?: string | null;
    estateName?: string | null;
    ownerName?: string | null;
    centroid?: Coordinates | null;
  };
  place?: {
    id: string;
    label: string;
    kind:
      | "hotel"
      | "villa"
      | "business"
      | "beach"
      | "airport"
      | "ferry"
      | "custom";
  };
};

export interface FareRule {
  id: string;
  island: MobilityIsland | "multi";
  serviceType: "standard" | "private" | "shared" | "airport" | "ferry_transfer";
  originZone: string;
  destinationZone: string;
  pricingMode: "fixed" | "per_person" | "distance_plus_fixed";
  baseAmount: number;
  perPassengerAmount?: number;
  luggageAmount?: number;
  waitingPerMinute?: number;
  lateNightMultiplier?: number;
  active: boolean;
}

export interface Partner {
  id: string;
  name: string;
  type: "hotel" | "villa_manager" | "fleet" | "excursion" | "marina";
  contactEmail: string;
  contactPhone?: string;
  status: "active" | "inactive";
  createdAt: number;
}

// Legacy Compatibility (to minimize immediate breakage)
export type Listing = PlaceDoc | BeachDoc;
export type Event = EventDoc;
