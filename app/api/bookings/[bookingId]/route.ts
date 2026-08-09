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
    let rideIdentity: {
      driverName: string | null;
      vehicleDescription: string | null;
      taxiPlate: string | null;
      medallionNumber: string | null;
      associationName: string | null;
      dispatchPhone: string | null;
    } | null = null;
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

      if (booking.driverId) {
        const [driverSnapshot, vehicleSnapshot, associationSnapshot] =
          await Promise.all([
            getAdminDb().collection("drivers").doc(booking.driverId).get(),
            booking.vehicleId
              ? getAdminDb().collection("vehicles").doc(booking.vehicleId).get()
              : Promise.resolve(null),
            booking.associationId
              ? getAdminDb()
                  .collection("taxiAssociations")
                  .doc(booking.associationId)
                  .get()
              : Promise.resolve(null),
          ]);
        const driver = driverSnapshot.data();
        const vehicle = vehicleSnapshot?.data();
        const association = associationSnapshot?.data();
        const vehicleDescription = [vehicle?.color, vehicle?.make, vehicle?.model]
          .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
          .join(" ");
        rideIdentity = {
          driverName:
            typeof driver?.displayName === "string"
              ? driver.displayName
              : typeof driver?.fullName === "string"
                ? driver.fullName
                : null,
          vehicleDescription: vehicleDescription || null,
          taxiPlate: typeof vehicle?.taxiPlate === "string" ? vehicle.taxiPlate : null,
          medallionNumber:
            typeof vehicle?.medallionNumber === "string"
              ? vehicle.medallionNumber
              : null,
          associationName:
            typeof association?.name === "string" ? association.name : null,
          dispatchPhone:
            typeof association?.dispatchPhone === "string"
              ? association.dispatchPhone
              : null,
        };
      }
    }

    return NextResponse.json({ booking, riderVerificationCode, rideIdentity });
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
