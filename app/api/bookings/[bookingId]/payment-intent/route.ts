import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  bookingPaymentUpdate,
  expectedBookingAmountCents,
  paymentIntentIdempotencyKey,
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
    if (booking.status === "cancelled" || booking.status === "completed") {
      return NextResponse.json(
        { error: "This booking can no longer be paid." },
        { status: 409 },
      );
    }

    const amount = expectedBookingAmountCents(booking);
    const stripe = getStripe();
    const locallyProtected =
      booking.paymentStatus === "paid" || Number(booking.amountCaptured ?? 0) > 0;

    if (locallyProtected && !booking.paymentIntentId) {
      const integrityIssue =
        "This booking is marked paid or captured without a Stripe payment reference.";
      await bookingRef.update({
        paymentStatus: "paid",
        paymentIntegrityStatus: "review_required",
        paymentIntegrityIssue: integrityIssue,
        paymentStateSource: "payment_intent_api",
        paymentUpdatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json(
        {
          error:
            "This payment requires staff review. No additional charge was created.",
          code: "PAYMENT_REVIEW_REQUIRED",
          alreadyPaid: true,
          reviewRequired: true,
          paymentStatus: "paid",
        },
        { status: 409 },
      );
    }

    let paymentIntent = booking.paymentIntentId
      ? await stripe.paymentIntents.retrieve(booking.paymentIntentId)
      : null;

    if (locallyProtected && paymentIntent) {
      const integrityIssue = paymentIntentIntegrityIssue(paymentIntent, booking);
      if (paymentIntent.status === "succeeded") {
        await bookingRef.update({
          ...bookingPaymentUpdate({
            paymentIntent,
            existingAmountCaptured: booking.amountCaptured,
            source: "payment_intent_api",
          }),
          ...(integrityIssue
            ? {
                paymentIntegrityStatus: "review_required",
                paymentIntegrityIssue: integrityIssue,
              }
            : {}),
        });
        return NextResponse.json({
          ok: true,
          bookingId,
          alreadyPaid: true,
          reviewRequired: Boolean(integrityIssue),
          paymentIntentId: paymentIntent.id,
          paymentStatus: "paid",
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          ...(integrityIssue ? { message: integrityIssue } : {}),
        });
      }

      const protectedStateIssue =
        `The booking is locally marked paid or captured, but Stripe currently reports ${paymentIntent.status}.`;
      await bookingRef.update({
        paymentStatus: "paid",
        paymentIntegrityStatus: "review_required",
        paymentIntegrityIssue: protectedStateIssue,
        paymentStateSource: "payment_intent_api",
        paymentReconciledAt: FieldValue.serverTimestamp(),
        paymentUpdatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json(
        {
          error:
            "This payment requires staff review. No additional charge was created.",
          code: "PAYMENT_REVIEW_REQUIRED",
          alreadyPaid: true,
          reviewRequired: true,
          paymentStatus: "paid",
        },
        { status: 409 },
      );
    }

    if (paymentIntent) {
      const integrityIssue = paymentIntentIntegrityIssue(paymentIntent, booking);
      if (integrityIssue) {
        if (paymentIntent.status === "succeeded") {
          await bookingRef.update({
            paymentStatus: "paid",
            paymentIntentId: paymentIntent.id,
            amountAuthorized: paymentIntent.amount,
            amountCaptured: paymentIntent.amount_received,
            paymentIntegrityStatus: "review_required",
            paymentIntegrityIssue: integrityIssue,
            paymentStateSource: "payment_intent_api",
            paymentReconciledAt: FieldValue.serverTimestamp(),
            paymentUpdatedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          return NextResponse.json({
            ok: true,
            bookingId,
            alreadyPaid: true,
            reviewRequired: true,
            paymentStatus: "paid",
            message:
              "Payment was captured, but the booking amount or metadata changed and requires staff review. No second charge was created.",
          });
        }

        if (paymentIntent.status !== "canceled") {
          await stripe.paymentIntents.cancel(paymentIntent.id);
        }
        paymentIntent = null;
      }
    }

    if (paymentIntent?.status === "succeeded") {
      await bookingRef.update(
        bookingPaymentUpdate({
          paymentIntent,
          existingAmountCaptured: booking.amountCaptured,
          source: "payment_intent_api",
        }),
      );
      return NextResponse.json({
        ok: true,
        bookingId,
        alreadyPaid: true,
        paymentIntentId: paymentIntent.id,
        paymentStatus: "paid",
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });
    }

    if (paymentIntent?.status === "processing") {
      await bookingRef.update(
        bookingPaymentUpdate({
          paymentIntent,
          existingAmountCaptured: booking.amountCaptured,
          source: "payment_intent_api",
        }),
      );
      return NextResponse.json({
        ok: true,
        bookingId,
        paymentPending: true,
        paymentIntentId: paymentIntent.id,
        paymentStatus: "processing",
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });
    }

    if (!paymentIntent || paymentIntent.status === "canceled") {
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount,
          currency: "usd",
          automatic_payment_methods: { enabled: true },
          description: `VI Guide taxi booking ${bookingId}`,
          metadata: {
            bookingId,
            riderId: booking.riderId,
            island: booking.island,
            product: "taxi_booking",
            tariffId: booking.quotedFare.tariffId,
            tariffVersion: booking.quotedFare.tariffVersion,
            rateRuleId: booking.quotedFare.rateRuleId,
          },
        },
        { idempotencyKey: paymentIntentIdempotencyKey(booking) },
      );
    }

    if (!paymentIntent.client_secret) {
      return NextResponse.json(
        { error: "Payment could not be initialized." },
        { status: 502 },
      );
    }

    await bookingRef.update({
      ...bookingPaymentUpdate({
        paymentIntent,
        existingAmountCaptured: booking.amountCaptured,
        source: "payment_intent_api",
      }),
      paymentExpectedAmount: amount,
      paymentQuoteTariffId: booking.quotedFare.tariffId,
      paymentQuoteTariffVersion: booking.quotedFare.tariffVersion,
      paymentInitializedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      bookingId,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency: "usd",
      paymentStatus: paymentStatusFromStripe(paymentIntent),
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("booking payment intent error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to initialize payment.",
      },
      { status: 500 },
    );
  }
}
