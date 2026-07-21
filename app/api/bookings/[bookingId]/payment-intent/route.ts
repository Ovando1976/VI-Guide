import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";
import type { RideBooking, RideBookingPaymentStatus } from "@/types/mobility";

type Context = {
  params: { bookingId: string };
};

function paymentStatusFromStripe(
  status: string,
): RideBookingPaymentStatus {
  switch (status) {
    case "succeeded":
      return "paid";
    case "processing":
      return "processing";
    case "canceled":
      return "canceled";
    case "requires_payment_method":
    case "requires_action":
    case "requires_confirmation":
      return "requires_payment_method";
    default:
      return "unpaid";
  }
}

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

    const amount = Math.round(Number(booking.quotedFare?.total ?? 0) * 100);
    if (!Number.isSafeInteger(amount) || amount < 50) {
      return NextResponse.json(
        { error: "The booking does not have a valid payable fare." },
        { status: 409 },
      );
    }

    const stripe = getStripe();
    let paymentIntent = booking.paymentIntentId
      ? await stripe.paymentIntents.retrieve(booking.paymentIntentId)
      : null;

    if (
      paymentIntent &&
      (paymentIntent.amount !== amount || paymentIntent.currency !== "usd")
    ) {
      if (!["succeeded", "canceled"].includes(paymentIntent.status)) {
        await stripe.paymentIntents.cancel(paymentIntent.id);
      }
      paymentIntent = null;
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
          },
        },
        { idempotencyKey: `booking-payment-${bookingId}-${amount}` },
      );
    }

    if (!paymentIntent.client_secret) {
      return NextResponse.json(
        { error: "Payment could not be initialized." },
        { status: 502 },
      );
    }

    await bookingRef.update({
      paymentIntentId: paymentIntent.id,
      paymentStatus: paymentStatusFromStripe(paymentIntent.status),
      amountAuthorized: paymentIntent.amount,
      amountCaptured:
        paymentIntent.status === "succeeded"
          ? paymentIntent.amount_received
          : booking.amountCaptured ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      bookingId,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency: "usd",
      paymentStatus: paymentStatusFromStripe(paymentIntent.status),
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
