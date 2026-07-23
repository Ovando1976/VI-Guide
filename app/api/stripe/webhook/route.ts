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
import type { RideBooking } from "@/types/mobility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPaymentIntentEvent(
  event: Stripe.Event,
): event is Stripe.Event & { data: { object: Stripe.PaymentIntent } } {
  return event.type.startsWith("payment_intent.");
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

  if (!isPaymentIntentEvent(event)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const paymentIntent = event.data.object;
  const bookingId = paymentIntent.metadata.bookingId?.trim();
  if (!bookingId) {
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
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
      const integrityIssue = paymentIntentIntegrityIssue(paymentIntent, booking);
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
                paymentUpdatedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
              }),
          paymentIntegrityStatus: "review_required",
          paymentIntegrityIssue: integrityIssue,
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

      const existingIntentId = booking.paymentIntentId;
      if (existingIntentId && existingIntentId !== paymentIntent.id) {
        transaction.set(eventRef, {
          type: event.type,
          bookingId,
          paymentIntentId: paymentIntent.id,
          existingPaymentIntentId: existingIntentId,
          outcome: "payment_intent_mismatch",
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

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("stripe webhook processing error", error);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
