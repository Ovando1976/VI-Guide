import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  bookingPaymentUpdate,
  paymentIntentIntegrityIssue,
  paymentStatusFromStripe,
} from "@/lib/booking-payment-state";
import { getAdminDb } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";
import type { RideBooking } from "@/types/mobility";

type Context = {
  params: { bookingId: string };
};

type ReconciliationResult = {
  reviewRequired: boolean;
  integrityIssue: string | null;
  booking: RideBooking;
};

export async function POST(_request: NextRequest, context: Context) {
  try {
    const session = await requireSession();
    const bookingId = context.params.bookingId.trim();
    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const bookingRef = db.collection("bookings").doc(bookingId);
    const snapshot = await bookingRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const booking = { id: snapshot.id, ...snapshot.data() } as RideBooking;
    const privileged = session.role === "admin" || session.role === "dispatcher";
    if (!privileged && booking.riderId !== session.uid) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (!booking.paymentIntentId) {
      const reviewRequired =
        booking.paymentStatus === "paid" || Number(booking.amountCaptured ?? 0) > 0;
      const integrityIssue = reviewRequired
        ? "This booking is marked paid or captured without a Stripe payment reference."
        : null;
      if (reviewRequired) {
        await bookingRef.update({
          paymentStatus: "paid",
          paymentIntegrityStatus: "review_required",
          paymentIntegrityIssue: integrityIssue,
          paymentStateSource: "reconciliation",
          paymentReconciledAt: FieldValue.serverTimestamp(),
          paymentUpdatedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      const currentBooking: RideBooking = {
        ...booking,
        ...(reviewRequired
          ? {
              paymentStatus: "paid" as const,
              paymentIntegrityStatus: "review_required" as const,
              paymentIntegrityIssue: integrityIssue,
            }
          : {}),
      };

      return NextResponse.json({
        ok: true,
        reconciled: false,
        reviewRequired,
        integrityIssue,
        booking: paymentBookingPayload(currentBooking),
      });
    }

    const paymentIntent = await getStripe().paymentIntents.retrieve(
      booking.paymentIntentId,
    );

    const result = await db.runTransaction<ReconciliationResult>(
      async (transaction): Promise<ReconciliationResult> => {
        const currentSnapshot = await transaction.get(bookingRef);
        if (!currentSnapshot.exists) throw new Error("Booking not found.");

        const current = {
          id: currentSnapshot.id,
          ...currentSnapshot.data(),
        } as RideBooking;
        if (current.paymentIntentId !== paymentIntent.id) {
          throw new Error(
            "The booking payment reference changed during reconciliation.",
          );
        }

        const locallyProtected =
          current.paymentStatus === "paid" ||
          Number(current.amountCaptured ?? 0) > 0;
        if (locallyProtected && paymentIntent.status !== "succeeded") {
          const integrityIssue = `The booking is locally marked paid or captured, but Stripe currently reports ${paymentIntent.status}.`;
          transaction.update(bookingRef, {
            paymentStatus: "paid",
            paymentIntegrityStatus: "review_required",
            paymentIntegrityIssue: integrityIssue,
            paymentStateSource: "reconciliation",
            paymentReconciledAt: FieldValue.serverTimestamp(),
            paymentUpdatedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          const protectedBooking: RideBooking = {
            ...current,
            paymentStatus: "paid",
            paymentIntegrityStatus: "review_required",
            paymentIntegrityIssue: integrityIssue,
          };

          return {
            reviewRequired: true,
            integrityIssue,
            booking: protectedBooking,
          };
        }

        let integrityIssue: string | null = null;
        try {
          integrityIssue = paymentIntentIntegrityIssue(paymentIntent, current);
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
                  existingAmountCaptured: current.amountCaptured,
                  source: "reconciliation",
                })
              : {
                  paymentStateSource: "reconciliation",
                  paymentReconciledAt: FieldValue.serverTimestamp(),
                  paymentUpdatedAt: FieldValue.serverTimestamp(),
                  updatedAt: FieldValue.serverTimestamp(),
                }),
            paymentIntegrityStatus: "review_required",
            paymentIntegrityIssue: integrityIssue,
          });

          const reviewBooking: RideBooking = {
            ...current,
            paymentStatus: captured ? "paid" : current.paymentStatus,
            paymentIntentId: paymentIntent.id,
            amountAuthorized: paymentIntent.amount,
            amountCaptured: captured
              ? paymentIntent.amount_received
              : (current.amountCaptured ?? null),
            paymentIntegrityStatus: "review_required",
            paymentIntegrityIssue: integrityIssue,
          };

          return {
            reviewRequired: true,
            integrityIssue,
            booking: reviewBooking,
          };
        }

        const paymentStatus = paymentStatusFromStripe(paymentIntent);
        transaction.update(
          bookingRef,
          bookingPaymentUpdate({
            paymentIntent,
            existingAmountCaptured: current.amountCaptured,
            source: "reconciliation",
          }),
        );

        const reconciledBooking: RideBooking = {
          ...current,
          paymentStatus,
          paymentIntentId: paymentIntent.id,
          amountAuthorized: paymentIntent.amount,
          amountCaptured:
            paymentIntent.status === "succeeded"
              ? paymentIntent.amount_received
              : (current.amountCaptured ?? null),
          paymentIntegrityStatus: "verified",
          paymentIntegrityIssue: null,
        };

        return {
          reviewRequired: false,
          integrityIssue: null,
          booking: reconciledBooking,
        };
      },
    );

    return NextResponse.json({
      ok: true,
      reconciled: true,
      reviewRequired: result.reviewRequired,
      integrityIssue: result.integrityIssue,
      booking: paymentBookingPayload(result.booking),
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("booking payment reconciliation error", error);
    const message =
      error instanceof Error ? error.message : "Unable to reconcile payment.";
    return NextResponse.json(
      { error: message },
      { status: message === "Booking not found." ? 404 : 500 },
    );
  }
}

function paymentBookingPayload(booking: RideBooking) {
  return {
    id: booking.id,
    status: booking.status,
    paymentStatus: booking.paymentStatus ?? "unpaid",
    paymentIntentId: booking.paymentIntentId ?? null,
    amountAuthorized: booking.amountAuthorized ?? null,
    amountCaptured: booking.amountCaptured ?? null,
    paymentIntegrityStatus: booking.paymentIntegrityStatus ?? null,
    paymentIntegrityIssue: booking.paymentIntegrityIssue ?? null,
    origin: { estateName: booking.origin?.estateName },
    destination: { estateName: booking.destination?.estateName },
  };
}
