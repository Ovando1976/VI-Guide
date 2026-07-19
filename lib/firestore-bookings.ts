import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { RideBooking } from "@/types/mobility";
import type { DriverProfile, VehicleRecord } from "@/types/driver";

export async function createBooking(
  booking: Omit<RideBooking, "id">
): Promise<string> {
  const payload = {
    riderId: booking.riderId,
    driverId: booking.driverId ?? null,
    status: booking.status,
    paymentStatus: booking.paymentStatus ?? "unpaid",
    paymentIntentId: booking.paymentIntentId ?? null,
    amountAuthorized:
      typeof booking.amountAuthorized === "number"
        ? booking.amountAuthorized
        : null,
    amountCaptured:
      typeof booking.amountCaptured === "number"
        ? booking.amountCaptured
        : null,
    mode: booking.mode,
    island: booking.island,
    origin: booking.origin,
    destination: booking.destination,
    passengers: booking.passengers,
    luggage: booking.luggage,
    quotedFare: booking.quotedFare,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...(booking.scheduledAt ? { scheduledAt: booking.scheduledAt } : {}),
    ...(booking.notes ? { notes: booking.notes } : {}),
    ...(typeof booking.finalFare === "number"
      ? { finalFare: booking.finalFare }
      : {}),
  };

  const ref = await addDoc(collection(db, "bookings"), payload);
  return ref.id;
}

export async function updateBookingStatus(
  bookingId: string,
  status: RideBooking["status"],
  driverId?: string
) {
  const ref = doc(db, "bookings", bookingId);

  await updateDoc(ref, {
    status,
    ...(driverId ? { driverId } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function updateBookingPayment(
  bookingId: string,
  payment: {
    paymentStatus: NonNullable<RideBooking["paymentStatus"]>;
    paymentIntentId?: string | null;
    amountAuthorized?: number | null;
    amountCaptured?: number | null;
  }
) {
  const ref = doc(db, "bookings", bookingId);

  await updateDoc(ref, {
    paymentStatus: payment.paymentStatus,
    ...(payment.paymentIntentId !== undefined
      ? { paymentIntentId: payment.paymentIntentId }
      : {}),
    ...(payment.amountAuthorized !== undefined
      ? { amountAuthorized: payment.amountAuthorized }
      : {}),
    ...(payment.amountCaptured !== undefined
      ? { amountCaptured: payment.amountCaptured }
      : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function listAvailableDrivers(
  island: "stt" | "stj" | "stx",
  maxResults = 20
): Promise<DriverProfile[]> {
  const q = query(
    collection(db, "drivers"),
    where("availability", "==", "available"),
    where("authorizationStatus", "==", "active"),
    where("verified", "==", true),
    where("islands", "array-contains", island),
    orderBy("reliabilityScore", "desc"),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as DriverProfile[];
}

export async function listDriverVehicles(
  driverId: string
): Promise<VehicleRecord[]> {
  const q = query(
    collection(db, "vehicles"),
    where("driverId", "==", driverId),
    where("active", "==", true)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as VehicleRecord[];
}
