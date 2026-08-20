import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { assertDispatchEligible } from "@/lib/taxi-dispatch-eligibility";
import type { RideBooking } from "@/types/mobility";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession(["driver", "admin"]);
    const driverId = session.driverId ?? session.uid;
    const db = getAdminDb();

    const driverSnapshot = await db.collection("drivers").doc(driverId).get();
    if (!driverSnapshot.exists) {
      return NextResponse.json({
        eligibleBookingIds: [],
        candidateCount: 0,
        readinessIssue: "Your account is not linked to an active driver profile yet.",
      });
    }

    const driverData = driverSnapshot.data();
    const vehicleId = String(driverData?.vehicleId ?? "").trim();
    const associationId = String(driverData?.associationId ?? "").trim();

    if (!vehicleId || !associationId) {
      return NextResponse.json({
        eligibleBookingIds: [],
        candidateCount: 0,
        readinessIssue: "Link an active association vehicle before taking paid ride requests.",
      });
    }

    const [vehicleSnapshot, associationSnapshot, bookingsSnapshot] = await Promise.all([
      db.collection("vehicles").doc(vehicleId).get(),
      db.collection("taxiAssociations").doc(associationId).get(),
      db.collection("bookings").where("status", "==", "requested").where("paymentStatus", "==", "paid").get(),
    ]);

    if (!vehicleSnapshot.exists || !associationSnapshot.exists) {
      return NextResponse.json({
        eligibleBookingIds: [],
        candidateCount: bookingsSnapshot.size,
        readinessIssue: "Your linked taxi fleet records are incomplete. Ask dispatch to review your vehicle and association.",
      });
    }

    const eligibleBookingIds: string[] = [];

    for (const bookingSnapshot of bookingsSnapshot.docs) {
      const booking = { id: bookingSnapshot.id, ...bookingSnapshot.data() } as RideBooking;
      try {
        assertDispatchEligible({ booking, driverSnapshot, vehicleSnapshot, associationSnapshot });
        eligibleBookingIds.push(bookingSnapshot.id);
      } catch {
        // Acceptance repeats this authoritative check transactionally. Incompatible
        // requests remain hidden from this driver's marketplace.
      }
    }

    return NextResponse.json({
      eligibleBookingIds,
      candidateCount: bookingsSnapshot.size,
      filteredCount: bookingsSnapshot.size - eligibleBookingIds.length,
      readinessIssue: null,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("driver marketplace eligibility error", error);
    return NextResponse.json({ error: "Unable to load compatible ride requests." }, { status: 500 });
  }
}
