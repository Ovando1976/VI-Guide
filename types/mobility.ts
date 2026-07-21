import type { IslandCode } from "@/types/usvi";

export type RideMode =
  | "standard"
  | "premium"
  | "shared"
  | "safari"
  | "airport"
  | "ferry-transfer"
  | "tour"
  | "delivery"
  | "executive";

export type BookingStatus =
  | "draft"
  | "requested"
  | "matched"
  | "driver_en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export type RideBookingPaymentStatus =
  | "unpaid"
  | "requires_payment_method"
  | "processing"
  | "paid"
  | "failed"
  | "canceled";

export type PickupContext = {
  lat: number;
  lng: number;
  estateGeoid: string;
  estateName: string;
  notes?: string;
  pickupConfidence: number;
  accessType: "roadside" | "villa" | "beach" | "airport" | "ferry" | "resort";
};

export type FareBreakdown = {
  pricingModel: "official_usvi_taxi_tariff";
  quoteStatus: "official";
  currency: "USD";
  tariffId: string;
  tariffTitle: string;
  tariffVersion: string;
  tariffSourceUrl: string;
  tariffEffectiveAt: string;
  rateRuleId: string;
  matchedOrigin: string;
  matchedDestination: string;
  routeFare: number;
  passengerFare: number;
  luggageFare: number;
  authorizedAdditionalCharges: number;
  total: number;
  ruleNotes?: string;
};

export type RideBookingDraft = {
  originEstateGeoid: string;
  destinationEstateGeoid: string;
  mode: RideMode;
  passengers: number;
  luggage: number;
  scheduledAt?: string | null;
  notes?: string;
};

export type DriverLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  driverId?: string;
  recordedAt: string;
};

export type RideBooking = {
  id: string;
  riderId: string;
  driverId?: string;
  associationId?: string | null;
  vehicleId?: string | null;
  status: BookingStatus;
  paymentStatus?: RideBookingPaymentStatus;
  paymentIntentId?: string | null;
  amountAuthorized?: number | null;
  amountCaptured?: number | null;
  mode: RideMode;
  island: IslandCode;
  origin: PickupContext;
  destination: PickupContext;
  passengers: number;
  luggage: number;
  quotedFare: FareBreakdown;
  driverLocation?: DriverLocation;
  driverLocationUpdatedAt?: string | { seconds?: number; nanoseconds?: number };
  assignmentComplianceSnapshot?: {
    driverAuthorizationStatus: string;
    associationStatus: string;
    vehicleInspectionStatus: string;
    vehicleInsuranceStatus: string;
    verifiedAt: string;
  };
  finalFare?: number;
  scheduledAt?: string | null;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  payout?: {
    grossFare: number;
    commissionRate: number;
    platformRevenue: number;
    driverPayout: number;
  };
  settlement?: {
    status: "pending_review" | "approved" | "paid" | "failed";
    grossFare: number;
    serviceFee?: number;
    operatorSettlement?: number;
    feeAgreementId?: string;
  };
};
