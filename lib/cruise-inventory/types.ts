export const CRUISE_INVENTORY_PROVIDERS = [
  "disabled",
  "mock",
  "traveltek",
  "revelex",
] as const;

export const CRUISE_INVENTORY_STAGES = [
  "disabled",
  "commercial_access",
  "sandbox_credentials",
  "adapter_validation",
  "production_certification",
  "live",
] as const;

export type CruiseInventoryProviderId =
  (typeof CRUISE_INVENTORY_PROVIDERS)[number];
export type CruiseInventoryStage =
  (typeof CRUISE_INVENTORY_STAGES)[number];

export type CruiseInventoryCapabilities = {
  search: boolean;
  sailingDetails: boolean;
  cabinAvailability: boolean;
  livePricing: boolean;
  quote: boolean;
  reprice: boolean;
  hold: boolean;
  booking: boolean;
  retrieveBooking: boolean;
  cancelBooking: boolean;
  supplierPayments: boolean;
  webhooks: boolean;
};

export type CruiseInventoryReadiness = {
  provider: CruiseInventoryProviderId;
  stage: CruiseInventoryStage;
  environment: "development" | "preview" | "production" | "test";
  enabled: boolean;
  live: boolean;
  capabilities: CruiseInventoryCapabilities;
  configuredRequirements: string[];
  missingRequirements: string[];
  nextAction: string;
};

export type CruiseMoney = {
  amountCents: number;
  currency: string;
};

export type CruisePort = {
  id: string;
  name: string;
  city?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
};

export type CruisePortCall = {
  sequence: number;
  port: CruisePort;
  arrivesAt: string | null;
  departsAt: string | null;
  dayLabel: string;
};

export type CruiseLineSummary = {
  id: string;
  name: string;
  logoUrl?: string;
};

export type CruiseShipSummary = {
  id: string;
  name: string;
  imageUrl?: string;
};

export type CruiseCabinCategory = {
  id: string;
  code: string;
  name: string;
  type: "interior" | "oceanview" | "balcony" | "suite" | "other";
  description?: string;
  imageUrl?: string;
  deckNames?: string[];
  maximumOccupancy?: number;
  accessible?: boolean;
  startingFare?: CruiseMoney;
};

export type CruiseFareSummary = {
  fareCode?: string;
  fareName?: string;
  amount: CruiseMoney;
  taxesAndFees?: CruiseMoney;
  deposit?: CruiseMoney;
  taxesIncluded: boolean;
  refundable?: boolean;
  promotionNames?: string[];
};

export type CruiseSailing = {
  id: string;
  provider: Exclude<CruiseInventoryProviderId, "disabled">;
  supplierSailingId: string;
  cruiseLine: CruiseLineSummary;
  ship: CruiseShipSummary;
  departurePort: CruisePort;
  arrivalPort: CruisePort;
  departureDate: string;
  returnDate: string;
  nights: number;
  destinationNames: string[];
  itinerary: CruisePortCall[];
  leadFare: CruiseFareSummary | null;
  cabinCategories: CruiseCabinCategory[];
  lastVerifiedAt: string;
  liveVerified: boolean;
};

export type CruiseSearchRequest = {
  departureDateFrom: string;
  departureDateTo: string;
  departurePortIds?: string[];
  destinationNames?: string[];
  cruiseLineIds?: string[];
  nightsMinimum?: number;
  nightsMaximum?: number;
  adults: number;
  childAges: number[];
  currency: string;
  limit: number;
};

export type CruiseSearchResponse = {
  provider: Exclude<CruiseInventoryProviderId, "disabled">;
  live: boolean;
  searchedAt: string;
  results: CruiseSailing[];
};

export type CruiseCabinAvailabilityRequest = {
  sailingId: string;
  adults: number;
  childAges: number[];
  residencyCountryCode?: string;
  loyaltyNumbers?: Array<{
    cruiseLineId: string;
    number: string;
  }>;
  accessibleCabinRequired?: boolean;
  currency: string;
};

export type CruiseCabinAvailability = {
  sailingId: string;
  provider: Exclude<CruiseInventoryProviderId, "disabled">;
  verifiedAt: string;
  categories: Array<
    CruiseCabinCategory & {
      available: boolean;
      availableCount?: number;
      fares: CruiseFareSummary[];
    }
  >;
};

export type CruiseQuoteRequest = CruiseCabinAvailabilityRequest & {
  cabinCategoryId: string;
  fareCode?: string;
  travelerResidencies?: string[];
};

export type CruiseQuote = {
  id: string;
  provider: Exclude<CruiseInventoryProviderId, "disabled">;
  supplierQuoteId: string;
  sailingId: string;
  cabinCategoryId: string;
  fare: CruiseFareSummary;
  total: CruiseMoney;
  depositDue: CruiseMoney | null;
  depositDueAt: string | null;
  finalPaymentDueAt: string | null;
  expiresAt: string;
  termsSummary: string;
  liveVerifiedAt: string;
};

export type CruiseHoldRequest = {
  quoteId: string;
  travelers: CruiseTraveler[];
  clientReference: string;
};

export type CruiseTraveler = {
  type: "adult" | "child";
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  citizenshipCountryCode?: string;
  residencyCountryCode?: string;
};

export type CruiseHold = {
  id: string;
  provider: Exclude<CruiseInventoryProviderId, "disabled">;
  supplierHoldId: string;
  quoteId: string;
  status: "held" | "expired" | "released" | "confirmed";
  expiresAt: string;
};

export type CruiseBookingRequest = {
  holdId?: string;
  quoteId: string;
  travelers: CruiseTraveler[];
  customerEmail: string;
  customerPhone?: string;
  paymentMode: "supplier_hosted";
  clientReference: string;
  idempotencyKey: string;
};

export type CruiseBooking = {
  id: string;
  provider: Exclude<CruiseInventoryProviderId, "disabled">;
  supplierBookingId: string;
  cruiseLineConfirmationNumber: string | null;
  status:
    | "pending_payment"
    | "held"
    | "confirmed"
    | "cancelled"
    | "failed";
  supplierPaymentUrl: string | null;
  quoteId: string;
  bookedAt: string | null;
  updatedAt: string;
};

export type CruiseCancellationResult = {
  bookingId: string;
  status: "cancelled" | "pending_supplier" | "rejected";
  penalty: CruiseMoney | null;
  supplierReference: string | null;
};
