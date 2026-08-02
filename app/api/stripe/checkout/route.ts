import { NextResponse } from "next/server";

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
