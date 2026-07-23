import "server-only";

import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import type Stripe from "stripe";

import type {
  RideBooking,
  RideBookingPaymentStatus,
} from "@/types/mobility";

const STATUS_PRECEDENCE: Record<RideBookingPaymentStatus, number> = {
  unpaid: 0,
  requires_payment_method: 1,
  failed: 1,
  processing: 2,
  canceled: 3,
  paid: 4,
  refunded: 5,
};

export function paymentStatusFromStripe(
  paymentIntent: Stripe.PaymentIntent,
): RideBookingPaymentStatus {
  switch (paymentIntent.status) {
    case "succeeded":
      return "paid";
    case "processing":
      return "processing";
    case "canceled":
      return "canceled";
    case "requires_payment_method":
      return paymentIntent.last_payment_error
        ? "failed"
        : "requires_payment_method";
    case "requires_action":
    case "requires_confirmation":
      return "requires_payment_method";
    default:
      return "unpaid";
  }
}

export function expectedBookingAmountCents(booking: RideBooking) {
  const amount = Math.round(Number(booking.quotedFare?.total ?? 0) * 100);
  if (!Number.isSafeInteger(amount) || amount < 50) {
    throw new Error("The booking does not have a valid payable fare.");
  }
  return amount;
}

export function paymentIntentIdempotencyKey(booking: RideBooking) {
  const amount = expectedBookingAmountCents(booking);
  const quoteFingerprint = createHash("sha256")
    .update(
      [
        booking.id,
        booking.riderId,
        booking.island,
        amount,
        booking.quotedFare?.tariffId ?? "",
        booking.quotedFare?.tariffVersion ?? "",
        booking.quotedFare?.rateRuleId ?? "",
        booking.quotedFare?.matchedOrigin ?? "",
        booking.quotedFare?.matchedDestination ?? "",
      ].join("|"),
    )
    .digest("hex")
    .slice(0, 24);

  return `booking-payment-${booking.id}-${quoteFingerprint}`;
}

export function paymentIntentIntegrityIssue(
  paymentIntent: Stripe.PaymentIntent,
  booking: RideBooking,
): string | null {
  const expectedAmount = expectedBookingAmountCents(booking);
  if (paymentIntent.amount !== expectedAmount) {
    return "The Stripe amount does not match the booking fare.";
  }
  if (
    paymentIntent.status === "succeeded" &&
    paymentIntent.amount_received !== expectedAmount
  ) {
    return "The captured Stripe amount does not match the booking fare.";
  }
  if (paymentIntent.currency.toLowerCase() !== "usd") {
    return "The Stripe currency does not match the booking currency.";
  }
  if (paymentIntent.metadata.bookingId !== booking.id) {
    return "The Stripe booking reference does not match this booking.";
  }
  if (paymentIntent.metadata.riderId !== booking.riderId) {
    return "The Stripe rider reference does not match this booking.";
  }
  if (paymentIntent.metadata.island !== booking.island) {
    return "The Stripe island reference does not match this booking.";
  }
  if (paymentIntent.metadata.product !== "taxi_booking") {
    return "The Stripe product reference is invalid for this booking.";
  }
  if (paymentIntent.metadata.tariffId !== booking.quotedFare?.tariffId) {
    return "The Stripe tariff reference does not match the booking quote.";
  }
  if (
    paymentIntent.metadata.tariffVersion !== booking.quotedFare?.tariffVersion
  ) {
    return "The Stripe tariff version does not match the booking quote.";
  }
  if (paymentIntent.metadata.rateRuleId !== booking.quotedFare?.rateRuleId) {
    return "The Stripe fare rule does not match the booking quote.";
  }
  return null;
}

export function hasIrreversiblePaymentProtection(booking: RideBooking) {
  return Boolean(
    booking.status === "cancelled" ||
      booking.status === "completed" ||
      booking.paymentStatus === "refunded" ||
      booking.cancellationStatus === "processing" ||
      booking.cancellationStatus === "review_required" ||
      (booking.refund && booking.refund.status !== "not_required") ||
      (booking.dispute &&
        !["prevented", "warning_closed"].includes(booking.dispute.status)) ||
      booking.unexpectedCapturedPaymentIntentId,
  );
}

