import "server-only";

import {
  FieldValue,
  type DocumentData,
  type UpdateData,
} from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import type { RideBooking } from "@/types/mobility";
import type { TripEventType } from "@/types/trip-event";
import { assertDispatchEligible } from "@/lib/taxi-dispatch-eligibility";

const NEXT_STATUSES: Record<RideBooking["status"], RideBooking["status"][]> = {
  draft: ["requested", "cancelled"],
  requested: ["matched", "cancelled"],
  matched: ["driver_en_route", "cancelled"],
  driver_en_route: ["arrived", "cancelled"],
  arrived: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const STATUS_TIMESTAMP_FIELD: Partial<
  Record<RideBooking["status"], keyof RideBooking>
> = {
  matched: "matchedAt",
  driver_en_route: "driverEnRouteAt",
  arrived: "arrivedAt",
  in_progress: "startedAt",
  completed: "completedAt",
  cancelled: "cancelledAt",
};

export async function createServerBooking(
  booking: Omit<RideBooking, "id">,
): Promise<string> {
  const db = getAdminDb();
  const reference = await db.collection("bookings").add({
    riderId: booking.riderId,
    driverId: booking.driverId ?? null,
    associationId: booking.associationId ?? null,
    vehicleId: booking.vehicleId ?? null,
    status: booking.status,
    paymentStatus: booking.paymentStatus ?? "unpaid",
    paymentIntentId: booking.paymentIntentId ?? null,
    amountAuthorized: booking.amountAuthorized ?? null,
    amountCaptured: booking.amountCaptured ?? null,
    mode: booking.mode,
    island: booking.island,
    origin: booking.origin,
    destination: booking.destination,
    passengers: booking.passengers,
    luggage: booking.luggage,
    quotedFare: booking.quotedFare,
    scheduledAt: booking.scheduledAt ?? null,
    notes: booking.notes ?? "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return reference.id;
}

export async function getServerBooking(bookingId: string): Promise<RideBooking | null> {
  const snapshot = await getAdminDb().collection("bookings").doc(bookingId).get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() } as RideBooking;
}

export async function assignServerDriver(params: {
  bookingId: string;
  driverId: string;
  actorType?: "driver" | "admin";
  actorId?: string;
}) {
  const db = getAdminDb();
  const bookingRef = db.collection("bookings").doc(params.bookingId);
  const eventRef = db.collection("tripEvents").doc();
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists) throw new Error("Booking not found.");
    const booking = { id: snapshot.id, ...snapshot.data() } as RideBooking;
    if (booking.paymentStatus !== "paid") {
      throw new Error("Payment must clear before a driver can be assigned.");
    }
    if (booking.status !== "requested" && booking.status !== "matched") {
      throw new Error("This trip is no longer available for assignment.");
    }
    if (
      booking.status === "matched" &&
      booking.driverId &&
      params.actorType !== "admin"
    ) {
      throw new Error("Another driver has already accepted this trip.");
    }

    const driverRef = db.collection("drivers").doc(params.driverId);
    const driverSnapshot = await transaction.get(driverRef);
    if (!driverSnapshot.exists) throw new Error("Driver record not found.");
    const driverData = driverSnapshot.data();
    const vehicleId = String(driverData?.vehicleId ?? "");
    const associationId = String(driverData?.associationId ?? "");
    if (!vehicleId || !associationId) {
      throw new Error("Driver is not linked to an association fleet vehicle.");
    }

    const vehicleSnapshot = await transaction.get(
      db.collection("vehicles").doc(vehicleId),
    );
    const associationSnapshot = await transaction.get(
      db.collection("taxiAssociations").doc(associationId),
    );
    const eligible = assertDispatchEligible({
      booking,
      driverSnapshot,
      vehicleSnapshot,
      associationSnapshot,
    });

    if (booking.driverId && booking.driverId !== params.driverId) {
      transaction.update(db.collection("drivers").doc(booking.driverId), {
        availability: "available",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.update(bookingRef, {
      driverId: params.driverId,
      associationId,
      vehicleId,
      status: "matched",
      matchedAt: FieldValue.serverTimestamp(),
      assignmentComplianceSnapshot: {
        driverAuthorizationStatus: eligible.driver.authorizationStatus,
        associationStatus: eligible.association.status,
        vehicleInspectionStatus: eligible.vehicle.inspectionStatus,
        vehicleInsuranceStatus: eligible.vehicle.insuranceStatus,
        verifiedAt: new Date().toISOString(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(driverRef, {
      availability: "busy",
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(eventRef, {
      bookingId: params.bookingId,
      type: "driver_matched",
      actorType: params.actorType ?? "driver",
      actorId: params.actorId ?? params.driverId,
      message:
        params.actorType === "admin"
          ? "Dispatch assigned a driver to the trip."
          : "Driver accepted and was assigned to the trip.",
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function updateServerTripStatus(params: {
  bookingId: string;
  status: RideBooking["status"];
  actorType: "system" | "driver" | "rider" | "admin";
  actorId?: string;
  message: string;
  eventType: TripEventType;
}) {
  const db = getAdminDb();
  const bookingRef = db.collection("bookings").doc(params.bookingId);
  const eventRef = db.collection("tripEvents").doc();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists) throw new Error("Booking not found.");

    const booking = { id: snapshot.id, ...snapshot.data() } as RideBooking;
    const allowed = NEXT_STATUSES[booking.status] ?? [];
    if (!allowed.includes(params.status)) {
      throw new Error(
        `Trip cannot move from ${booking.status} to ${params.status}.`,
      );
    }
    if (params.status !== "cancelled" && booking.paymentStatus !== "paid") {
      throw new Error("Payment must clear before this trip can advance.");
    }
    if (
      ["driver_en_route", "arrived", "in_progress", "completed"].includes(
        params.status,
      ) &&
      !booking.driverId
    ) {
      throw new Error("A verified driver must be assigned before the trip can advance.");
    }

    const updatePayload: UpdateData<DocumentData> = {
      status: params.status,
      updatedAt: FieldValue.serverTimestamp(),
    };
    const timestampField = STATUS_TIMESTAMP_FIELD[params.status];
    if (timestampField) {
      updatePayload[timestampField] = FieldValue.serverTimestamp();
    }

    if (params.status === "completed") {
      const totalFare = booking.finalFare ?? booking.quotedFare?.total ?? 0;
      updatePayload.finalFare = totalFare;
      updatePayload.settlement = {
        status: "pending_review",
        grossFare: totalFare,
      };
    }

    if (params.status === "completed" || params.status === "cancelled") {
      updatePayload.driverLocation = FieldValue.delete();
      updatePayload.driverLocationUpdatedAt = FieldValue.delete();
    }

    transaction.update(bookingRef, updatePayload);
    if (
      booking.driverId &&
      (params.status === "completed" || params.status === "cancelled")
    ) {
      transaction.update(db.collection("drivers").doc(booking.driverId), {
        availability: "available",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    transaction.set(eventRef, {
      bookingId: params.bookingId,
      type: params.eventType,
      actorType: params.actorType,
      actorId: params.actorId ?? null,
      message: params.message,
      fromStatus: booking.status,
      toStatus: params.status,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}
