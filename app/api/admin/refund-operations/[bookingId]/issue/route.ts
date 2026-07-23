import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import type Stripe from "stripe";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";
import type {
  RideBooking,
  RideBookingRefundStatus,
} from "@/types/mobility";

type Context = {
  params: { bookingId: string };
};

export async function POST(_request: NextRequest, context: Context) {
  try {
    const session = await requireSession(["admin"]);
    const bookingId = context.params.bookingId.trim();
    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const bookingRef = db.collection("bookings").doc(bookingId);
    const operationRef = db.collection("refundOperations").doc(bookingId);

    const booking = await db.runTransaction<RideBooking>(async (transaction) => {
      const [bookingSnapshot, operationSnapshot] = await Promise.all([
        transaction.get(bookingRef),
        transaction.get(operationRef),
      ]);
      if (!bookingSnapshot.exists) throw new Error("Booking not found.");

      const current = {
        id: bookingSnapshot.id,
        ...bookingSnapshot.data(),
      } as RideBooking;
      if (current.status !== "cancelled") {
        throw new Error("Only a cancelled booking can be refunded here.");
      }
      if (!current.paymentIntentId) {
        throw new Error("The booking has no Stripe PaymentIntent to refund.");
      }
      if (current.unexpectedCapturedPaymentIntentId) {
        throw new Error(
          "This booking has more than one captured PaymentIntent and requires manual Stripe review.",
        );
      }

      const capturedAmount = Math.max(0, Number(current.amountCaptured ?? 0));
      if (!Number.isSafeInteger(capturedAmount) || capturedAmount < 1) {
        throw new Error("The booking has no captured amount to refund.");
      }
      if (current.refundStatus === "succeeded") {
        return current;
      }

      const operationData = operationSnapshot.data();
      transaction.set(
        operationRef,
        {
          bookingId,
          status: "creating",
          actorId: session.uid,
          paymentIntentId: current.paymentIntentId,
          amount: capturedAmount,
          previousRefundId: current.refundId ?? null,
          attemptCount: Number(operationData?.attemptCount ?? 0) + 1,
          createdAt:
            operationData?.createdAt ?? FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      transaction.update(bookingRef, {
        refundStatus: "processing",
        refundRequestedAmount: capturedAmount,
        refundReason:
          current.refundReason || "Cancelled ride refund approved by staff.",
        refundFailureReason: null,
        refundUpdatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        ...current,
        refundStatus: "processing",
        refundRequestedAmount: capturedAmount,
        refundFailureReason: null,
      };
    });

    if (booking.refundStatus === "succeeded") {
      return NextResponse.json({
        ok: true,
        bookingId,
        refundStatus: "succeeded",
        refundId: booking.refundId ?? null,
        refundAmount: booking.refundAmount ?? booking.amountCaptured ?? null,
        alreadyRefunded: true,
      });
    }

    let refund: Stripe.Refund;
    try {
      const stripe = getStripe();
      if (booking.refundId) {
        refund = await stripe.refunds.retrieve(booking.refundId);
      } else {
        const amount = Math.max(0, Number(booking.amountCaptured ?? 0));
        refund = await stripe.refunds.create(
          {
            payment_intent: booking.paymentIntentId!,
            amount,
            reason: "requested_by_customer",
            metadata: {
              bookingId,
              riderId: booking.riderId,
              island: booking.island,
              product: "taxi_booking_refund",
            },
          },
          { idempotencyKey: `booking-refund-${bookingId}-${amount}` },
        );
      }
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Stripe refund request failed.";
      await Promise.all([
        bookingRef.update({
          refundStatus: "failed",
          refundFailureReason: reason,
          refundUpdatedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }),
        operationRef.set(
          {
            bookingId,
            status: "failed",
            actorId: session.uid,
            paymentIntentId: booking.paymentIntentId,
            amount: booking.amountCaptured ?? null,
            failureReason: reason,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        ),
      ]);
      throw new Error(`Stripe refund failed: ${reason}`);
    }

    const refundStatus = mapRefundStatus(refund.status);
    const succeeded = refundStatus === "succeeded";
    const batch = db.batch();
    batch.update(bookingRef, {
      refundId: refund.id,
      refundStatus,
      refundAmount: refund.amount,
      refundFailureReason:
        refundStatus === "failed"
          ? refund.failure_reason ?? "Stripe refund failed."
          : null,
      ...(succeeded
        ? {
            paymentStatus: "refunded",
            paymentIntegrityStatus: "verified",
            paymentIntegrityIssue: null,
          }
        : {}),
      refundUpdatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.set(
      operationRef,
      {
        bookingId,
        status: refundStatus,
        actorId: session.uid,
        paymentIntentId: booking.paymentIntentId,
        refundId: refund.id,
        amount: refund.amount,
        stripeRefundStatus: refund.status,
        failureReason: refund.failure_reason ?? null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    batch.set(
      db.collection("refundAudit").doc(refund.id),
      {
        action: "refund_issued",
        bookingId,
        actorId: session.uid,
        paymentIntentId: booking.paymentIntentId,
        refundId: refund.id,
        amount: refund.amount,
        refundStatus,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    await batch.commit();

    return NextResponse.json({
      ok: true,
      bookingId,
      refundId: refund.id,
      refundStatus,
      refundAmount: refund.amount,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("issue booking refund error", error);
    const message =
      error instanceof Error ? error.message : "Unable to issue refund.";
    return NextResponse.json(
      { error: message },
      {
        status:
          message === "Booking not found."
            ? 404
            : message.startsWith("Stripe refund failed:")
              ? 502
              : 400,
      },
    );
  }
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
