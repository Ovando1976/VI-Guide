import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import type Stripe from "stripe";

import {
  bookingPaymentUpdate,
  paymentIntentIntegrityIssue,
  paymentStatusFromStripe,
  shouldApplyStripeEvent,
} from "@/lib/booking-payment-state";
import { getAdminDb } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";
import type {
  RideBooking,
  RideBookingRefundStatus,
} from "@/types/mobility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPaymentIntentEvent(
  event: Stripe.Event,
): event is Stripe.Event & { data: { object: Stripe.PaymentIntent } } {
  return event.type.startsWith("payment_intent.");
}

function isRefundEvent(
  event: Stripe.Event,
): event is Stripe.Event & { data: { object: Stripe.Refund } } {
  return event.type.startsWith("refund.");
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 503 },
    );
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  } catch (error) {
    console.error("stripe webhook signature error", error);
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 },
    );
  }

  try {
    if (isPaymentIntentEvent(event)) {
      await handlePaymentIntentEvent(event);
      return NextResponse.json({ received: true });
    }
    if (isRefundEvent(event)) {
      await handleRefundEvent(event);
      return NextResponse.json({ received: true });
    }
    return NextResponse.json({ received: true, ignored: true });
  } catch (error) {
    console.error("stripe webhook processing error", error);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}