export function canReconcilePaymentIntegrity(booking: RideBooking) {
  return Boolean(
    booking.paymentIntegrityStatus === "review_required" &&
      !hasIrreversiblePaymentProtection(booking) &&
      (!booking.financialHoldStatus ||
        booking.financialHoldStatus === "none" ||
        booking.financialHoldStatus === "manual_review"),
  );
}

export function paymentWorkflowBlockReason(booking: RideBooking) {
  if (booking.status === "cancelled") {
    return "This ride is cancelled and cannot accept another payment.";
  }
  if (booking.status === "completed") {
    return "This completed ride cannot accept another payment.";
  }
  if (booking.paymentStatus === "refunded") {
    return "This ride has been refunded and cannot accept another payment.";
  }
  if (
    booking.cancellationStatus === "processing" ||
    booking.cancellationStatus === "review_required"
  ) {
    return "Cancellation is processing or under review. Do not submit another payment.";
  }
  if (booking.refund && booking.refund.status !== "not_required") {
    return `A refund is ${booking.refund.status.replaceAll("_", " ")} for this ride. Do not submit another payment.`;
  }
  if (
    booking.dispute &&
    !["prevented", "warning_closed"].includes(booking.dispute.status)
  ) {
    return "This payment has a dispute record and cannot be charged again.";
  }
  if (booking.unexpectedCapturedPaymentIntentId) {
    return "An unexpected captured payment requires staff review. Do not submit another payment.";
  }
  if (
    booking.financialHoldStatus &&
    booking.financialHoldStatus !== "none"
  ) {
    return `This payment is protected by a ${booking.financialHoldStatus.replaceAll("_", " ")} hold.`;
  }
  if (booking.paymentIntegrityStatus === "review_required") {
    return "This payment requires staff review before any additional payment action.";
  }
  return null;
}

export function shouldApplyStripeEvent(params: {
  currentStatus?: RideBookingPaymentStatus;
  currentEventCreated?: number;
  nextStatus: RideBookingPaymentStatus;
  eventCreated: number;
}) {
  const currentStatus = params.currentStatus ?? "unpaid";
  const currentEventCreated = Number(params.currentEventCreated ?? 0);

  if (currentStatus === "refunded") return false;
  if (currentStatus === "paid" && params.nextStatus !== "paid") return false;
  if (params.eventCreated < currentEventCreated) return false;
  if (params.eventCreated > currentEventCreated) return true;

  return STATUS_PRECEDENCE[params.nextStatus] >= STATUS_PRECEDENCE[currentStatus];
}

export function bookingPaymentUpdate(params: {
  paymentIntent: Stripe.PaymentIntent;
  existingAmountCaptured?: number | null;
  event?: Stripe.Event;
  source: "webhook" | "reconciliation" | "payment_intent_api";
}) {
  const paymentStatus = paymentStatusFromStripe(params.paymentIntent);
  const amountCaptured =
    params.paymentIntent.status === "succeeded"
      ? params.paymentIntent.amount_received
      : (params.existingAmountCaptured ?? null);

  return {
    paymentStatus,
    paymentIntentId: params.paymentIntent.id,
    amountAuthorized: params.paymentIntent.amount,
    amountCaptured,
    paymentFailureCode:
      params.paymentIntent.last_payment_error?.code ?? null,
    paymentFailureMessage:
      params.paymentIntent.last_payment_error?.message ?? null,
    paymentIntegrityStatus: "verified",
    paymentIntegrityIssue: null,
    paymentStateSource: params.source,
    ...(params.event
      ? {
          paymentEventId: params.event.id,
          paymentEventType: params.event.type,
          paymentEventCreated: params.event.created,
        }
      : { paymentReconciledAt: FieldValue.serverTimestamp() }),
    paymentUpdatedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}
