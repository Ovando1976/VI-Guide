import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getServerBooking } from "@/lib/server-bookings";

type Context = {
  params: { bookingId: string };
};

export async function POST(request: NextRequest, context: Context) {
  try {
    const session = await requireSession();
    const booking = await getServerBooking(context.params.bookingId);

    if (!booking || booking.riderId !== session.uid) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (booking.status !== "completed") {
      return NextResponse.json(
        { error: "Feedback is available after the ride is completed." },
        { status: 409 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { rating?: unknown; note?: unknown }
      | null;
    const rating = Number(body?.rating);
    const note = typeof body?.note === "string" ? body.note.replace(/\s+/g, " ").trim().slice(0, 500) : "";

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Choose a rating from 1 to 5." }, { status: 400 });
    }

    const now = new Date().toISOString();
    await getAdminDb()
      .collection("rideFeedback")
      .doc(booking.id)
      .set(
        {
          bookingId: booking.id,
          riderId: session.uid,
          driverId: booking.driverId ?? null,
          vehicleId: booking.vehicleId ?? null,
          island: booking.island,
          rating,
          note: note || null,
          route: {
            originEstateGeoid: booking.origin.estateGeoid,
            originEstateName: booking.origin.estateName,
            destinationEstateGeoid: booking.destination.estateGeoid,
            destinationEstateName: booking.destination.estateName,
          },
          fare: booking.finalFare ?? booking.quotedFare.total,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true },
      );

    return NextResponse.json({ ok: true, rating, note: note || null });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("ride feedback error", error);
    return NextResponse.json({ error: "Failed to save ride feedback." }, { status: 500 });
  }
}
