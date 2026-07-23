import "server-only";

import {
  FieldValue,
  type DocumentReference,
} from "firebase-admin/firestore";
import type Stripe from "stripe";

import { getAdminDb } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";
import type {
  RideBooking,
  RideBookingRefundStatus,
} from "@/types/mobility";

const CANCELLABLE_STATUSES: RideBooking["status"][] = [
  "draft",
  "requested",
  "matched",
  "driver_en_route",
  "arrived",
  "in_progress",
];

const CANCELABLE_PAYMENT_INTENT_STATUSES: Stripe.PaymentIntent.Status[] = [
  "requires_payment_method",
  "requires_capture",
  "requires_confirmation",
  "requires_action",
  "processing",
];

export type CancellationActorRole =
  | "rider"
  | "driver"
  | "dispatcher"
  | "admin"
  | "system";

type CancellationTransactionResult = {
  booking: RideBooking;
  newlyCancelled: boolean;
};

export async function cancelBookingWithPaymentSafety(params: {
  bookingId: string;
  actorId: string;
  actorRole: CancellationActorRole;
  message: string;
}) {
  const db = getAdminDb();
  const bookingRef = db.collection("bookings").doc(params.bookingId);
  const eventRef = db.collection("tripEvents").doc();
  const operationRef = db.collection("cancellationOperations").doc();

  const transactionResult = await db.runTransaction<CancellationTransactionResult>(
    async (transaction): Promise<CancellationTransactionResult> => {
      const snapshot = await transaction.get(bookingRef);
      if (!snapshot.exists) throw new Error("Booking not found.");

      const booking = { id: snapshot.id, ...snapshot.data() } as RideBooking;
      if (booking.status === "cancelled") {
        return { booking, newlyCancelled: false };
      }
      if (!CANCELLABLE_STATUSES.includes(booking.status)) {
        throw new Error(
          `Trip cannot move from ${booking.status} to cancelled.`,
        );
      }
      if (params.actorRole === "rider" && booking.status === "in_progress") {
        throw new Error(
          "A rider cannot cancel through the app after the trip has started. Contact dispatch for assistance.",
        );
      }

      const capturedAmount = Math.max(0, Number(booking.amountCaptured ?? 0));
      const protectedPayment =
        booking.paymentStatus === "paid" ||
        booking.paymentStatus === "refunded" ||
        capturedAmount > 0;
      const refundStatus: RideBookingRefundStatus = protectedPayment
        ? "pending_review"
        : "not_required";
      const requestedAmount = protectedPayment
        ? capturedAmount || Math.max(0, Number(booking.amountAuthorized ?? 0))
        : 0;

      transaction.update(bookingRef, {
        status: "cancelled",
        cancelledAt: FieldValue.serverTimestamp(),
        cancellationReason: params.message,
        cancelledBy: params.actorId,
        cancelledByRole: params.actorRole,
        cancellationOperationId: operationRef.id,
        cancellationPaymentAction: protectedPayment
          ? "refund_review_required"
          : "none",
        refundStatus,
        refundRequestedAmount: requestedAmount || null,
        refundReason: protectedPayment ? params.message : null,
        refundRequestedAt: protectedPayment
          ? FieldValue.serverTimestamp()
          : FieldValue.delete(),
        settlementBlockedAt: FieldValue.serverTimestamp(),
        settlementBlockedReason: "Booking cancelled before settlement approval.",
        driverLocation: FieldValue.delete(),
        driverLocationUpdatedAt: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      if (booking.driverId) {
        transaction.update(db.collection("drivers").doc(booking.driverId), {
          availability: "available",
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      transaction.set(eventRef, {
        bookingId: params.bookingId,
        type: "trip_cancelled",
        actorType:
          params.actorRole === "dispatcher" ? "admin" : params.actorRole,
        actorId: params.actorId,
        message: params.message,
        fromStatus: booking.status,
        toStatus: "cancelled",
        refundStatus,
        refundRequestedAmount: requestedAmount || null,
        createdAt: FieldValue.serverTimestamp(),
      });

      transaction.set(operationRef, {
        bookingId: params.bookingId,
        actorId: params.actorId,
        actorRole: params.actorRole,
        status: "trip_cancelled",
        paymentIntentId: booking.paymentIntentId ?? null,
        paymentStatusAtCancellation: booking.paymentStatus ?? "unpaid",
        amountCapturedAtCancellation: capturedAmount,
        refundStatus,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const cancelledBooking: RideBooking = {
        ...booking,
        status: "cancelled",
        refundStatus,
        refundRequestedAmount: requestedAmount || null,
        cancellationPaymentAction: protectedPayment
          ? "refund_review_required"
          : "none",
      };
      return { booking: cancelledBooking, newlyCancelled: true };
    },
  );

  const cancelledBooking = transactionResult.booking;
  if (!transactionResult.newlyCancelled || !cancelledBooking.paymentIntentId) {
    return cancellationResult(cancelledBooking);
  }

  try {
    const stripe = getStripe();
    let paymentIntent = await stripe.paymentIntents.retrieve(
      cancelledBooking.paymentIntentId,
    );

    if (
      paymentIntent.status !== "canceled" &&
      CANCELABLE_PAYMENT_INTENT_STATUSES.includes(paymentIntent.status)
    ) {
      paymentIntent = await stripe.paymentIntents.cancel(paymentIntent.id, {
        cancellation_reason:
          params.actorRole === "rider" ? "requested_by_customer" : "abandoned",
      });
    }

    if (paymentIntent.status === "canceled") {
      const capturedAmount = Number(cancelledBooking.amountCaptured ?? 0);
      await Promise.all([
        bookingRef.update({
          paymentStatus: capturedAmount > 0 ? "paid" : "canceled",
          cancellationPaymentAction:
            capturedAmount > 0
              ? "refund_review_required"
              : "payment_intent_canceled",
          refundStatus:
            capturedAmount > 0 ? "pending_review" : "not_required",
          paymentUpdatedAt: FieldValue.serverTimestamp(),
          refundUpdatedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }),
        operationRef.update({
          status: "payment_intent_canceled",
          stripePaymentIntentStatus: paymentIntent.status,
          updatedAt: FieldValue.serverTimestamp(),
        }),
      ]);
    } else {
      await markCancellationForRefundReview({
        bookingRef,
        operationRef,
        paymentIntent,
        reason: params.message,
      });
    }
  } catch (error) {
    const reason =
      error instanceof Error
        ? error.message
        : "Stripe payment cancellation could not be confirmed.";
    await Promise.all([
      bookingRef.update({
        cancellationPaymentAction: "refund_review_required",
        refundStatus: "pending_review",
        refundReason: params.message,
        refundFailureReason: reason,
        refundRequestedAmount:
          Number(cancelledBooking.amountCaptured ?? 0) ||
          Number(cancelledBooking.amountAuthorized ?? 0) ||
          Math.round(Number(cancelledBooking.quotedFare?.total ?? 0) * 100),
        refundRequestedAt: FieldValue.serverTimestamp(),
        refundUpdatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }),
      operationRef.update({
        status: "payment_review_required",
        error: reason,
        updatedAt: FieldValue.serverTimestamp(),
      }),
    ]);
  }

  const latest = await bookingRef.get();
  return cancellationResult({
    id: latest.id,
    ...latest.data(),
  } as RideBooking);
}

async function markCancellationForRefundReview(params: {
  bookingRef: DocumentReference;
  operationRef: DocumentReference;
  paymentIntent: Stripe.PaymentIntent;
  reason: string;
}) {
  const capturedAmount = Math.max(0, params.paymentIntent.amount_received);
  const requestedAmount = capturedAmount || params.paymentIntent.amount;
  await Promise.all([
    params.bookingRef.update({
      paymentStatus:
        params.paymentIntent.status === "succeeded" ? "paid" : "processing",
      paymentIntentId: params.paymentIntent.id,
      amountAuthorized: params.paymentIntent.amount,
      amountCaptured: capturedAmount || null,
      cancellationPaymentAction: "refund_review_required",
      refundStatus: "pending_review",
      refundRequestedAmount: requestedAmount,
      refundReason: params.reason,
      refundRequestedAt: FieldValue.serverTimestamp(),
      refundUpdatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }),
    params.operationRef.update({
      status: "payment_review_required",
      stripePaymentIntentStatus: params.paymentIntent.status,
      refundRequestedAmount: requestedAmount,
      updatedAt: FieldValue.serverTimestamp(),
    }),
  ]);
}

function cancellationResult(booking: RideBooking) {
  return {
    bookingId: booking.id,
    status: booking.status,
    paymentStatus: booking.paymentStatus ?? "unpaid",
    refundStatus: booking.refundStatus ?? "not_required",
    refundRequestedAmount: booking.refundRequestedAmount ?? null,
    cancellationPaymentAction: booking.cancellationPaymentAction ?? "none",
  };
}
