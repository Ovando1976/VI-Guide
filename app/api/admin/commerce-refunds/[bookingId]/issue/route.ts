import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import {
  buildCommerceRefundIdempotencyKey,
  buildCommerceRefundOperationId,
  commerceRefundEligibilityError,
  commerceRefundEventDecision,
  commerceRefundRequestFailureDisposition,
  commerceRefundStatusFromStripe,
  normalizeCommerceRefundStatus,
  type CommerceRefundStatus,
} from "@/lib/payments/commerce-refund-integrity";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } },
) {
  try {
    const session = await requireSession(["admin"]);
    if (!hasFirebaseAdminConfiguration() || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Commerce refunds are not configured on the server." },
        { status: 503 },
      );
    }

    const bookingId = clean(params.bookingId, 180);
    const body = (await request.json().catch(() => null)) as
      | { reason?: unknown; confirmReference?: unknown }
      | null;
    const reason = clean(body?.reason, 400);
    const confirmedReference = clean(body?.confirmReference, 180);

    if (!bookingId || reason.length < 4) {
      return NextResponse.json(
        { error: "Enter a clear refund reason." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const bookingRef = db.collection("commerceBookings").doc(bookingId);
    const initialSnapshot = await bookingRef.get();
    if (!initialSnapshot.exists) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const initial = initialSnapshot.data() ?? {};
    const paymentIntentId = String(initial.paymentIntentId ?? "").trim();
    const paidAmountCents = Number(initial.paidAmountCents ?? 0);
    const operationId = buildCommerceRefundOperationId({
      bookingId,
      paymentIntentId,
      paidAmountCents,
    });
    const operationRef = db.collection("commerceRefundOperations").doc(operationId);

    const refundInput = await db.runTransaction(async (transaction) => {
      const [bookingSnapshot, operationSnapshot] = await Promise.all([
        transaction.get(bookingRef),
        transaction.get(operationRef),
      ]);
      if (!bookingSnapshot.exists) {
        throw new RefundActionError("Booking not found.", 404);
      }

      const booking = bookingSnapshot.data() ?? {};
      const currentPaymentIntentId = String(booking.paymentIntentId ?? "").trim();
      const currentPaidAmountCents = Number(booking.paidAmountCents ?? 0);
      if (
        currentPaymentIntentId !== paymentIntentId ||
        currentPaidAmountCents !== paidAmountCents
      ) {
        throw new RefundActionError(
          "The captured payment changed before the refund was authorized. Refresh and review the booking again.",
          409,
        );
      }

      const reference = String(booking.reference ?? bookingId);
      if (confirmedReference !== reference) {
        throw new RefundActionError(
          "Type the exact booking reference to authorize this refund.",
          409,
        );
      }

      const existingOperation = operationSnapshot.data() ?? {};
      const existingStatus = normalizeCommerceRefundStatus(
        existingOperation.status,
      );
      const bookingRefundStatus = normalizeCommerceRefundStatus(
        booking.refundStatus,
      );

      if (operationSnapshot.exists) {
        if (
          String(existingOperation.paymentIntentId ?? "") !==
            currentPaymentIntentId ||
          Number(existingOperation.amountCents ?? 0) !== currentPaidAmountCents
        ) {
          throw new RefundActionError(
            "The stored refund operation does not match the current payment.",
            409,
          );
        }
        if (existingStatus === "processing") {
          throw new RefundActionError(
            "A refund attempt is already processing for this booking.",
            409,
          );
        }
        if (existingStatus === "succeeded") {
          throw new RefundActionError(
            "This booking has already been refunded.",
            409,
          );
        }
        if (existingStatus === "failed") {
          throw new RefundActionError(
            "This refund failed and requires manual financial review before another attempt.",
            409,
          );
        }
        if (existingStatus === "review_required") {
          throw new RefundActionError(
            "This refund requires manual financial review.",
            409,
          );
        }
      } else {
        const eligibilityError = commerceRefundEligibilityError({
          bookingStatus: String(booking.status ?? "requested"),
          paymentStatus: String(booking.paymentStatus ?? "unpaid"),
          paymentIntentId: currentPaymentIntentId,
          paidAmountCents: currentPaidAmountCents,
          refundStatus: bookingRefundStatus,
          expectedReference: reference,
          confirmedReference,
        });
        if (eligibilityError) {
          throw new RefundActionError(eligibilityError, 409);
        }
      }

      const attemptNumber = 1;
      const now = new Date().toISOString();
      transaction.set(
        operationRef,
        {
          bookingId,
          bookingReference: reference,
          listingName: String(booking.listingName ?? "VI Guide booking"),
          guestEmail: String(booking.email ?? ""),
          paymentIntentId: currentPaymentIntentId,
          amountCents: currentPaidAmountCents,
          currency: "usd",
          reason,
          originalBookingStatus: String(booking.status ?? "paid"),
          status: "processing",
          requestedBy: session.uid,
          requestedByEmail: session.email ?? null,
          requestedAt: now,
          updatedAt: now,
          serverUpdatedAt: FieldValue.serverTimestamp(),
          attemptCount: attemptNumber,
          activeAttemptNumber: attemptNumber,
          failureReason: null,
        },
        { merge: false },
      );
      transaction.update(bookingRef, {
        paymentStatus: "refund_pending",
        refundStatus: "processing",
        refundOperationId: operationId,
        refundReason: reason,
        refundFailureReason: null,
        refundRequestedAt: now,
        refundUpdatedAt: now,
        updatedAt: now,
      });

      return {
        bookingId,
        reference,
        listingName: String(booking.listingName ?? "VI Guide booking"),
        paymentIntentId: currentPaymentIntentId,
        paidAmountCents: currentPaidAmountCents,
        attemptNumber,
      };
    });

    let refund: Stripe.Refund;
    try {
      refund = await getStripe().refunds.create(
        {
          payment_intent: refundInput.paymentIntentId,
          amount: refundInput.paidAmountCents,
          reason: "requested_by_customer",
          metadata: {
            bookingId: refundInput.bookingId,
            bookingReference: refundInput.reference,
            operationId,
            attemptNumber: String(refundInput.attemptNumber),
            reason,
          },
        },
        {
          idempotencyKey: buildCommerceRefundIdempotencyKey({
            operationId,
            attemptNumber: refundInput.attemptNumber,
          }),
        },
      );
    } catch (error) {
      const candidate =
        error && typeof error === "object"
          ? (error as { type?: unknown; statusCode?: unknown })
          : {};
      const disposition = commerceRefundRequestFailureDisposition(candidate);
      const message = stripeErrorMessage(error);
      const now = new Date().toISOString();
      let recordedDisposition = false;

      await db.runTransaction(async (transaction) => {
        const [bookingSnapshot, operationSnapshot] = await Promise.all([
          transaction.get(bookingRef),
          transaction.get(operationRef),
        ]);
        if (!bookingSnapshot.exists || !operationSnapshot.exists) return;

        const booking = bookingSnapshot.data() ?? {};
        const operation = operationSnapshot.data() ?? {};
        const operationStatus = normalizeCommerceRefundStatus(operation.status);
        const bookingStatus = normalizeCommerceRefundStatus(booking.refundStatus);
        const refundAlreadyExists = Boolean(
          String(operation.refundId ?? booking.refundId ?? "").trim(),
        );
        if (
          refundAlreadyExists ||
          operationStatus === "succeeded" ||
          operationStatus === "review_required" ||
          bookingStatus === "succeeded" ||
          bookingStatus === "review_required"
        ) {
          return;
        }

        const nextStatus: CommerceRefundStatus =
          disposition === "definitive_failure" ? "failed" : "review_required";
        transaction.update(operationRef, {
          status: nextStatus,
          failureDisposition: disposition,
          failureReason: message,
          failedAttemptNumber: refundInput.attemptNumber,
          updatedAt: now,
          serverUpdatedAt: FieldValue.serverTimestamp(),
        });
        transaction.update(bookingRef, {
          paymentStatus:
            disposition === "definitive_failure" ? "refund_failed" : "paid",
          refundStatus: nextStatus,
          refundFailureReason: message,
          refundUpdatedAt: now,
          updatedAt: now,
        });
        transaction.set(
          db.collection("notifications").doc(),
          operationsReviewNotificationData({
            reference: refundInput.reference,
            listingName: refundInput.listingName,
            amountCents: refundInput.paidAmountCents,
            status: nextStatus,
            now,
          }),
        );
        recordedDisposition = true;
      });

      return NextResponse.json(
        {
          error: !recordedDisposition
            ? "Stripe returned an uncertain result. The refund remains in reconciliation and was not marked failed."
            : disposition === "definitive_failure"
              ? "Stripe rejected this refund. Operations must review the failure before any further attempt."
              : "Stripe did not confirm whether the refund was created. Operations must reconcile it before another attempt.",
        },
        { status: 502 },
      );
    }

    const returnedPaymentIntentId = expandableId(refund.payment_intent);
    const paymentIntentMatches =
      returnedPaymentIntentId === refundInput.paymentIntentId;
    const fullRefund = refund.amount === refundInput.paidAmountCents;
    const stripeStatus = commerceRefundStatusFromStripe(refund.status);
    const incomingStatus: CommerceRefundStatus =
      stripeStatus === "succeeded" && (!fullRefund || !paymentIntentMatches)
        ? "review_required"
        : stripeStatus;
    const now = new Date().toISOString();

    await db.runTransaction(async (transaction) => {
      const [bookingSnapshot, operationSnapshot] = await Promise.all([
        transaction.get(bookingRef),
        transaction.get(operationRef),
      ]);
      if (!bookingSnapshot.exists || !operationSnapshot.exists) return;

      const booking = bookingSnapshot.data() ?? {};
      const eventDecision = commerceRefundEventDecision({
        currentStatus: booking.refundStatus,
        currentRefundId: booking.refundId,
        incomingStatus,
        incomingRefundId: refund.id,
      });

      if (eventDecision === "ignore_stale") {
        transaction.update(operationRef, {
          lastIgnoredRefundId: refund.id,
          lastIgnoredRefundStatus: incomingStatus,
          updatedAt: now,
          serverUpdatedAt: FieldValue.serverTimestamp(),
        });
        return;
      }

      if (eventDecision === "review_multiple_refunds") {
        transaction.update(operationRef, {
          status: "review_required",
          previousRefundId: booking.refundId ?? null,
          additionalRefundId: refund.id,
          updatedAt: now,
          serverUpdatedAt: FieldValue.serverTimestamp(),
        });
        transaction.update(bookingRef, {
          refundStatus: "review_required",
          refundFailureReason:
            "Stripe returned more than one refund object for this captured payment.",
          refundUpdatedAt: now,
          updatedAt: now,
        });
        transaction.set(
          db.collection("notifications").doc(),
          operationsReviewNotificationData({
            reference: refundInput.reference,
            listingName: refundInput.listingName,
            amountCents: refund.amount,
            status: "review_required",
            now,
          }),
        );
        return;
      }

      const previousRefundStatus = normalizeCommerceRefundStatus(
        booking.refundStatus,
      );
      transaction.update(operationRef, {
        refundId: refund.id,
        status: incomingStatus,
        refundAmountCents: refund.amount,
        fullRefund,
        paymentIntentMatches,
        failureReason: refund.failure_reason ?? null,
        completedAttemptNumber: refundInput.attemptNumber,
        updatedAt: now,
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(bookingRef, {
        ...(incomingStatus === "succeeded" && fullRefund && paymentIntentMatches
          ? { status: "cancelled", paymentStatus: "refunded" }
          : incomingStatus === "failed"
            ? { paymentStatus: "refund_failed" }
            : incomingStatus === "review_required"
              ? { paymentStatus: "paid" }
              : { paymentStatus: "refund_pending" }),
        refundStatus: incomingStatus,
        refundId: refund.id,
        refundAmountCents: refund.amount,
        refundFailureReason: refund.failure_reason ?? null,
        refundUpdatedAt: now,
        updatedAt: now,
      });

      if (
        incomingStatus === "succeeded" &&
        fullRefund &&
        paymentIntentMatches &&
        previousRefundStatus !== "succeeded"
      ) {
        writeRefundNotifications(transaction, db, {
          reference: refundInput.reference,
          listingName: refundInput.listingName,
          amountCents: refund.amount,
          now,
        });
      } else if (
        (incomingStatus === "failed" || incomingStatus === "review_required") &&
        previousRefundStatus !== incomingStatus
      ) {
        transaction.set(
          db.collection("notifications").doc(),
          operationsReviewNotificationData({
            reference: refundInput.reference,
            listingName: refundInput.listingName,
            amountCents: refund.amount,
            status: incomingStatus,
            now,
          }),
        );
      }
    });

    return NextResponse.json({
      ok: true,
      operationId,
      refundId: refund.id,
      refundStatus: incomingStatus,
      amountCents: refund.amount,
      attemptNumber: refundInput.attemptNumber,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof RefundActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("commerce refund issue error", error);
    return NextResponse.json(
      { error: "Unable to issue this refund." },
      { status: 500 },
    );
  }
}

class RefundActionError extends Error {
  constructor(
    message: string,
    public status: 404 | 409,
  ) {
    super(message);
  }
}

function writeRefundNotifications(
  transaction: FirebaseFirestore.Transaction,
  db: FirebaseFirestore.Firestore,
  input: {
    reference: string;
    listingName: string;
    amountCents: number;
    now: string;
  },
) {
  for (const audience of ["traveler", "merchant", "operations"] as const) {
    transaction.set(db.collection("notifications").doc(), {
      audience,
      kind: "booking",
      priority: "high",
      title: "Refund issued",
      message: `${formatMoney(input.amountCents)} was refunded for ${input.listingName} booking ${input.reference}.`,
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

function operationsReviewNotificationData(input: {
  reference: string;
  listingName: string;
  amountCents: number;
  status: "failed" | "review_required";
  now: string;
}) {
  return {
    audience: "operations",
    kind: "booking",
    priority: "high",
    title:
      input.status === "failed" ? "Refund failed" : "Refund requires action",
    message: `${formatMoney(input.amountCents)} for ${input.listingName} booking ${input.reference} requires financial review.`,
    href: "/admin/commerce-refunds",
    reference: input.reference,
    readAt: null,
    createdAt: input.now,
    updatedAt: input.now,
    serverCreatedAt: FieldValue.serverTimestamp(),
  };
}

function expandableId(
  value: string | { id?: string } | null | undefined,
) {
  if (typeof value === "string") return value;
  return value?.id ?? null;
}

function stripeErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return clean((error as { message?: unknown }).message, 500) || "Stripe refund failed.";
  }
  return "Stripe refund failed.";
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
