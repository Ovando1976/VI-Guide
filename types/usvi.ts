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
  roadContext?: EstateRoadContext;
  description: EstateDescription;
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
