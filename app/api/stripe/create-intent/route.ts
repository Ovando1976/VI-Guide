import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getServerBooking } from "@/lib/server-bookings";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifyOfficialTaxiFareSnapshot } from "@/lib/usvi-taxi-tariffs";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const { bookingId } = body as {
      bookingId?: string;
    };

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required." },
        { status: 400 }
      );
    }
    const booking = await getServerBooking(bookingId);
    if (!booking || booking.riderId !== session.uid) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ error: "This booking has already been paid." }, { status: 409 });
    }
    if (booking.status !== "requested") {
      return NextResponse.json({ error: "This booking is not eligible for payment." }, { status: 409 });
    }
    await verifyOfficialTaxiFareSnapshot({
      fare: booking.quotedFare,
      island: booking.island,
      passengers: booking.passengers,
      luggage: booking.luggage,
    });
    const amount = Math.round(Number(booking.quotedFare?.total ?? 0) * 100);
    if (!Number.isSafeInteger(amount) || amount < 50) {
      return NextResponse.json({ error: "Booking has an invalid fare." }, { status: 400 });
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        bookingId,
        riderId: session.uid,
        tariffId: booking.quotedFare.tariffId,
        tariffVersion: booking.quotedFare.tariffVersion,
        rateRuleId: booking.quotedFare.rateRuleId,
      },
      description: `USVI ride payment for booking ${bookingId}`,
    }, {
      idempotencyKey: `booking-${bookingId}-${booking.quotedFare.rateRuleId}-${booking.quotedFare.expiresAt}`,
    });

    const bookingRef = getAdminDb().collection("bookings").doc(bookingId);
    await getAdminDb().runTransaction(async (transaction) => {
      const current = await transaction.get(bookingRef);
      if (!current.exists || current.data()?.riderId !== session.uid) throw new Error("Booking changed before payment setup.");
      if (current.data()?.quotedFare?.expiresAt !== booking.quotedFare.expiresAt) throw new Error("Booking fare changed before payment setup.");
      transaction.update(bookingRef, {
        paymentIntentId: paymentIntent.id,
        paymentStatus: paymentIntent.status === "processing" ? "processing" : "requires_payment_method",
        amountAuthorized: booking.quotedFare.total,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("create-intent error", error);
    return NextResponse.json(
      { error: "Failed to create payment intent." },
      { status: 500 }
    );
  }
}
