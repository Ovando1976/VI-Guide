"use client";

import { useEffect, useMemo, useState } from "react";

import { RiderDriverLocation } from "@/components/mobility/rider-driver-location";
import { subscribeToRiderBookings } from "@/lib/firestore-trips";
import type { RideBooking } from "@/types/mobility";

const TRACKABLE_STATUSES: RideBooking["status"][] = [
  "matched",
  "driver_en_route",
  "arrived",
  "in_progress",
];

export function RiderLiveDriverMap({ riderId }: { riderId: string }) {
  const [bookings, setBookings] = useState<RideBooking[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToRiderBookings(
      riderId,
      (nextBookings) => {
        setBookings(nextBookings);
        setError(null);
      },
      (subscriptionError) => {
        console.error("rider live location listener error", subscriptionError);
        setError(subscriptionError.message);
      },
    );
  }, [riderId]);

  const activeBooking = useMemo(
    () => bookings.find((booking) => TRACKABLE_STATUSES.includes(booking.status)),
    [bookings],
  );

  if (error) {
    return (
      <section className="mb-6 rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
        Live driver position is temporarily unavailable: {error}
      </section>
    );
  }

  if (!activeBooking) return null;

  return (
    <div className="mb-6">
      <RiderDriverLocation booking={activeBooking} />
    </div>
  );
}
