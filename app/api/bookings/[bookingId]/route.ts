import { NextRequest, NextResponse } from "next/server";
import { getServerBooking } from "@/lib/server-bookings";
import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";

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

    let riderVerificationCode: string | null = null;
    if (booking.riderId === session.uid) {
      const secret = await getAdminDb()
        .collection("bookingRiderSecrets")
        .doc(bookingId)
        .get();
      const code = secret.data()?.code;
      riderVerificationCode =
        booking.riderVerification?.status === "verified"
          ? null
          : typeof code === "string"
            ? code
            : null;
    }

    return NextResponse.json({ booking, riderVerificationCode });
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
