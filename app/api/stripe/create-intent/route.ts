import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getServerBooking } from "@/lib/server-bookings";

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
      },
      description: `USVI ride payment for booking ${bookingId}`,
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
