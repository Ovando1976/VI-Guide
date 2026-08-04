import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import {
  buildCommerceRefundOperationId,
  commerceRefundEligibilityError,
  commerceRefundStatusFromStripe,
  normalizeCommerceRefundStatus,
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
      const existingOperation = operationSnapshot.data() ?? {};
      const existingStatus = normalizeCommerceRefundStatus(
        existingOperation.status,
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
        if (existingStatus === "succeeded") {
          throw new RefundActionError(
            "This booking has already been refunded.",
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
          refundStatus: normalizeCommerceRefundStatus(booking.refundStatus),
          expectedReference: reference,
          confirmedReference,
        });
        if (eligibilityError) {
          throw new RefundActionError(eligibilityError, 409);
        }
      }

      if (confirmedReference !== reference) {
        throw new RefundActionError(
          "Type the exact booking reference to authorize this refund.",
          409,
        );
      }

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
          requestedAt: existingOperation.requestedAt ?? now,
          updatedAt: now,
          serverUpdatedAt: FieldValue.serverTimestamp(),
          attemptCount: Number(existingOperation.attemptCount ?? 0) + 1,
        },
        { merge: true },
      );
      transaction.update(bookingRef, {
        paymentStatus: "refund_pending",
        refundStatus: "processing",
        refundOperationId: operationId,
        refundReason: reason,
        refundFailureReason: null,
        refundRequestedAt: booking.refundRequestedAt ?? now,
        refundUpdatedAt: now,
        updatedAt: now,
      });

      return {
        bookingId,
        reference,
        listingName: String(booking.listingName ?? "VI Guide booking"),
        paymentIntentId: currentPaymentIntentId,
        paidAmountCents: currentPaidAmountCents,
      };
    });

    let refund;
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
            reason,
          },
        },
        { idempotencyKey: `vi-guide-commerce-refund-${operationId}` },
      );
    } catch (error) {
      const message = stripeErrorMessage(error);
      const now = new Date().toISOString();
      const batch = db.batch();
      batch.update(operationRef, {
        status: "failed",
        failureReason: message,
        updatedAt: now,
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });
      batch.update(bookingRef, {
        paymentStatus: "refund_failed",
        refundStatus: "failed",
        refundFailureReason: message,
        refundUpdatedAt: now,
        updatedAt: now,
      });
      writeOperationsReviewNotification(batch, db, {
        reference: refundInput.reference,
        listingName: refundInput.listingName,
        amountCents: refundInput.paidAmountCents,
        status: "failed",
        now,
      });
      await batch.commit();
      return NextResponse.json(
        {
          error:
            "Stripe could not complete this refund. The operation remains visible for review.",
        },
        { status: 502 },
      );
    }

    const stripeStatus = commerceRefundStatusFromStripe(refund.status);
    const fullRefund = refund.amount === refundInput.paidAmountCents;
    const finalStatus =
      stripeStatus === "succeeded" && !fullRefund
        ? "review_required"
        : stripeStatus;
    const now = new Date().toISOString();

    await db.runTransaction(async (transaction) => {
      const bookingSnapshot = await transaction.get(bookingRef);
      if (!bookingSnapshot.exists) return;
      const booking = bookingSnapshot.data() ?? {};
      const previousRefundStatus = String(
        booking.refundStatus ?? "not_requested",
      );

      transaction.update(operationRef, {
        refundId: refund.id,
        status: finalStatus,
        refundAmountCents: refund.amount,
        fullRefund,
        failureReason: refund.failure_reason ?? null,
        updatedAt: now,
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(bookingRef, {
        ...(finalStatus === "succeeded" && fullRefund
          ? { status: "cancelled", paymentStatus: "refunded" }
          : finalStatus === "failed"
            ? { paymentStatus: "refund_failed" }
            : finalStatus === "review_required"
              ? { paymentStatus: "paid" }
              : { paymentStatus: "refund_pending" }),
        refundStatus: finalStatus,
        refundId: refund.id,
        refundAmountCents: refund.amount,
        refundFailureReason: refund.failure_reason ?? null,
        refundUpdatedAt: now,
        updatedAt: now,
      });

      if (finalStatus === "succeeded" && fullRefund) {
        if (previousRefundStatus !== "succeeded") {
          writeRefundNotifications(transaction, db, {
            reference: refundInput.reference,
            listingName: refundInput.listingName,
            amountCents: refund.amount,
            now,
          });
        }
      } else if (
        (finalStatus === "failed" || finalStatus === "review_required") &&
        previousRefundStatus !== finalStatus
      ) {
        writeOperationsReviewNotification(transaction, db, {
          reference: refundInput.reference,
          listingName: refundInput.listingName,
          amountCents: refund.amount,
          status: finalStatus,
          now,
        });
      }
    });

    return NextResponse.json({
      ok: true,
      operationId,
      refundId: refund.id,
      refundStatus: finalStatus,
      amountCents: refund.amount,
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
    const notificationRef = db.collection("notifications").doc();
    transaction.set(notificationRef, {
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

function writeOperationsReviewNotification(
  writer: FirebaseFirestore.WriteBatch | FirebaseFirestore.Transaction,
  db: FirebaseFirestore.Firestore,
  input: {
    reference: string;
    listingName: string;
    amountCents: number;
    status: "failed" | "review_required";
    now: string;
  },
) {
  const notificationRef = db.collection("notifications").doc();
  writer.set(notificationRef, {
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
  });
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
