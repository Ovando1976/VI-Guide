import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import {
  normalizeCommerceEmail,
  validateCompletedCommerceCheckout,
} from "@/lib/payments/commerce-checkout-integrity";
import {
  commerceRefundStatusFromStripe,
  type CommerceRefundStatus,
} from "@/lib/payments/commerce-refund-integrity";
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

    if (
      event.type === "refund.created" ||
      event.type === "refund.updated" ||
      event.type === "refund.failed"
    ) {
      await processRefundEvent(event);
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
    const expectedSessionId = String(booking.checkoutSessionId ?? "").trim();
    const expectedAmountCents = Number(booking.depositAmountCents ?? 0);
    const paidAmountCents = Number(session.amount_total ?? 0);
    const expectedEmail = normalizeCommerceEmail(booking.email);
    const paidEmail = normalizeCommerceEmail(
      session.customer_details?.email ?? session.customer_email,
    );
    const expectedReference = String(booking.reference ?? bookingId);
    const sessionReference = String(
      session.metadata?.bookingReference ?? "",
    ).trim();

    const rejectionReason = validateCompletedCommerceCheckout({
      checkoutSessionId: session.id,
      expectedSessionId,
      expectedAmountCents,
      paidAmountCents,
      currency: session.currency,
      expectedEmail,
      paidEmail,
      expectedReference,
      sessionReference,
    });

    if (rejectionReason) {
      transaction.set(eventRef, {
        type: event.type,
        bookingId,
        checkoutSessionId: session.id,
        paymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
        expectedSessionId: expectedSessionId || null,
        expectedAmountCents,
        paidAmountCents,
        currency: session.currency ?? null,
        outcome: "commerce_checkout_rejected",
        rejectionReason,
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const now = new Date().toISOString();
    const listingName = String(booking.listingName ?? "VI Guide booking");

    transaction.update(bookingRef, {
      status: "paid",
      paymentStatus: "paid",
      paidAmountCents,
      checkoutSessionId: session.id,
      paymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      paidAt: now,
      refundStatus: "not_requested",
      updatedAt: now,
    });

    for (const audience of ["traveler", "merchant", "operations"] as const) {
      const notificationRef = db.collection("notifications").doc();
      transaction.set(notificationRef, {
        audience,
        kind: "booking",
        priority: "normal",
        title: "Payment received",
        message: `${listingName} payment was received for booking ${expectedReference}.`,
        href:
          audience === "traveler"
            ? "/bookings"
            : audience === "merchant"
              ? "/merchant/lifecycle"
              : "/admin/operations",
        reference: expectedReference,
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
      currency: session.currency,
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
    const currentSessionId = bookingSnapshot.exists
      ? String(bookingSnapshot.data()?.checkoutSessionId ?? "").trim()
      : "";
    const matchesCurrentSession = currentSessionId === session.id;

    if (bookingSnapshot.exists && matchesCurrentSession) {
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
      currentSessionId: currentSessionId || null,
      outcome: matchesCurrentSession
        ? "commerce_checkout_expired"
        : "commerce_stale_checkout_expired",
      processedAt: FieldValue.serverTimestamp(),
    });
  });
}

async function processRefundEvent(event: Stripe.Event) {
  const refund = event.data.object as Stripe.Refund;
  const paymentIntentId = expandableId(
    (refund as Stripe.Refund & {
      payment_intent?: string | Stripe.PaymentIntent | null;
    }).payment_intent,
  );
  const bookingId = refund.metadata?.bookingId?.trim();
  const operationId = refund.metadata?.operationId?.trim();
  const db = getAdminDb();
  const eventRef = db.collection("stripeWebhookEvents").doc(event.id);
  const bookingRef = bookingId
    ? db.collection("commerceBookings").doc(bookingId)
    : await findCommerceBookingByPaymentIntent(db, paymentIntentId);

  if (!bookingRef) {
    await eventRef.set({
      type: event.type,
      refundId: refund.id,
      paymentIntentId: paymentIntentId ?? null,
      outcome: "commerce_booking_not_found",
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
        outcome: "commerce_booking_not_found",
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const booking = bookingSnapshot.data() ?? {};
    const existingPaymentIntentId = String(booking.paymentIntentId ?? "").trim();
    if (
      !paymentIntentId ||
      !existingPaymentIntentId ||
      paymentIntentId !== existingPaymentIntentId
    ) {
      transaction.set(eventRef, {
        type: event.type,
        bookingId: bookingSnapshot.id,
        refundId: refund.id,
        paymentIntentId: paymentIntentId ?? null,
        existingPaymentIntentId: existingPaymentIntentId || null,
        outcome: "commerce_refund_payment_intent_mismatch",
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const paidAmountCents = Number(booking.paidAmountCents ?? 0);
    const fullRefund = paidAmountCents > 0 && refund.amount === paidAmountCents;
    const stripeStatus = commerceRefundStatusFromStripe(refund.status);
    const refundStatus: CommerceRefundStatus =
      stripeStatus === "succeeded" && !fullRefund
        ? "review_required"
        : stripeStatus;
    const previousStatus = String(booking.refundStatus ?? "not_requested");
    const previousRefundId = String(booking.refundId ?? "");
    const stateChanged =
      previousStatus !== refundStatus || previousRefundId !== refund.id;
    const now = new Date().toISOString();

    transaction.update(bookingRef, {
      ...(refundStatus === "succeeded" && fullRefund
        ? { status: "cancelled", paymentStatus: "refunded" }
        : refundStatus === "failed"
          ? { paymentStatus: "refund_failed" }
          : refundStatus === "review_required"
            ? { paymentStatus: "paid" }
            : { paymentStatus: "refund_pending" }),
      refundStatus,
      refundId: refund.id,
      refundOperationId: operationId || booking.refundOperationId || null,
      refundAmountCents: refund.amount,
      refundReason: refund.metadata?.reason ?? booking.refundReason ?? null,
      refundFailureReason: refund.failure_reason ?? null,
      refundUpdatedAt: now,
      updatedAt: now,
    });

    const resolvedOperationId = operationId || String(booking.refundOperationId ?? "");
    if (resolvedOperationId) {
      transaction.set(
        db.collection("commerceRefundOperations").doc(resolvedOperationId),
        {
          refundId: refund.id,
          status: refundStatus,
          refundAmountCents: refund.amount,
          fullRefund,
          failureReason: refund.failure_reason ?? null,
          updatedAt: now,
          serverUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    if (stateChanged) {
      if (refundStatus === "succeeded" && fullRefund) {
        writeRefundNotifications(transaction, db, {
          reference: String(booking.reference ?? bookingSnapshot.id),
          listingName: String(booking.listingName ?? "VI Guide booking"),
          amountCents: refund.amount,
          status: "succeeded",
          now,
        });
      } else if (refundStatus === "failed" || refundStatus === "review_required") {
        writeRefundNotifications(transaction, db, {
          reference: String(booking.reference ?? bookingSnapshot.id),
          listingName: String(booking.listingName ?? "VI Guide booking"),
          amountCents: refund.amount,
          status: refundStatus,
          now,
        });
      }
    }

    transaction.set(eventRef, {
      type: event.type,
      bookingId: bookingSnapshot.id,
      refundId: refund.id,
      operationId: resolvedOperationId || null,
      paymentIntentId,
      refundStatus,
      refundAmountCents: refund.amount,
      paidAmountCents,
      fullRefund,
      outcome:
        refundStatus === "review_required"
          ? "commerce_refund_requires_review"
          : "commerce_refund_reconciled",
      processedAt: FieldValue.serverTimestamp(),
    });
  });
}

function writeRefundNotifications(
  transaction: FirebaseFirestore.Transaction,
  db: Firestore,
  input: {
    reference: string;
    listingName: string;
    amountCents: number;
    status: "succeeded" | "failed" | "review_required";
    now: string;
  },
) {
  const audiences =
    input.status === "succeeded"
      ? (["traveler", "merchant", "operations"] as const)
      : (["operations"] as const);
  for (const audience of audiences) {
    const notificationRef = db.collection("notifications").doc();
    const succeeded = input.status === "succeeded";
    transaction.set(notificationRef, {
      audience,
      kind: "booking",
      priority: "high",
      title: succeeded ? "Refund issued" : "Refund needs review",
      message: succeeded
        ? `${formatMoney(input.amountCents)} was refunded for ${input.listingName} booking ${input.reference}.`
        : `Refund processing for ${input.listingName} booking ${input.reference} requires financial review.`,
      href:
        audience === "traveler"
          ? "/bookings"
          : audience === "merchant"
            ? "/merchant/lifecycle"
            : "/admin/commerce-refunds",
      reference: input.reference,
      readAt: null,
      createdAt: input.now,
      updatedAt: input.now,
      serverCreatedAt: FieldValue.serverTimestamp(),
    });
  }
}

async function findCommerceBookingByPaymentIntent(
  db: Firestore,
  paymentIntentId: string | null,
) {
  if (!paymentIntentId) return null;
  const snapshot = await db
    .collection("commerceBookings")
    .where("paymentIntentId", "==", paymentIntentId)
    .limit(2)
    .get();
  return snapshot.size === 1 ? snapshot.docs[0].ref : null;
}

function expandableId(
  value: string | { id?: string } | null | undefined,
) {
  if (typeof value === "string") return value;
  return value?.id ?? null;
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
