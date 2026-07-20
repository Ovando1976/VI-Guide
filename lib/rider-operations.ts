import "server-only";

import { getAdminDb } from "./firebase-admin";
import { getBookingWorkflow } from "./booking-workflow";
import type { RideBooking, TaxiRateReviewRequest } from "../types/mobility";
import type { RiderBookingOperations, RiderOperationsPayload } from "../types/rider-operations";
import type { TripEvent } from "../types/trip-event";

export async function getRiderOperations(riderId: string): Promise<RiderOperationsPayload> {
  const db = getAdminDb();
  const [bookingSnapshot, reviewSnapshot] = await Promise.all([
    db.collection("bookings").where("riderId", "==", riderId).get(),
    db.collection("taxiRateReviews").where("riderId", "==", riderId).get(),
  ]);

  const bookings = bookingSnapshot.docs
    .map((document) => normalizeDocument({ id: document.id, ...document.data() }) as RideBooking)
    .sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt));

  const operations = await Promise.all(bookings.map((booking) => enrichBooking(booking)));
  const rateReviews = reviewSnapshot.docs
    .map((document) => normalizeDocument({ id: document.id, ...document.data() }) as TaxiRateReviewRequest)
    .sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt));

  return { bookings: operations, rateReviews, generatedAt: new Date().toISOString() };
}

async function enrichBooking(booking: RideBooking): Promise<RiderBookingOperations> {
  const db = getAdminDb();
  const [eventSnapshot, driverSnapshot, vehicleSnapshot] = await Promise.all([
    db.collection("tripEvents").where("bookingId", "==", booking.id).get(),
    booking.driverId ? db.collection("drivers").doc(booking.driverId).get() : Promise.resolve(null),
    booking.vehicleId ? db.collection("vehicles").doc(booking.vehicleId).get() : Promise.resolve(null),
  ]);
  const events = eventSnapshot.docs
    .map((document) => normalizeDocument({ id: document.id, ...document.data() }) as TripEvent)
    .sort((a, b) => timestamp(a.createdAt) - timestamp(b.createdAt));
  const driverData = driverSnapshot?.exists ? driverSnapshot.data() : null;
  const vehicleData = vehicleSnapshot?.exists ? vehicleSnapshot.data() : null;
  const workflow = getBookingWorkflow(booking, "rider");

  return {
    booking,
    events,
    driver: driverSnapshot?.exists
      ? {
          id: driverSnapshot.id,
          name: String(driverData?.displayName ?? driverData?.fullName ?? driverData?.idHint ?? "Assigned driver"),
          rating: finiteNumber(driverData?.rating),
        }
      : null,
    vehicle: vehicleSnapshot?.exists
      ? {
          id: vehicleSnapshot.id,
          make: optionalString(vehicleData?.make),
          model: optionalString(vehicleData?.model),
          color: optionalString(vehicleData?.color),
          taxiPlate: optionalString(vehicleData?.taxiPlate ?? vehicleData?.plate),
        }
      : null,
    canCancel: workflow.actions.some((action) => action.nextStatus === "cancelled"),
    nextMessage: nextMessage(booking.status),
  };
}

function nextMessage(status: RideBooking["status"]) {
  switch (status) {
    case "requested": return "Payment is confirmed. Waiting for an eligible driver.";
    case "matched": return "Your driver is assigned and preparing for pickup.";
    case "driver_en_route": return "Your driver is traveling to the pickup point.";
    case "arrived": return "Your driver has arrived. Meet at the confirmed pickup point.";
    case "in_progress": return "Your ride is in progress.";
    case "completed": return "Your ride is complete.";
    case "cancelled": return "This ride was cancelled.";
    default: return "Complete payment review to request this ride.";
  }
}

function normalizeDocument<T>(value: T): T {
  if (Array.isArray(value)) return value.map(normalizeDocument) as T;
  if (!value || typeof value !== "object") return value;
  const possible = value as { toDate?: () => Date };
  if (typeof possible.toDate === "function") return possible.toDate().toISOString() as T;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, normalizeDocument(entry)]),
  ) as T;
}

function timestamp(value: unknown) {
  const parsed = typeof value === "string" ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
