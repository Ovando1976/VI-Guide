export type MobilityIsland = "stt" | "stj" | "stx" | "wat";

export type FareProvenanceType =
  | "vi_code_legacy"
  | "dpw_official"
  | "vipa_official"
  | "association_operational"
  | "secondary_published_sheet"
  | "manual_admin_entry";

export type ReviewStatus =
  | "verified_official"
  | "verified_operational"
  | "needs_review"
  | "legacy_only"
  | "superseded";

export type FareComputationMode =
  | "one_person_vs_two_plus_per_person"
  | "one_or_two_total_vs_three_plus_each"
  | "flat_trip_one_to_four"
  | "negotiated";

export type ServiceClass = "shared" | "private";

export type SourceRef = {
  label: string;
  sourceType: FareProvenanceType;
  citationUrl?: string;
  effectiveDate?: string;
  accessedAt: string;
  notes?: string;
};

export type TaxiZone = {
  id: string;
  island: MobilityIsland;
  slug: string;
  displayName: string;
  zoneType:
    | "town"
    | "airport"
    | "port"
    | "estate_area"
    | "hotel_cluster"
    | "landmark";
  aliases: string[];
  estateNames?: string[];
  dispatchAssociationId?: string;
  confidence?: number;
  source: SourceRef;
  reviewStatus: ReviewStatus;
};

export type TaxiFareRule = {
  id: string;
  island: MobilityIsland;
  originZoneId: string;
  destinationZoneId: string;
  computationMode: FareComputationMode;

  onePersonAmount?: number;
  twoPlusPerPersonAmount?: number;

  oneOrTwoPeopleTotalAmount?: number;
  threePlusPerPersonAmount?: number;

  flatTripAmount?: number;

  luggagePerBagAmount?: number;
  oversizeBagMaxAmount?: number;
  waitingPerMinuteAmount?: number;
  waitingGraceMinutes?: number;
  lateNightPerPersonAmount?: number;
  lateNightWindow?: { start: string; end: string };

  exclusivityRule?: "negotiated" | "pay_four_passengers" | "two_seat_minimum" | "none";

  serviceClass: ServiceClass | "either";
  source: SourceRef;
  reviewStatus: ReviewStatus;
};

export type TaxiQuoteRequest = {
  island: MobilityIsland;
  pickupName: string;
  dropoffName: string;
  passengers: number;
  luggage: number;
  serviceClass?: ServiceClass;
  departureTime?: string;
};

export type TaxiQuoteBreakdown = {
  ruleId?: string;
  pickupZoneId: string;
  dropoffZoneId: string;
  pickupZoneName: string;
  dropoffZoneName: string;
  baseFare: number;
  luggageTotal: number;
  lateNightTotal: number;
  exclusivityTotal: number;
  total: number;
  currency: "USD";
  reviewStatus: ReviewStatus;
  source: SourceRef;
  assumptions: string[];
};