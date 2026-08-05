import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import {
  commerceCheckoutApplicationDecision,
  normalizeCommerceEmail,
  validateCompletedCommerceCheckout,
} from "@/lib/payments/commerce-checkout-integrity";
import {
  buildCommerceCaptureLedgerEntry,
  buildCommerceRefundLedgerEntry,
  commerceCaptureLedgerId,
  resolveCommerceLedgerPolicy,
  type CommerceLedgerEntry,
} from "@/lib/payments/commerce-ledger";
import {
  buildCommerceRefundOperationId,
  commerceRefundEventDecision,
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
    const paymentIntentId = expandableId(session.payment_intent);
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
      paymentIntentId: paymentIntentId ?? "",
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
        paymentIntentId,
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

    const currentStatus = String(booking.status ?? "requested");
    const currentPaymentStatus = String(booking.paymentStatus ?? "");
    const currentRefundStatus = String(booking.refundStatus ?? "");
    const applicationDecision = commerceCheckoutApplicationDecision({
      bookingStatus: currentStatus,
      paymentStatus: currentPaymentStatus,
      refundStatus: currentRefundStatus,
      existingPaymentIntentId: String(booking.paymentIntentId ?? "").trim(),
      incomingPaymentIntentId: paymentIntentId ?? "",
      existingPaidAmountCents: Number(booking.paidAmountCents ?? 0),
      incomingPaidAmountCents: paidAmountCents,
    });

    if (applicationDecision === "ignore_after_refund") {
      transaction.set(eventRef, {
        type: event.type,
        bookingId,
        checkoutSessionId: session.id,
        paymentIntentId,
        currentStatus,
        currentPaymentStatus,
        currentRefundStatus,
        outcome: "commerce_checkout_after_refund_ignored",
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const requestNow = new Date();
    const now = requestNow.toISOString();
    const listingId =
      String(booking.listingId ?? "").trim() || `unassigned-${bookingId}`;
    const listingName = String(booking.listingName ?? "VI Guide booking");
    const feePolicy = resolveCommerceLedgerPolicy(
      process.env.VI_GUIDE_COMMERCE_PLATFORM_FEE_BPS,
    );
    const captureEntry = buildCommerceCaptureLedgerEntry({
      bookingId,
      bookingReference: expectedReference,
      listingId,
      listingName,
      paymentIntentId,
      checkoutSessionId: session.id,
      stripeEventId: event.id,
      grossAmountCents: paidAmountCents,
      currency: session.currency,
      policy: feePolicy,
      verified: applicationDecision !== "review_required",
      occurredAt: stripeEventOccurredAt(event),
      now: requestNow,
    });

    if (!captureEntry) {
      const issue =
        "Stripe payment was verified, but VI Guide could not construct its accounting allocation.";
      transaction.update(bookingRef, {
        paymentStatus: "paid",
        paidAmountCents,
        checkoutSessionId: session.id,
        paymentIntentId,
        paidAt: booking.paidAt ?? now,
        paymentIntegrityStatus: "review_required",
        paymentIntegrityIssue: issue,
        refundStatus: "review_required",
        refundUpdatedAt: now,
        updatedAt: now,
      });
      transaction.set(db.collection("notifications").doc(), {
        audience: "operations",
        kind: "booking",
        priority: "high",
        title: "Payment accounting needs review",
        message: `${listingName} booking ${expectedReference} was paid but its ledger allocation could not be created.`,
        href: "/admin/commerce-ledger",
        reference: expectedReference,
        readAt: null,
        createdAt: now,
        updatedAt: now,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(eventRef, {
        type: event.type,
        bookingId,
        checkoutSessionId: session.id,
        paymentIntentId,
        outcome: "commerce_ledger_capture_invalid",
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    if (applicationDecision === "already_applied") {
      writeCommerceLedgerEntry(transaction, db, captureEntry);
      transaction.update(bookingRef, bookingLedgerCapturePatch(captureEntry, now));
      transaction.set(eventRef, {
        type: event.type,
        bookingId,
        checkoutSessionId: session.id,
        paymentIntentId,
        currentStatus,
        currentPaymentStatus,
        ledgerEntryId: captureEntry.id,
        outcome: "commerce_checkout_already_applied",
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    if (applicationDecision === "review_required") {
      const issue = `Stripe captured payment while booking ${expectedReference} was in ${currentStatus.replaceAll(
        "_",
        " ",
      )} state.`;
      writeCommerceLedgerEntry(transaction, db, captureEntry);
      transaction.update(bookingRef, {
        paymentStatus: "paid",
        paidAmountCents,
        checkoutSessionId: session.id,
        paymentIntentId,
        paidAt: booking.paidAt ?? now,
        paymentIntegrityStatus: "review_required",
        paymentIntegrityIssue: issue,
        refundStatus: "review_required",
        refundUpdatedAt: now,
        paymentEventCreated: event.created,
        ...bookingLedgerCapturePatch(captureEntry, now),
        updatedAt: now,
      });
      transaction.set(db.collection("notifications").doc(), {
        audience: "operations",
        kind: "booking",
        priority: "high",
        title: "Captured payment needs review",
        message: `${listingName} booking ${expectedReference} received a Stripe payment outside the expected lifecycle state.`,
        href: "/admin/commerce-ledger",
        reference: expectedReference,
        readAt: null,
        createdAt: now,
        updatedAt: now,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(eventRef, {
        type: event.type,
        bookingId,
        checkoutSessionId: session.id,
        paymentIntentId,
        currentStatus,
        currentPaymentStatus,
        ledgerEntryId: captureEntry.id,
        outcome: "commerce_checkout_requires_review",
        integrityIssue: issue,
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    writeCommerceLedgerEntry(transaction, db, captureEntry);
    transaction.update(bookingRef, {
      status: "paid",
      paymentStatus: "paid",
      paidAmountCents,
      checkoutSessionId: session.id,
      paymentIntentId,
      paidAt: now,
      paymentIntegrityStatus: "verified",
      paymentIntegrityIssue: null,
      paymentEventCreated: event.created,
      refundStatus: "not_requested",
      ...bookingLedgerCapturePatch(captureEntry, now),
      updatedAt: now,
    });

    for (const audience of ["traveler", "merchant", "operations"] as const) {
      transaction.set(db.collection("notifications").doc(), {
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
      paymentIntentId,
      paidAmountCents,
      currency: session.currency,
      eventCreated: event.created,
      ledgerEntryId: captureEntry.id,
      platformFeeCents: captureEntry.platformFeeCents,
      merchantSettlementCents: captureEntry.merchantSettlementCents,
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
    const paymentStatus = bookingSnapshot.exists
      ? String(bookingSnapshot.data()?.paymentStatus ?? "")
      : "";
    const mayClearSession =
      matchesCurrentSession &&
      !["paid", "refund_pending", "refunded", "refund_failed"].includes(
        paymentStatus,
      );

    if (bookingSnapshot.exists && mayClearSession) {
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
      paymentStatus: paymentStatus || null,
      outcome: mayClearSession
        ? "commerce_checkout_expired"
        : matchesCurrentSession
          ? "commerce_paid_checkout_expiry_ignored"
          : "commerce_stale_checkout_expired",
      processedAt: FieldValue.serverTimestamp(),
    });
  });
}

async function processRefundEvent(event: Stripe.Event) {
  const refund = event.data.object as Stripe.Refund;
  const paymentIntentId = expandableId(refund.payment_intent);
  const metadataBookingId = refund.metadata?.bookingId?.trim();
  const metadataOperationId = refund.metadata?.operationId?.trim();
  const db = getAdminDb();
  const eventRef = db.collection("stripeWebhookEvents").doc(event.id);
  const paymentIntentBookingRef = await findCommerceBookingByPaymentIntent(
    db,
    paymentIntentId,
  );
  const metadataBookingRef = metadataBookingId
    ? db.collection("commerceBookings").doc(metadataBookingId)
    : null;
  const bookingRef = paymentIntentBookingRef ?? metadataBookingRef;
  const metadataBookingMismatch = Boolean(
    paymentIntentBookingRef &&
      metadataBookingId &&
      paymentIntentBookingRef.id !== metadataBookingId,
  );

  if (!bookingRef) {
    await eventRef.set({
      type: event.type,
      refundId: refund.id,
      paymentIntentId: paymentIntentId ?? null,
      metadataBookingId: metadataBookingId ?? null,
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
        metadataBookingId: metadataBookingId ?? null,
        outcome: "commerce_refund_payment_intent_mismatch",
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const paidAmountCents = Number(booking.paidAmountCents ?? 0);
    const expectedOperationId = buildCommerceRefundOperationId({
      bookingId: bookingSnapshot.id,
      paymentIntentId,
      paidAmountCents,
    });
    const storedOperationId = String(booking.refundOperationId ?? "").trim();
    const resolvedOperationId =
      storedOperationId === expectedOperationId
        ? storedOperationId
        : expectedOperationId;
    const metadataOperationMismatch = Boolean(
      metadataOperationId && metadataOperationId !== expectedOperationId,
    );
    const fullRefund = paidAmountCents > 0 && refund.amount === paidAmountCents;
    const stripeStatus = commerceRefundStatusFromStripe(refund.status);
    const incomingStatus: CommerceRefundStatus =
      stripeStatus === "succeeded" && !fullRefund
        ? "review_required"
        : stripeStatus;
    const eventDecision = commerceRefundEventDecision({
      currentStatus: booking.refundStatus,
      currentRefundId: booking.refundId,
      incomingStatus,
      incomingRefundId: refund.id,
    });
    const requestNow = new Date();
    const now = requestNow.toISOString();

    if (eventDecision === "ignore_stale") {
      transaction.set(eventRef, {
        type: event.type,
        bookingId: bookingSnapshot.id,
        refundId: refund.id,
        paymentIntentId,
        incomingStatus,
        currentStatus: booking.refundStatus ?? "not_requested",
        outcome: "commerce_stale_refund_event_ignored",
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const captureGrossAmountCents = storedNonNegativeMoney(
      booking.commerceGrossAmountCents,
      paidAmountCents,
    );
    const capturePlatformFeeCents = storedNonNegativeMoney(
      booking.commercePlatformFeeCents,
      0,
    );
    const captureMerchantSettlementCents = storedNonNegativeMoney(
      booking.commerceMerchantSettlementCents,
      Math.max(0, captureGrossAmountCents - capturePlatformFeeCents),
    );
    const captureEntryId =
      String(booking.commerceLedgerCaptureId ?? "").trim() ||
      commerceCaptureLedgerId(paymentIntentId);
    const refundEntry = buildCommerceRefundLedgerEntry({
      bookingId: bookingSnapshot.id,
      bookingReference: String(booking.reference ?? bookingSnapshot.id),
      listingId:
        String(booking.listingId ?? "").trim() ||
        `unassigned-${bookingSnapshot.id}`,
      listingName: String(booking.listingName ?? "VI Guide booking"),
      paymentIntentId,
      checkoutSessionId: booking.checkoutSessionId,
      refundId: refund.id,
      stripeEventId: event.id,
      refundStatus:
        eventDecision === "review_multiple_refunds"
          ? "review_required"
          : incomingStatus === "processing"
            ? "pending"
            : incomingStatus,
      refundAmountCents: refund.amount,
      currency: refund.currency ?? "usd",
      paymentIntentMatches: true,
      fullRefund,
      captureEntryId,
      captureGrossAmountCents,
      capturePlatformFeeCents,
      captureMerchantSettlementCents,
      feeBps: storedNonNegativeMoney(booking.commercePlatformFeeBps, 0),
      feePolicySource: normalizeLedgerPolicySource(
        booking.commerceFeePolicySource,
      ),
      occurredAt: stripeEventOccurredAt(event),
      now: requestNow,
    });

    if (eventDecision === "review_multiple_refunds") {
      if (refundEntry) writeCommerceLedgerEntry(transaction, db, refundEntry);
      transaction.update(bookingRef, {
        refundStatus: "review_required",
        refundFailureReason:
          "Stripe reported more than one refund object for this captured payment.",
        commerceLedgerLatestRefundId: refundEntry?.id ?? null,
        commerceLedgerLatestRefundStatus: refundEntry?.status ?? "review_required",
        commerceLedgerUpdatedAt: now,
        refundUpdatedAt: now,
        updatedAt: now,
      });
      transaction.set(
        db.collection("commerceRefundOperations").doc(resolvedOperationId),
        {
          bookingId: bookingSnapshot.id,
          bookingReference: String(booking.reference ?? bookingSnapshot.id),
          paymentIntentId,
          amountCents: paidAmountCents,
          status: "review_required",
          previousRefundId: booking.refundId ?? null,
          additionalRefundId: refund.id,
          updatedAt: now,
          serverUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      writeRefundNotifications(transaction, db, {
        reference: String(booking.reference ?? bookingSnapshot.id),
        listingName: String(booking.listingName ?? "VI Guide booking"),
        amountCents: refund.amount,
        status: "review_required",
        now,
      });
      transaction.set(eventRef, {
        type: event.type,
        bookingId: bookingSnapshot.id,
        refundId: refund.id,
        previousRefundId: booking.refundId ?? null,
        paymentIntentId,
        ledgerEntryId: refundEntry?.id ?? null,
        outcome: "commerce_multiple_refunds_require_review",
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const previousStatus = String(booking.refundStatus ?? "not_requested");
    const previousRefundId = String(booking.refundId ?? "");
    const stateChanged =
      previousStatus !== incomingStatus || previousRefundId !== refund.id;

    if (refundEntry) writeCommerceLedgerEntry(transaction, db, refundEntry);
    transaction.update(bookingRef, {
      ...(incomingStatus === "succeeded" && fullRefund
        ? { status: "cancelled", paymentStatus: "refunded" }
        : incomingStatus === "failed"
          ? { paymentStatus: "refund_failed" }
          : incomingStatus === "review_required"
            ? { paymentStatus: "paid" }
            : { paymentStatus: "refund_pending" }),
      refundStatus: incomingStatus,
      refundId: refund.id,
      refundOperationId: resolvedOperationId,
      refundAmountCents: refund.amount,
      refundReason: refund.metadata?.reason ?? booking.refundReason ?? null,
      refundFailureReason: refund.failure_reason ?? null,
      commerceLedgerLatestRefundId: refundEntry?.id ?? null,
      commerceLedgerLatestRefundStatus:
        refundEntry?.status ?? "review_required",
      commerceLedgerUpdatedAt: now,
      refundUpdatedAt: now,
      updatedAt: now,
    });

    transaction.set(
      db.collection("commerceRefundOperations").doc(resolvedOperationId),
      {
        bookingId: bookingSnapshot.id,
        bookingReference: String(booking.reference ?? bookingSnapshot.id),
        listingName: String(booking.listingName ?? "VI Guide booking"),
        guestEmail: String(booking.email ?? ""),
        paymentIntentId,
        amountCents: paidAmountCents,
        currency: refund.currency ?? "usd",
        refundId: refund.id,
        status: incomingStatus,
        refundAmountCents: refund.amount,
        fullRefund,
        metadataOperationId: metadataOperationId ?? null,
        metadataOperationMismatch,
        metadataBookingId: metadataBookingId ?? null,
        metadataBookingMismatch,
        failureReason: refund.failure_reason ?? null,
        ledgerEntryId: refundEntry?.id ?? null,
        updatedAt: now,
        serverUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    if (stateChanged) {
      if (incomingStatus === "succeeded" && fullRefund) {
        writeRefundNotifications(transaction, db, {
          reference: String(booking.reference ?? bookingSnapshot.id),
          listingName: String(booking.listingName ?? "VI Guide booking"),
          amountCents: refund.amount,
          status: "succeeded",
          now,
        });
      } else if (
        incomingStatus === "failed" ||
        incomingStatus === "review_required"
      ) {
        writeRefundNotifications(transaction, db, {
          reference: String(booking.reference ?? bookingSnapshot.id),
          listingName: String(booking.listingName ?? "VI Guide booking"),
          amountCents: refund.amount,
          status: incomingStatus,
          now,
        });
      }
    }

    transaction.set(eventRef, {
      type: event.type,
      bookingId: bookingSnapshot.id,
      refundId: refund.id,
      operationId: resolvedOperationId,
      metadataOperationId: metadataOperationId ?? null,
      metadataOperationMismatch,
      metadataBookingId: metadataBookingId ?? null,
      metadataBookingMismatch,
      paymentIntentId,
      refundStatus: incomingStatus,
      refundAmountCents: refund.amount,
      paidAmountCents,
      fullRefund,
      ledgerEntryId: refundEntry?.id ?? null,
      outcome:
        incomingStatus === "review_required"
          ? "commerce_refund_requires_review"
          : "commerce_refund_reconciled",
      processedAt: FieldValue.serverTimestamp(),
    });
  });
}

function writeCommerceLedgerEntry(
  transaction: FirebaseFirestore.Transaction,
  db: Firestore,
  entry: CommerceLedgerEntry,
) {
  transaction.set(
    db.collection("commerceLedgerEntries").doc(entry.id),
    {
      ...entry,
      serverUpdatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

function bookingLedgerCapturePatch(entry: CommerceLedgerEntry, now: string) {
  return {
    commerceLedgerCaptureId: entry.id,
    commerceLedgerCaptureStatus: entry.status,
    commerceGrossAmountCents: entry.grossAmountCents,
    commercePlatformFeeCents: entry.platformFeeCents,
    commerceMerchantSettlementCents: entry.merchantSettlementCents,
    commerceUnallocatedAmountCents: entry.unallocatedAmountCents,
    commercePlatformFeeBps: entry.feeBps,
    commerceFeePolicySource: entry.feePolicySource,
    commerceLedgerUpdatedAt: now,
  };
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
    transaction.set(db.collection("notifications").doc(), {
      audience,
      kind: "booking",
      priority: "high",
      title: input.status === "succeeded" ? "Refund issued" : "Refund needs review",
      message:
        input.status === "succeeded"
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

function stripeEventOccurredAt(event: Stripe.Event) {
  return new Date(event.created * 1000).toISOString();
}

function storedNonNegativeMoney(value: unknown, fallback: number) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : fallback;
}

function normalizeLedgerPolicySource(value: unknown) {
  return value === "environment" ? "environment" : "unconfigured";
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
