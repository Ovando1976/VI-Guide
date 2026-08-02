import { NextResponse } from "next/server";

/**
 * Deprecated payment entry point.
 *
 * PaymentIntents must be created through the booking-scoped endpoint. That
 * route binds the intent to the booking in Firestore, uses an idempotency key,
 * protects already-captured payments, and enforces the payment lifecycle.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint has been replaced by /api/bookings/[bookingId]/payment-intent.",
      code: "PAYMENT_ENDPOINT_DEPRECATED",
    },
    {
      status: 410,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