async function handlePaymentIntentEvent(
  event: Stripe.Event & { data: { object: Stripe.PaymentIntent } },
) {
  const paymentIntent = event.data.object;
  const bookingId = paymentIntent.metadata.bookingId?.trim();
  if (!bookingId) return;

  const db = getAdminDb();
  const bookingRef = db.collection("bookings").doc(bookingId);
  const eventRef = db.collection("stripeWebhookEvents").doc(event.id);

  await db.runTransaction(async (transaction) => {
    const eventSnapshot = await transaction.get(eventRef);
    if (eventSnapshot.exists) return;

    const bookingSnapshot = await transaction.get(bookingRef);
    if (!bookingSnapshot.exists) {
      transaction.set(eventRef, {
        type: event.type,
        bookingId,
        paymentIntentId: paymentIntent.id,
        outcome: "booking_not_found",
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const booking = {
      id: bookingSnapshot.id,
      ...bookingSnapshot.data(),
    } as RideBooking;
    const capturedAfterCancellation =
      booking.status === "cancelled" && paymentIntent.status === "succeeded";
    const refundHold = capturedAfterCancellation
      ? cancellationRefundHold(paymentIntent, booking)
      : {};

    const existingIntentId = booking.paymentIntentId;
    if (existingIntentId && existingIntentId !== paymentIntent.id) {
      const captured = paymentIntent.status === "succeeded";
      const mismatchIssue = captured
        ? "A second unexpected Stripe PaymentIntent captured funds for this booking."
        : "A Stripe event referenced a different PaymentIntent than the booking record.";

      if (captured) {
        transaction.update(bookingRef, {
          paymentStatus: "paid",
          paymentIntegrityStatus: "review_required",
          paymentIntegrityIssue: mismatchIssue,
          unexpectedCapturedPaymentIntentId: paymentIntent.id,
          unexpectedCapturedAmount: paymentIntent.amount_received,
          unexpectedCapturedAt: FieldValue.serverTimestamp(),
          paymentStateSource: "webhook",
          paymentEventId: event.id,
          paymentEventType: event.type,
          paymentEventCreated: event.created,
          paymentUpdatedAt: FieldValue.serverTimestamp(),
          ...refundHold,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      transaction.set(eventRef, {
        type: event.type,
        bookingId,
        paymentIntentId: paymentIntent.id,
        existingPaymentIntentId: existingIntentId,
        outcome: captured
          ? "unexpected_captured_payment_intent"
          : "payment_intent_mismatch",
        integrityIssue: mismatchIssue,
        paymentStatus: captured ? "paid" : booking.paymentStatus ?? "unpaid",
        refundStatus: capturedAfterCancellation ? "pending_review" : null,
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    let integrityIssue: string | null = null;
    try {
      integrityIssue = paymentIntentIntegrityIssue(paymentIntent, booking);
    } catch (error) {
      integrityIssue =
        error instanceof Error
          ? error.message
          : "The booking fare could not be validated.";
    }
    if (integrityIssue) {
      const captured = paymentIntent.status === "succeeded";
      transaction.update(bookingRef, {
        ...(captured
          ? bookingPaymentUpdate({
              paymentIntent,
              existingAmountCaptured: booking.amountCaptured,
              event,
              source: "webhook",
            })
          : {
              paymentIntentId: paymentIntent.id,
              amountAuthorized: paymentIntent.amount,
              paymentStateSource: "webhook",
              paymentEventId: event.id,
              paymentEventType: event.type,
              paymentEventCreated: event.created,
              paymentUpdatedAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            }),
        paymentIntegrityStatus: "review_required",
        paymentIntegrityIssue: integrityIssue,
        ...refundHold,
      });
      transaction.set(eventRef, {
        type: event.type,
        bookingId,
        paymentIntentId: paymentIntent.id,
        outcome: captured
          ? "captured_payment_requires_review"
          : "payment_integrity_mismatch",
        integrityIssue,
        paymentStatus: captured ? "paid" : booking.paymentStatus ?? "unpaid",
        refundStatus: capturedAfterCancellation ? "pending_review" : null,
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const nextStatus = paymentStatusFromStripe(paymentIntent);
    const shouldApply = shouldApplyStripeEvent({
      currentStatus: booking.paymentStatus,
      currentEventCreated: booking.paymentEventCreated ?? undefined,
      nextStatus,
      eventCreated: event.created,
    });

    if (!shouldApply) {
      transaction.set(eventRef, {
        type: event.type,
        bookingId,
        paymentIntentId: paymentIntent.id,
        outcome: "stale_event_ignored",
        currentPaymentStatus: booking.paymentStatus ?? "unpaid",
        incomingPaymentStatus: nextStatus,
        currentEventCreated: booking.paymentEventCreated ?? null,
        incomingEventCreated: event.created,
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    transaction.update(bookingRef, {
      ...bookingPaymentUpdate({
        paymentIntent,
        existingAmountCaptured: booking.amountCaptured,
        event,
        source: "webhook",
      }),
      ...refundHold,
    });
    transaction.set(eventRef, {
      type: event.type,
      bookingId,
      paymentIntentId: paymentIntent.id,
      outcome: capturedAfterCancellation
        ? "cancelled_booking_captured_refund_review"
        : existingIntentId
          ? "booking_updated"
          : "booking_bound_and_updated",
      paymentStatus: nextStatus,
      refundStatus: capturedAfterCancellation ? "pending_review" : null,
      eventCreated: event.created,
      processedAt: FieldValue.serverTimestamp(),
    });
  });
}

async function handleRefundEvent(
  event: Stripe.Event & { data: { object: Stripe.Refund } },
) {
  const refund = event.data.object;
  const db = getAdminDb();
  const paymentIntentId = refundPaymentIntentId(refund);
  let bookingId = refund.metadata.bookingId?.trim() ?? "";

  if (!bookingId && paymentIntentId) {
    const bookingSnapshot = await db
      .collection("bookings")
      .where("paymentIntentId", "==", paymentIntentId)
      .limit(2)
      .get();
    if (bookingSnapshot.size === 1) {
      bookingId = bookingSnapshot.docs[0].id;
    }
  }
  if (!bookingId) return;

  const bookingRef = db.collection("bookings").doc(bookingId);
  const eventRef = db.collection("stripeWebhookEvents").doc(event.id);

  await db.runTransaction(async (transaction) => {
    const eventSnapshot = await transaction.get(eventRef);
    if (eventSnapshot.exists) return;

    const bookingSnapshot = await transaction.get(bookingRef);
    if (!bookingSnapshot.exists) {
      transaction.set(eventRef, {
        type: event.type,
        bookingId,
        refundId: refund.id,
        outcome: "booking_not_found",
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const booking = {
      id: bookingSnapshot.id,
      ...bookingSnapshot.data(),
    } as RideBooking;
    if (
      paymentIntentId &&
      booking.paymentIntentId &&
      paymentIntentId !== booking.paymentIntentId
    ) {
      transaction.update(bookingRef, {
        paymentIntegrityStatus: "review_required",
        paymentIntegrityIssue:
          "A Stripe refund referenced a different PaymentIntent than the booking record.",
        refundStatus: "failed",
        refundFailureReason: "Refund PaymentIntent mismatch.",
        refundUpdatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(eventRef, {
        type: event.type,
        bookingId,
        refundId: refund.id,
        paymentIntentId,
        outcome: "refund_payment_intent_mismatch",
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const capturedAmount = Math.max(0, Number(booking.amountCaptured ?? 0));
    const fullRefund = capturedAmount > 0 && refund.amount >= capturedAmount;
    const refundStatus = mapRefundStatus(refund.status);
    const succeeded = refundStatus === "succeeded";
    const partialIssue =
      succeeded && !fullRefund
        ? "Stripe reported a partial refund; staff review is required before closing the booking."
        : null;

    transaction.update(bookingRef, {
      refundId: refund.id,
      refundStatus,
      refundAmount: refund.amount,
      refundFailureReason:
        refundStatus === "failed"
          ? refund.failure_reason ?? "Stripe refund failed."
          : null,
      refundUpdatedAt: FieldValue.serverTimestamp(),
      ...(succeeded && fullRefund
        ? {
            paymentStatus: "refunded",
            paymentIntegrityStatus: "verified",
            paymentIntegrityIssue: null,
          }
        : partialIssue
          ? {
              paymentStatus: "paid",
              paymentIntegrityStatus: "review_required",
              paymentIntegrityIssue: partialIssue,
            }
          : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });

    transaction.set(eventRef, {
      type: event.type,
      bookingId,
      refundId: refund.id,
      paymentIntentId,
      refundStatus,
      refundAmount: refund.amount,
      fullRefund,
      outcome: partialIssue ? "partial_refund_requires_review" : "refund_updated",
      processedAt: FieldValue.serverTimestamp(),
    });
  });
}

function cancellationRefundHold(
  paymentIntent: Stripe.PaymentIntent,
  booking: RideBooking,
) {
  const amount = Math.max(
    paymentIntent.amount_received,
    Number(booking.amountCaptured ?? 0),
  );
  return {
    cancellationPaymentAction: "refund_review_required",
    refundStatus: "pending_review",
    refundRequestedAmount: amount || paymentIntent.amount,
    refundReason:
      booking.refundReason || "Payment captured after booking cancellation.",
    refundRequestedAt: FieldValue.serverTimestamp(),
    refundUpdatedAt: FieldValue.serverTimestamp(),
    settlementBlockedAt: FieldValue.serverTimestamp(),
    settlementBlockedReason: "Cancelled booking has money requiring refund review.",
  };
}

function refundPaymentIntentId(refund: Stripe.Refund) {
  if (typeof refund.payment_intent === "string") return refund.payment_intent;
  if (refund.payment_intent && typeof refund.payment_intent === "object") {
    return refund.payment_intent.id;
  }
  return null;
}

function mapRefundStatus(status: Stripe.Refund.Status): RideBookingRefundStatus {
  switch (status) {
    case "succeeded":
      return "succeeded";
    case "failed":
      return "failed";
    case "canceled":
      return "canceled";
    case "pending":
    case "requires_action":
      return "processing";
    default:
      return "processing";
  }
}
