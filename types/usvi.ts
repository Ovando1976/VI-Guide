export type IslandCode = "stt" | "stj" | "stx";

export type LngLat = {
  lat: number;
  lng: number;
};

export type EstateFeatureProperties = {
  GEOID?: string;
  STATE?: string;
  COUNTY?: string;
  BASENAME?: string;
  NAME?: string;
  CENTLAT?: string | number;
  CENTLON?: string | number;
  INTPTLAT?: string | number;
  INTPTLON?: string | number;
  ESTATE?: string;
};

export type EstateFeature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  EstateFeatureProperties
>;

export type EstateCollection = GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  EstateFeatureProperties
>;

export type EstateDescriptionSource =
  | "geographic_dictionary"
  | "generated"
  | "manual"
  | null;

export type EstateDescriptionConfidence = "high" | "medium" | "low" | null;

export type EstateDescription = {
  short: string | null;
  long: string | null;
  source: EstateDescriptionSource;
  sourcePage?: number | null;
  sourceEntry?: string | null;
  confidence?: EstateDescriptionConfidence;
  rawEntry?: string | null;
};

export type EstateRoadContext = {
  nearestRoad?: {
    name: string;
    fullname?: string;
    linearId?: string;
    mtfcc?: string;
    distanceMeters: number;
  };
  intersectingRoads: Array<{
    name: string;
    fullname?: string;
    linearId?: string;
    mtfcc?: string;
  }>;
  primaryAccessRoad?: {
    name: string;
    fullname?: string;
    linearId?: string;
    mtfcc?: string;
    strategy: "nearest" | "intersecting";
  };
};

export type MobilityRecordKind = "estate" | "mobility_place" | "mobility_hub";
export type TariffResolution = "direct" | "parent_estate" | "unresolved";
export type GeographyVerificationStatus = "verified" | "review_required";

/**
 * Quarter metadata is evidence-backed and may be parcel/place specific.
 * Do not assume that an entire named estate belongs to one quarter.
 */
export type QuarterAssignment = {
  quarterName: string;
  status: GeographyVerificationStatus;
  source: string;
  sourceRecord?: string;
  parcelId?: string;
  notes?: string;
};

export type EstateRecord = {
  id: string;
  geoid: string;
  estateCode: string;
  baseName: string;
  fullName: string;
  county: string;
  island: IslandCode;
  centroid: LngLat;
  internalPoint: LngLat;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  aliases?: string[];
  historicalAliases?: string[];
  historicalNotes?: string[];
  sources?: string[];
  roadContext?: EstateRoadContext;
  description: EstateDescription;

  /**
   * Verified legal/historical quarter relationships. More than one assignment
   * is allowed because quarter identity can depend on the parcel or place.
   */
  quarterAssignments?: QuarterAssignment[];

  /** Passenger-facing mobility records may live inside a Census estate. */
  recordKind?: MobilityRecordKind;
  parentEstateGeoid?: string;
  parentEstateName?: string;

  /** Fare identity is deliberately separate from physical geography. */
  tariffEndpointName?: string;
  tariffResolution?: TariffResolution;

  /** Human-readable provenance for coordinates and estate assignment. */
  spatialVerification?: {
    status: GeographyVerificationStatus;
    coordinateSource: string;
    estateSource?: string;
    quarterSource?: string;
    notes?: string;
  };
};

export type RouteQuote = {
  from: EstateRecord;
  to: EstateRecord;
  total: number;
} & (
  | {
      pricingModel: "official_usvi_taxi_tariff";
      tariffId: string;
      tariffVersion: string;
      rateRuleId: string;
    }
  | {
      /** @deprecated Compatibility only. Never present this value as a taxi fare. */
      distanceKm: number;
      /** @deprecated Unofficial legacy calculation. */
      baseFare: number;
      /** @deprecated Unofficial legacy calculation. */
      vehicleMultiplier: number;
      /** @deprecated Unofficial legacy calculation. */
      islandMultiplier: number;
    }
);
