import { NextRequest, NextResponse } from "next/server";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
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
  BookingRefundStatus,
  RideBooking,
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

function isDisputeEvent(
  event: Stripe.Event,
): event is Stripe.Event & { data: { object: Stripe.Dispute } } {
  return event.type.startsWith("charge.dispute.");
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
      await processPaymentIntentEvent(event);
      return NextResponse.json({ received: true });
    }
    if (isRefundEvent(event)) {
      await processRefundEvent(event);
      return NextResponse.json({ received: true });
    }
    if (isDisputeEvent(event)) {
      await processDisputeEvent(event);
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

async function processPaymentIntentEvent(
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
          financialHoldStatus: "manual_review",
          unexpectedCapturedPaymentIntentId: paymentIntent.id,
          unexpectedCapturedAmount: paymentIntent.amount_received,
          unexpectedCapturedAt: FieldValue.serverTimestamp(),
          paymentStateSource: "webhook",
          paymentEventId: event.id,
          paymentEventType: event.type,
          paymentEventCreated: event.created,
          paymentUpdatedAt: FieldValue.serverTimestamp(),
          settlement: heldSettlement(booking, mismatchIssue),
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
        financialHoldStatus: "manual_review",
        settlement: heldSettlement(booking, integrityIssue),
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

    transaction.update(
      bookingRef,
      bookingPaymentUpdate({
        paymentIntent,
        existingAmountCaptured: booking.amountCaptured,
        event,
        source: "webhook",
      }),
    );
    transaction.set(eventRef, {
      type: event.type,
      bookingId,
      paymentIntentId: paymentIntent.id,
      outcome: existingIntentId ? "booking_updated" : "booking_bound_and_updated",
      paymentStatus: nextStatus,
      eventCreated: event.created,
      processedAt: FieldValue.serverTimestamp(),
    });
  });
}

