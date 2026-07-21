import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import type Stripe from "stripe";

import { getAdminDb } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";
import type { RideBookingPaymentStatus } from "@/types/mobility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bookingPaymentUpdate(paymentIntent: Stripe.PaymentIntent) {
  let paymentStatus: RideBookingPaymentStatus;
  switch (paymentIntent.status) {
    case "succeeded":
      paymentStatus = "paid";
      break;
    case "processing":
      paymentStatus = "processing";
      break;
    case "canceled":
      paymentStatus = "canceled";
      break;
    case "requires_payment_method":
      paymentStatus = paymentIntent.last_payment_error
        ? "failed"
        : "requires_payment_method";
      break;
    case "requires_action":
    case "requires_confirmation":
      paymentStatus = "requires_payment_method";
      break;
    default:
      paymentStatus = "unpaid";
  }

  return {
    paymentStatus,
    paymentIntentId: paymentIntent.id,
    amountAuthorized: paymentIntent.amount,
    amountCaptured:
      paymentIntent.status === "succeeded"
        ? paymentIntent.amount_received
        : null,
    paymentFailureCode: paymentIntent.last_payment_error?.code ?? null,
    paymentFailureMessage: paymentIntent.last_payment_error?.message ?? null,
    paymentUpdatedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

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

      const existingIntentId = bookingSnapshot.get("paymentIntentId");
      if (existingIntentId && existingIntentId !== paymentIntent.id) {
        transaction.set(eventRef, {
          type: event.type,
          bookingId,
          paymentIntentId: paymentIntent.id,
          outcome: "payment_intent_mismatch",
          processedAt: FieldValue.serverTimestamp(),
        });
        return;
      }

      transaction.update(bookingRef, bookingPaymentUpdate(paymentIntent));
      transaction.set(eventRef, {
        type: event.type,
        bookingId,
        paymentIntentId: paymentIntent.id,
        outcome: "booking_updated",
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
