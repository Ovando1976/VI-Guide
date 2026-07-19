import { NextRequest, NextResponse } from "next/server";
import { getServerBooking } from "@/lib/server-bookings";
import { authErrorResponse, requireSession } from "@/lib/auth-server";

type Context = {
  params: { bookingId: string };
};

export async function GET(_request: NextRequest, context: Context) {
  try {
    const session = await requireSession();
    const { bookingId } = context.params;
    const booking = await getServerBooking(bookingId);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    const privileged = session.role === "admin" || session.role === "dispatcher";
    const assignedDriver = session.role === "driver" && booking.driverId === (session.driverId ?? session.uid);
    if (!privileged && !assignedDriver && booking.riderId !== session.uid) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    return NextResponse.json({
      booking,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("booking read error", error);
    return NextResponse.json(
      { error: "Failed to load booking." },
      { status: 500 }
    );
  }
}
