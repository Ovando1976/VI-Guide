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
      return NextResponse.json({
        ok: true,
        reconciled: false,
        booking: paymentBookingPayload(booking),
      });
    }

    const paymentIntent = await getStripe().paymentIntents.retrieve(
      booking.paymentIntentId,
    );

    const result = await db.runTransaction(async (transaction) => {
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

      const integrityIssue = paymentIntentIntegrityIssue(paymentIntent, current);
      if (integrityIssue) {
        transaction.update(bookingRef, {
          paymentIntegrityStatus: "review_required",
          paymentIntegrityIssue: integrityIssue,
          paymentStateSource: "reconciliation",
          paymentReconciledAt: FieldValue.serverTimestamp(),
          paymentUpdatedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return {
          reviewRequired: true,
          integrityIssue,
          booking: {
            ...current,
            paymentIntegrityStatus: "review_required" as const,
            paymentIntegrityIssue: integrityIssue,
          },
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
      return {
        reviewRequired: false,
        integrityIssue: null,
        booking: {
          ...current,
          paymentStatus,
          paymentIntentId: paymentIntent.id,
          amountAuthorized: paymentIntent.amount,
          amountCaptured:
            paymentIntent.status === "succeeded"
              ? paymentIntent.amount_received
              : (current.amountCaptured ?? null),
        },
      };
    });

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
    origin: { estateName: booking.origin?.estateName },
    destination: { estateName: booking.destination?.estateName },
  };
}
