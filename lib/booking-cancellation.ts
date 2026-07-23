import "server-only";

import {
  FieldValue,
  type DocumentData,
  type UpdateData,
} from "firebase-admin/firestore";

import {
  expectedBookingAmountCents,
  paymentIntentIntegrityIssue,
} from "@/lib/booking-payment-state";
import { getAdminDb } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";
import type {
  BookingFinancialHoldStatus,
  BookingRefundStatus,
  RideBooking,
  RideBookingPaymentStatus,
} from "@/types/mobility";

const CANCELLABLE_STATUSES: RideBooking["status"][] = [
  "draft",
  "requested",
  "matched",
  "driver_en_route",
  "arrived",
];

type CancellationActorType = "rider" | "driver" | "admin" | "system";

type CancellationResolution = {
  paymentStatus: RideBookingPaymentStatus;
  financialHoldStatus: BookingFinancialHoldStatus;
  cancellationStatus: "completed" | "review_required";
  refund: NonNullable<RideBooking["refund"]>;
  paymentIntentAction:
    | "none"
    | "canceled"
    | "refund_created"
    | "review_required";
  reviewIssue?: string | null;
};

export async function cancelBookingWithFinancialResolution(params: {
  bookingId: string;
  actorType: CancellationActorType;
  actorId: string;
  reasonCode: string;
  reason: string;
}) {
  const db = getAdminDb();
  const bookingRef = db.collection("bookings").doc(params.bookingId);
  const operationId = `cancel_${params.bookingId}`;
  const operationRef = db.collection("bookingFinancialOperations").doc(operationId);

  const reserved = await db.runTransaction(async (transaction) => {
    const [bookingSnapshot, operationSnapshot] = await Promise.all([
      transaction.get(bookingRef),
      transaction.get(operationRef),
    ]);

    if (!bookingSnapshot.exists) throw new Error("Booking not found.");
    const booking = {
      id: bookingSnapshot.id,
      ...bookingSnapshot.data(),
    } as RideBooking;

    if (booking.status === "cancelled") {
      return { booking, alreadyCancelled: true };
    }
    if (!CANCELLABLE_STATUSES.includes(booking.status)) {
      throw new Error("This ride can no longer be cancelled automatically.");
    }

    if (!operationSnapshot.exists) {
      transaction.create(operationRef, {
        operationId,
        type: "booking_cancellation",
        bookingId: booking.id,
        actorType: params.actorType,
        actorId: params.actorId,
        reasonCode: params.reasonCode,
        reason: params.reason,
        status: "processing",
        attempts: 1,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      transaction.update(operationRef, {
        attempts: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.update(bookingRef, {
      cancellationOperationId: operationId,
      cancellationStatus: "processing",
      cancellationReasonCode: params.reasonCode,
      cancellationReason: params.reason,
      cancellationActorType: params.actorType,
      cancellationActorId: params.actorId,
      cancellationRequestedAt: FieldValue.serverTimestamp(),
      financialHoldStatus: "cancellation_processing",
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { booking, alreadyCancelled: false };
  });

  if (reserved.alreadyCancelled) {
    return {
      bookingId: reserved.booking.id,
      status: "cancelled" as const,
      alreadyCancelled: true,
      refund: reserved.booking.refund ?? null,
      financialHoldStatus: reserved.booking.financialHoldStatus ?? "none",
    };
  }

  let resolution: CancellationResolution;
  try {
    resolution = await resolveCancellationPayment({
      booking: reserved.booking,
      operationId,
      actorType: params.actorType,
    });
  } catch (error) {
    const issue =
      error instanceof Error
        ? error.message
        : "The cancellation payment could not be resolved automatically.";
    resolution = reviewResolution(reserved.booking, operationId, issue);
  }

  const eventRef = db.collection("tripEvents").doc();
  const finalization = await db.runTransaction(async (transaction) => {
    const currentSnapshot = await transaction.get(bookingRef);
    if (!currentSnapshot.exists) throw new Error("Booking not found.");
    const current = {
      id: currentSnapshot.id,
      ...currentSnapshot.data(),
    } as RideBooking;

    if (
      current.status !== "cancelled" &&
      !CANCELLABLE_STATUSES.includes(current.status)
    ) {
      const conflictIssue =
        "The trip advanced after cancellation was reserved and requires staff review.";
      transaction.update(operationRef, {
        status: "review_required",
        failureReason: conflictIssue,
        reviewIssue: conflictIssue,
        financialHoldStatus: "manual_review",
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(bookingRef, {
        cancellationStatus: "review_required",
        financialHoldStatus: "manual_review",
        paymentIntegrityStatus: "review_required",
        paymentIntegrityIssue: conflictIssue,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { advancedConflict: true };
    }

    if (current.status !== "cancelled") {
      const update: UpdateData<DocumentData> = {
        status: "cancelled",
        paymentStatus: resolution.paymentStatus,
        financialHoldStatus: resolution.financialHoldStatus,
        cancellationStatus: resolution.cancellationStatus,
        cancellationResolvedAt: FieldValue.serverTimestamp(),
        cancelledAt: FieldValue.serverTimestamp(),
        refund: {
          ...resolution.refund,
          updatedAt: FieldValue.serverTimestamp(),
        },
        settlement: {
          status: "void",
          grossFare: 0,
          serviceFee: 0,
          operatorSettlement: 0,
          feeAgreementId: current.settlement?.feeAgreementId ?? null,
          holdReason:
            resolution.financialHoldStatus === "none"
              ? "Ride cancelled before trip start."
              : `Ride cancelled; ${resolution.financialHoldStatus.replaceAll("_", " ")}.`,
        },
        payout: FieldValue.delete(),
        driverLocation: FieldValue.delete(),
        driverLocationUpdatedAt: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (resolution.reviewIssue) {
        update.paymentIntegrityStatus = "review_required";
        update.paymentIntegrityIssue = resolution.reviewIssue;
      }

      transaction.update(bookingRef, update);
      if (current.driverId) {
        transaction.update(db.collection("drivers").doc(current.driverId), {
          availability: "available",
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      transaction.set(eventRef, {
        bookingId: current.id,
        type: "trip_cancelled",
        actorType: params.actorType,
        actorId: params.actorId,
        message: params.reason,
        fromStatus: current.status,
        toStatus: "cancelled",
        cancellationOperationId: operationId,
        paymentIntentAction: resolution.paymentIntentAction,
        refundStatus: resolution.refund.status,
        financialHoldStatus: resolution.financialHoldStatus,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.set(
      operationRef,
      {
        status:
          resolution.cancellationStatus === "review_required"
            ? "review_required"
            : "completed",
        paymentIntentAction: resolution.paymentIntentAction,
        paymentStatus: resolution.paymentStatus,
        refundId: resolution.refund.id ?? null,
        refundStatus: resolution.refund.status,
        refundAmount: resolution.refund.amount,
        financialHoldStatus: resolution.financialHoldStatus,
        reviewIssue: resolution.reviewIssue ?? null,
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { advancedConflict: false };
  });

  if (finalization.advancedConflict) {
    throw new Error(
      "The trip advanced while cancellation was processing. Staff review is required.",
    );
  }

  return {
    bookingId: params.bookingId,
    status: "cancelled" as const,
    alreadyCancelled: false,
    refund: resolution.refund,
    financialHoldStatus: resolution.financialHoldStatus,
    reviewRequired: resolution.cancellationStatus === "review_required",
  };
}

async function resolveCancellationPayment(params: {
  booking: RideBooking;
  operationId: string;
  actorType: CancellationActorType;
}): Promise<CancellationResolution> {
  const booking = params.booking;
  const expectedAmount = safeExpectedAmount(booking);
  const existingCaptured = Number(booking.amountCaptured ?? 0);

  if (!booking.paymentIntentId) {
    if (booking.paymentStatus === "paid" || existingCaptured > 0) {
      return reviewResolution(
        booking,
        params.operationId,
        "The booking is paid or captured without a Stripe PaymentIntent reference.",
      );
    }
    return noRefundResolution(booking.paymentStatus ?? "unpaid", params.operationId);
  }

  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.retrieve(
    booking.paymentIntentId,
  );

  let integrityIssue: string | null = null;
  try {
    integrityIssue = paymentIntentIntegrityIssue(paymentIntent, booking);
  } catch (error) {
    integrityIssue =
      error instanceof Error
        ? error.message
        : "The payment could not be validated against the booking.";
  }
  if (integrityIssue) {
    return reviewResolution(booking, params.operationId, integrityIssue);
  }

  if (paymentIntent.status === "succeeded") {
    if (paymentIntent.amount_received !== expectedAmount) {
      return reviewResolution(
        booking,
        params.operationId,
        "The captured amount does not equal the booking fare.",
      );
    }

    const refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntent.id,
        reason: "requested_by_customer",
        metadata: {
          bookingId: booking.id,
          operationId: params.operationId,
          actorType: params.actorType,
          product: "taxi_booking_cancellation",
        },
      },
      {
        idempotencyKey: `booking-refund-${booking.id}-${paymentIntent.id}-${expectedAmount}`,
      },
    );
    const refundStatus = normalizeRefundStatus(refund.status);
    const succeeded = refundStatus === "succeeded";
    const pending = refundStatus === "pending";

    return {
      paymentStatus: succeeded ? "refunded" : "paid",
      financialHoldStatus: succeeded
        ? "none"
        : pending
          ? "refund_pending"
          : "refund_review",
      cancellationStatus:
        succeeded || pending ? "completed" : "review_required",
      paymentIntentAction: "refund_created",
      refund: {
        id: refund.id,
        status: refundStatus,
        amount: refund.amount,
        currency: "usd",
        reason: "Ride cancelled before trip start.",
        operationId: params.operationId,
        failureReason: refund.failure_reason ?? null,
        requestedAt: new Date().toISOString(),
      },
      reviewIssue:
        succeeded || pending
          ? null
          : refund.failure_reason || "Stripe did not accept the refund automatically.",
    };
  }

  if (paymentIntent.amount_received > 0 || existingCaptured > 0) {
    return reviewResolution(
      booking,
      params.operationId,
      "Stripe reports a non-final payment with captured funds.",
    );
  }

  if (paymentIntent.status !== "canceled") {
    await stripe.paymentIntents.cancel(
      paymentIntent.id,
      { cancellation_reason: "requested_by_customer" },
      {
        idempotencyKey: `booking-payment-cancel-${booking.id}-${paymentIntent.id}`,
      },
    );
  }

  return {
    paymentStatus: "canceled",
    financialHoldStatus: "none",
    cancellationStatus: "completed",
    paymentIntentAction: "canceled",
    refund: {
      id: null,
      status: "not_required",
      amount: 0,
      currency: "usd",
      reason: "PaymentIntent canceled before capture.",
      operationId: params.operationId,
      requestedAt: new Date().toISOString(),
    },
  };
}

function noRefundResolution(
  paymentStatus: RideBookingPaymentStatus,
  operationId: string,
): CancellationResolution {
  return {
    paymentStatus,
    financialHoldStatus: "none",
    cancellationStatus: "completed",
    paymentIntentAction: "none",
    refund: {
      id: null,
      status: "not_required",
      amount: 0,
      currency: "usd",
      reason: "No captured payment required a refund.",
      operationId,
      requestedAt: new Date().toISOString(),
    },
  };
}

function reviewResolution(
  booking: RideBooking,
  operationId: string,
  issue: string,
): CancellationResolution {
  return {
    paymentStatus:
      booking.paymentStatus === "refunded"
        ? "refunded"
        : booking.paymentStatus === "paid" || Number(booking.amountCaptured ?? 0) > 0
          ? "paid"
          : (booking.paymentStatus ?? "unpaid"),
    financialHoldStatus: "refund_review",
    cancellationStatus: "review_required",
    paymentIntentAction: "review_required",
    refund: {
      id: booking.refund?.id ?? null,
      status: "review_required",
      amount: Number(booking.amountCaptured ?? 0),
      currency: "usd",
      reason: "Cancellation requires staff financial review.",
      operationId,
      failureReason: issue,
      requestedAt: new Date().toISOString(),
    },
    reviewIssue: issue,
  };
}

function safeExpectedAmount(booking: RideBooking) {
  try {
    return expectedBookingAmountCents(booking);
  } catch {
    return Math.max(0, Number(booking.amountCaptured ?? 0));
  }
}

function normalizeRefundStatus(status: string | null): BookingRefundStatus {
  switch (status) {
    case "succeeded":
      return "succeeded";
    case "pending":
      return "pending";
    case "failed":
      return "failed";
    case "canceled":
      return "canceled";
    default:
      return "review_required";
  }
}
