import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_COMMERCE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret || !hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Commerce payment webhook is not configured." },
      { status: 503 },
    );
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret,
    );
  } catch (error) {
    console.error("commerce stripe webhook signature error", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await processCompletedSession(event);
      return NextResponse.json({ received: true });
    }

    if (event.type === "checkout.session.expired") {
      await processExpiredSession(event);
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true, ignored: true });
  } catch (error) {
    console.error("commerce stripe webhook processing error", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}

async function processCompletedSession(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const bookingId = session.metadata?.bookingId?.trim();
  if (!bookingId || session.payment_status !== "paid") return;

  const db = getAdminDb();
  const bookingRef = db.collection("commerceBookings").doc(bookingId);
  const eventRef = db.collection("stripeWebhookEvents").doc(event.id);

  await db.runTransaction(async (transaction) => {
    const eventSnapshot = await transaction.get(eventRef);
    if (eventSnapshot.exists) return;

    const bookingSnapshot = await transaction.get(bookingRef);
    if (!bookingSnapshot.exists) {
      transaction.set(eventRef, {
        type: event.type,
        bookingId,
        checkoutSessionId: session.id,
        outcome: "commerce_booking_not_found",
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const booking = bookingSnapshot.data() ?? {};
    const now = new Date().toISOString();
    const paidAmountCents = Number(session.amount_total ?? booking.depositAmountCents ?? 0);
    const reference = String(booking.reference ?? bookingId);
    const listingName = String(booking.listingName ?? "VI Guide booking");

    transaction.update(bookingRef, {
      status: "paid",
      paymentStatus: "paid",
      paidAmountCents,
      checkoutSessionId: session.id,
      paymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      paidAt: now,
      updatedAt: now,
    });

    for (const audience of ["traveler", "merchant", "operations"] as const) {
      const notificationRef = db.collection("notifications").doc();
      transaction.set(notificationRef, {
        audience,
        kind: "booking",
        priority: "normal",
        title: "Payment received",
        message: `${listingName} payment was received for booking ${reference}.`,
        href:
          audience === "traveler"
            ? "/bookings"
            : audience === "merchant"
              ? "/merchant/lifecycle"
              : "/admin/operations",
        reference,
        readAt: null,
        createdAt: now,
        updatedAt: now,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.set(eventRef, {
      type: event.type,
      bookingId,
      checkoutSessionId: session.id,
      paymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      paidAmountCents,
      outcome: "commerce_booking_paid",
      processedAt: FieldValue.serverTimestamp(),
    });
  });
}

async function processExpiredSession(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const bookingId = session.metadata?.bookingId?.trim();
  if (!bookingId) return;

  const db = getAdminDb();
  const bookingRef = db.collection("commerceBookings").doc(bookingId);
  const eventRef = db.collection("stripeWebhookEvents").doc(event.id);

  await db.runTransaction(async (transaction) => {
    const eventSnapshot = await transaction.get(eventRef);
    if (eventSnapshot.exists) return;

    const bookingSnapshot = await transaction.get(bookingRef);
    if (bookingSnapshot.exists) {
      transaction.update(bookingRef, {
        checkoutSessionId: null,
        paymentHref: null,
        updatedAt: new Date().toISOString(),
      });
    }

    transaction.set(eventRef, {
      type: event.type,
      bookingId,
      checkoutSessionId: session.id,
      outcome: "commerce_checkout_expired",
      processedAt: FieldValue.serverTimestamp(),
    });
  });
}
