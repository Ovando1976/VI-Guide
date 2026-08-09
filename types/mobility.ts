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
  | "refunded"
  | "failed"
  | "canceled";

export type BookingRefundStatus =
  | "not_required"
  | "pending"
  | "succeeded"
  | "failed"
  | "canceled"
  | "review_required";

export type BookingFinancialHoldStatus =
  | "none"
  | "cancellation_processing"
  | "refund_pending"
  | "refund_review"
  | "dispute_open"
  | "dispute_lost"
  | "manual_review";

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
  connectionDeadline?: string | null;
  connectionKind?: "flight" | "ferry" | "cruise" | "appointment" | null;
  paymentMethod?: "online_card";
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

export type TimestampLike =
  | string
  | { seconds?: number; nanoseconds?: number }
  | { toDate?: () => Date };

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
  paymentExpectedAmount?: number | null;
  paymentQuoteTariffId?: string | null;
  paymentQuoteTariffVersion?: string | null;
  paymentIntegrityStatus?: "verified" | "review_required";
  paymentIntegrityIssue?: string | null;
  financialHoldStatus?: BookingFinancialHoldStatus;
  unexpectedCapturedPaymentIntentId?: string | null;
  unexpectedCapturedAmount?: number | null;
  unexpectedCapturedAt?: TimestampLike;
  paymentStateSource?: "webhook" | "reconciliation" | "payment_intent_api";
  paymentEventId?: string | null;
  paymentEventType?: string | null;
  paymentEventCreated?: number | null;
  paymentFailureCode?: string | null;
  paymentFailureMessage?: string | null;
  paymentInitializedAt?: TimestampLike;
  paymentReconciledAt?: TimestampLike;
  paymentUpdatedAt?: TimestampLike;
  cancellationOperationId?: string | null;
  cancellationStatus?: "processing" | "completed" | "review_required";
  cancellationReasonCode?: string | null;
  cancellationReason?: string | null;
  cancellationActorType?: "rider" | "driver" | "admin" | "system";
  cancellationActorId?: string | null;
  cancellationRequestedAt?: TimestampLike;
  cancellationResolvedAt?: TimestampLike;
  refund?: {
    id?: string | null;
    status: BookingRefundStatus;
    amount: number;
    currency: "usd";
    reason?: string | null;
    operationId?: string | null;
    failureReason?: string | null;
    requestedAt?: TimestampLike;
    updatedAt?: TimestampLike;
  };
  dispute?: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    reason?: string | null;
    evidenceDueBy?: number | null;
    fundsReinstated?: boolean;
    createdAt?: TimestampLike;
    updatedAt?: TimestampLike;
  };
  mode: RideMode;
  island: IslandCode;
  origin: PickupContext;
  destination: PickupContext;
  passengers: number;
  luggage: number;
  quotedFare: FareBreakdown;
  driverLocation?: DriverLocation;
  driverLocationUpdatedAt?: TimestampLike;
  assignmentComplianceSnapshot?: {
    driverAuthorizationStatus: string;
    associationStatus: string;
    vehicleInspectionStatus: string;
    vehicleInsuranceStatus: string;
    verifiedAt: string;
  };
  finalFare?: number;
  scheduledAt?: string | null;
  connectionDeadline?: string | null;
  connectionKind?: "flight" | "ferry" | "cruise" | "appointment" | null;
  paymentMethod?: "online_card";
  serviceExpectation?: "shared" | "direct_request";
  estimatedSettlement?: {
    grossFare: number;
    commissionRate: number;
    platformRevenue: number;
    driverPayout: number;
    feeAgreementId: string;
  };
  riderVerification?: {
    status: "required" | "verified";
    verifiedAt?: TimestampLike;
    verifiedBy?: string | null;
  };
  notes?: string;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  matchedAt?: TimestampLike;
  driverEnRouteAt?: TimestampLike;
  arrivedAt?: TimestampLike;
  startedAt?: TimestampLike;
  completedAt?: TimestampLike;
  cancelledAt?: TimestampLike;
  payout?: {
    grossFare: number;
    commissionRate: number;
    platformRevenue: number;
    driverPayout: number;
  };
  settlement?: {
    status: "pending_review" | "held" | "approved" | "paid" | "void" | "failed";
    grossFare: number;
    serviceFee?: number;
    operatorSettlement?: number;
    feeAgreementId?: string;
    holdReason?: string | null;
    reviewReference?: string | null;
    approvedBy?: string | null;
    approvedAt?: TimestampLike;
    paidAmountCents?: number | null;
    externalPaymentReference?: string | null;
    externalPaymentMethod?: "ach" | "bank_transfer" | "cash" | "check" | "other" | null;
    paymentNote?: string | null;
    paidBy?: string | null;
    paidAt?: TimestampLike;
  };
};
