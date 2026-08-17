import type { IntelligenceIsland } from "@/types/intelligence";

export type CommerceBookingKind = "accommodation" | "tour" | "experience";

export type CommerceBookingStatus =
  | "draft"
  | "requested"
  | "reviewing"
  | "payment_required"
  | "paid"
  | "confirmed"
  | "completed"
  | "declined"
  | "cancelled";

export type CommercePaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "refund_pending"
  | "refunded"
  | "refund_failed";

export type CommerceRefundStatus =
  | "not_requested"
  | "processing"
  | "succeeded"
  | "failed"
  | "review_required";

export type CommerceCancellationPolicyCode =
  | "flexible"
  | "standard"
  | "strict";

export type CommerceCancellationPolicy = {
  code: CommerceCancellationPolicyCode;
  title: string;
  travelerTerms: string;
  providerTerms: string;
  changeTerms: string;
  fullRefundCutoffHours: number;
  partialRefundCutoffHours: number | null;
  partialRefundPercent: number | null;
  verifiedAt: string;
};

export type CommerceCancellationRequestStatus =
  | "not_requested"
  | "review_required"
  | "completed";

export type CommercePriceBreakdown = {
  currency: "USD";
  baseCents: number;
  taxesCents: number;
  serviceFeesCents: number;
  propertyFeesCents: number;
  transportCents: number;
  otherMandatoryFeesCents: number;
  totalCents: number;
  verifiedAt: string;
};

export type CommerceBookingRequest = {
  kind: CommerceBookingKind;
  listingId: string;
  listingName: string;
  listingHref?: string;
  offerId?: string;
  sourceProposalShareId?: string;
  analyticsSessionId?: string;
  analyticsSource?: string;
  itineraryId?: string;
  island: IntelligenceIsland;
  startDate: string;
  endDate?: string;
  preferredTime?: string;
  adults: number;
  children: number;
  guestName: string;
  email: string;
  phone?: string;
  notes?: string;
};

export type CommerceBooking = CommerceBookingRequest & {
  id: string;
  status: CommerceBookingStatus;
  reference: string;
  offerTitle?: string;
  offerPriceCents?: number;
  offerCompareAtCents?: number | null;
  offerDepositCents?: number | null;
  depositAmountCents?: number;
  paidAmountCents?: number;
  priceBreakdown?: CommercePriceBreakdown;
  cancellationPolicy?: CommerceCancellationPolicy;
  cancellationRequestStatus?: CommerceCancellationRequestStatus;
  cancellationReasonCode?: string;
  cancellationReason?: string;
  cancellationRequestedAt?: string;
  cancellationResolvedAt?: string;
  cancellationRefundEstimateCents?: number;
  paymentStatus?: CommercePaymentStatus;
  paymentHref?: string;
  checkoutSessionId?: string;
  paymentIntentId?: string;
  paidAt?: string;
  refundStatus?: CommerceRefundStatus;
  refundId?: string;
  refundOperationId?: string;
  refundAmountCents?: number;
  refundReason?: string;
  refundFailureReason?: string;
  refundRequestedAt?: string;
  refundUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
};