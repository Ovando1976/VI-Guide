import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type UpdateData,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { buildPayout } from "@/lib/payouts";
import {
  scopeRiderBookingSubscription,
  subscribeToRiderBookingScopeUpdates,
} from "@/lib/rider-booking-subscription-scope";
import type { RideBooking } from "@/types/mobility";
import type { TripEvent, TripEventType } from "@/types/trip-event";

export async function appendTripEvent(params: {
  bookingId: string;
  type: TripEventType;
  actorType: "system" | "driver" | "rider" | "admin";
  actorId?: string;
  message: string;
}) {
  await addDoc(collection(db, "tripEvents"), {
    bookingId: params.bookingId,
    type: params.type,
    actorType: params.actorType,
    actorId: params.actorId ?? null,
    message: params.message,
    createdAt: serverTimestamp(),
  });
}

export async function assignDriverToBooking(params: {
  bookingId: string;
  driverId: string;
}) {
  await updateDoc(doc(db, "bookings", params.bookingId), {
    driverId: params.driverId,
    status: "matched",
    updatedAt: serverTimestamp(),
  });

  await appendTripEvent({
    bookingId: params.bookingId,
    type: "driver_matched",
    actorType: "driver",
    actorId: params.driverId,
    message: "Driver accepted and was assigned to the trip.",
  });
}

export async function updateTripStatus(params: {
  bookingId: string;
  status: RideBooking["status"];
  actorType: "system" | "driver" | "rider" | "admin";
  actorId?: string;
  message: string;
  eventType: TripEventType;
}) {
  const bookingRef = doc(db, "bookings", params.bookingId);

  const updatePayload: UpdateData<DocumentData> = {
    status: params.status,
    updatedAt: serverTimestamp(),
  };

  if (params.status === "completed") {
    const snapshot = await getDoc(bookingRef);

    if (!snapshot.exists()) {
      throw new Error("Booking not found.");
    }

    const booking = snapshot.data() as RideBooking;
    const totalFare = booking.finalFare ?? booking.quotedFare?.total ?? 0;
    const payout = buildPayout({ totalFare });

    updatePayload.finalFare = totalFare;
    updatePayload.payout = payout;
  }

  await updateDoc(bookingRef, updatePayload);

  await appendTripEvent({
    bookingId: params.bookingId,
    type: params.eventType,
    actorType: params.actorType,
    actorId: params.actorId,
    message: params.message,
  });
}

export function subscribeToBookingEvents(
  bookingId: string,
  onData: (events: TripEvent[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "tripEvents"),
    where("bookingId", "==", bookingId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const events = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();

          return {
            id: docSnap.id,
            ...data,
            createdAt:
              data.createdAt?.toDate?.()?.toISOString?.() ??
              new Date(0).toISOString(),
          };
        })
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)) as TripEvent[];

      onData(events);
    },
    (error) => {
      console.error("subscribeToBookingEvents error", error);
      onError?.(error);
    }
  );
}

export function subscribeToRiderBookings(
  riderId: string,
  onData: (bookings: RideBooking[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, "bookings"), where("riderId", "==", riderId));
  let latestBookings: RideBooking[] = [];

  const emitScopedBookings = () => {
    onData(scopeRiderBookingSubscription(latestBookings));
  };
  const unsubscribeScope = subscribeToRiderBookingScopeUpdates(emitScopedBookings);
  const unsubscribeSnapshot = onSnapshot(
    q,
    (snapshot) => {
      latestBookings = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();

          return {
            id: docSnap.id,
            ...data,
            createdAt:
              data.createdAt?.toDate?.()?.toISOString?.() ??
              new Date(0).toISOString(),
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as RideBooking[];

      emitScopedBookings();
    },
    (error) => {
      console.error("subscribeToRiderBookings error", error);
      onError?.(error);
    }
  );

  return () => {
    unsubscribeScope();
    unsubscribeSnapshot();
  };
}

export function subscribeToOpenBookings(
  onData: (bookings: RideBooking[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "bookings"),
    where("status", "==", "requested")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const bookings = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();

          return {
            id: docSnap.id,
            ...data,
            createdAt:
              data.createdAt?.toDate?.()?.toISOString?.() ??
              new Date(0).toISOString(),
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as RideBooking[];

      onData(bookings);
    },
    (error) => {
      console.error("subscribeToOpenBookings error", error);
      onError?.(error);
    }
  );
}