async function processRefundEvent(
  event: Stripe.Event & { data: { object: Stripe.Refund } },
) {
  const refund = event.data.object;
  const paymentIntentId = expandableId(
    (refund as Stripe.Refund & {
      payment_intent?: string | Stripe.PaymentIntent | null;
    }).payment_intent,
  );
  const db = getAdminDb();
  const bookingId = refund.metadata.bookingId?.trim();
  const bookingRef = bookingId
    ? db.collection("bookings").doc(bookingId)
    : await findBookingRefByPaymentIntent(db, paymentIntentId);
  const eventRef = db.collection("stripeWebhookEvents").doc(event.id);

  if (!bookingRef) {
    await eventRef.set({
      type: event.type,
      refundId: refund.id,
      paymentIntentId: paymentIntentId ?? null,
      outcome: "booking_not_found",
      processedAt: FieldValue.serverTimestamp(),
    });
    return;
  }

  await db.runTransaction(async (transaction) => {
    const eventSnapshot = await transaction.get(eventRef);
    if (eventSnapshot.exists) return;
    const bookingSnapshot = await transaction.get(bookingRef);
    if (!bookingSnapshot.exists) {
      transaction.set(eventRef, {
        type: event.type,
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
      booking.paymentIntentId !== paymentIntentId
    ) {
      transaction.set(eventRef, {
        type: event.type,
        bookingId: booking.id,
        refundId: refund.id,
        paymentIntentId,
        existingPaymentIntentId: booking.paymentIntentId,
        outcome: "payment_intent_mismatch",
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const status = normalizeRefundStatus(refund.status);
    const capturedAmount = Number(booking.amountCaptured ?? 0);
    const fullRefund = capturedAmount > 0 && refund.amount >= capturedAmount;
    const succeeded = status === "succeeded";
    const pending = status === "pending";
    const reviewIssue =
      succeeded && !fullRefund
        ? "Stripe reported a partial refund for a booking that requires full financial review."
        : !succeeded && !pending
          ? refund.failure_reason || "The refund did not complete automatically."
          : null;
    const holdStatus = succeeded && fullRefund
      ? "none"
      : pending
        ? "refund_pending"
        : "refund_review";

    transaction.update(bookingRef, {
      paymentStatus: succeeded && fullRefund ? "refunded" : booking.paymentStatus,
      financialHoldStatus: holdStatus,
      refund: {
        id: refund.id,
        status,
        amount: refund.amount,
        currency: "usd",
        reason: refund.metadata.reason ?? booking.refund?.reason ?? null,
        operationId:
          refund.metadata.operationId ?? booking.refund?.operationId ?? null,
        failureReason: refund.failure_reason ?? null,
        requestedAt: booking.refund?.requestedAt ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      ...(reviewIssue
        ? {
            paymentIntegrityStatus: "review_required",
            paymentIntegrityIssue: reviewIssue,
          }
        : {}),
      settlement:
        booking.status === "cancelled" && succeeded && fullRefund
          ? voidSettlement(booking, "Cancelled ride refunded in full.")
          : heldSettlement(
              booking,
              succeeded && fullRefund
                ? "Refund issued after booking activity; settlement review required."
                : `Refund ${status.replaceAll("_", " ")}.`,
            ),
      paymentUpdatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(eventRef, {
      type: event.type,
      bookingId: booking.id,
      refundId: refund.id,
      paymentIntentId: paymentIntentId ?? booking.paymentIntentId ?? null,
      refundStatus: status,
      refundAmount: refund.amount,
      fullRefund,
      outcome: reviewIssue ? "refund_requires_review" : "refund_updated",
      processedAt: FieldValue.serverTimestamp(),
    });
  });
}

async function processDisputeEvent(
  event: Stripe.Event & { data: { object: Stripe.Dispute } },
) {
  const dispute = event.data.object;
  const stripe = getStripe();
  let paymentIntentId = expandableId(
    (dispute as Stripe.Dispute & {
      payment_intent?: string | Stripe.PaymentIntent | null;
    }).payment_intent,
  );
  if (!paymentIntentId) {
    const chargeId = expandableId(dispute.charge);
    if (chargeId) {
      const charge = await stripe.charges.retrieve(chargeId);
      paymentIntentId = expandableId(charge.payment_intent);
    }
  }

  const db = getAdminDb();
  const bookingRef = await findBookingRefByPaymentIntent(db, paymentIntentId);
  const eventRef = db.collection("stripeWebhookEvents").doc(event.id);
  if (!bookingRef) {
    await eventRef.set({
      type: event.type,
      disputeId: dispute.id,
      paymentIntentId: paymentIntentId ?? null,
      outcome: "booking_not_found",
      processedAt: FieldValue.serverTimestamp(),
    });
    return;
  }

  await db.runTransaction(async (transaction) => {
    const eventSnapshot = await transaction.get(eventRef);
    if (eventSnapshot.exists) return;
    const bookingSnapshot = await transaction.get(bookingRef);
    if (!bookingSnapshot.exists) {
      transaction.set(eventRef, {
        type: event.type,
        disputeId: dispute.id,
        outcome: "booking_not_found",
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const booking = {
      id: bookingSnapshot.id,
      ...bookingSnapshot.data(),
    } as RideBooking;
    const fundsReinstated =
      event.type === "charge.dispute.funds_reinstated" ||
      booking.dispute?.fundsReinstated === true;
    const lost = dispute.status === "lost";
    const won = dispute.status === "won";
    const holdStatus = lost
      ? "dispute_lost"
      : won && fundsReinstated
        ? "manual_review"
        : "dispute_open";
    const issue = lost
      ? "The card dispute was lost and operator settlement is blocked."
      : won && fundsReinstated
        ? "Dispute funds were reinstated; staff must re-approve settlement."
        : "A card dispute is open and dispatch or settlement is blocked.";

    transaction.update(bookingRef, {
      dispute: {
        id: dispute.id,
        status: dispute.status,
        amount: dispute.amount,
        currency: dispute.currency,
        reason: dispute.reason ?? null,
        evidenceDueBy: dispute.evidence_details?.due_by ?? null,
        fundsReinstated,
        createdAt: booking.dispute?.createdAt ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      financialHoldStatus: holdStatus,
      paymentIntegrityStatus: "review_required",
      paymentIntegrityIssue: issue,
      settlement: heldSettlement(booking, issue),
      paymentUpdatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(eventRef, {
      type: event.type,
      bookingId: booking.id,
      paymentIntentId: paymentIntentId ?? booking.paymentIntentId ?? null,
      disputeId: dispute.id,
      disputeStatus: dispute.status,
      fundsReinstated,
      outcome: "dispute_updated",
      processedAt: FieldValue.serverTimestamp(),
    });
  });
}

async function findBookingRefByPaymentIntent(
  db: Firestore,
  paymentIntentId: string | null,
) {
  if (!paymentIntentId) return null;
  const snapshot = await db
    .collection("bookings")
    .where("paymentIntentId", "==", paymentIntentId)
    .limit(2)
    .get();
  if (snapshot.size !== 1) return null;
  return snapshot.docs[0].ref;
}

function expandableId(
  value:
    | string
    | { id?: string }
    | null
    | undefined,
) {
  if (typeof value === "string") return value;
  if (value && typeof value.id === "string") return value.id;
  return null;
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

function heldSettlement(booking: RideBooking, reason: string) {
  return {
    status: "held",
    grossFare: booking.settlement?.grossFare ?? booking.finalFare ?? booking.quotedFare?.total ?? 0,
    serviceFee: booking.settlement?.serviceFee ?? booking.payout?.platformRevenue ?? 0,
    operatorSettlement:
      booking.settlement?.operatorSettlement ?? booking.payout?.driverPayout ?? 0,
    feeAgreementId: booking.settlement?.feeAgreementId ?? null,
    holdReason: reason,
  };
}

function voidSettlement(booking: RideBooking, reason: string) {
  return {
    status: "void",
    grossFare: 0,
    serviceFee: 0,
    operatorSettlement: 0,
    feeAgreementId: booking.settlement?.feeAgreementId ?? null,
    holdReason: reason,
  };
}
