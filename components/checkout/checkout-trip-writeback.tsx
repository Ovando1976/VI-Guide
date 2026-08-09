"use client";

import { useEffect } from "react";

import {
  readJourneyPlans,
  upsertJourneyPlan,
  type JourneyPlan,
} from "@/lib/journey-planner";
import { PENDING_MOBILITY_TRIP_KEY } from "@/components/mobility/trip-aware-mobility-handoff";

type CheckoutTripBooking = {
  island?: string;
  origin?: { estateName?: string };
  destination?: { estateName?: string };
  status?: string;
};

type Props = {
  bookingId: string;
  booking: CheckoutTripBooking | null;
};

export function CheckoutTripWriteback({ bookingId, booking }: Props) {
  useEffect(() => {
    if (!bookingId || !booking) return;

    const tripId = window.sessionStorage.getItem(PENDING_MOBILITY_TRIP_KEY)?.trim();
    if (!tripId) return;

    const plan = readJourneyPlans().find((candidate) => candidate.id === tripId);
    if (!plan) {
      window.sessionStorage.removeItem(PENDING_MOBILITY_TRIP_KEY);
      return;
    }

    const stopId = `mobility_booking_${bookingId}`.slice(0, 160);
    if (plan.plan.some((stop) => stop.id === stopId)) {
      window.sessionStorage.removeItem(PENDING_MOBILITY_TRIP_KEY);
      return;
    }

    const from = booking.origin?.estateName?.trim() || "Pickup";
    const to = booking.destination?.estateName?.trim() || "Destination";
    const status = booking.status?.trim() || "requested";

    const updated: JourneyPlan = {
      ...plan,
      plan: [
        ...plan.plan,
        {
          id: stopId,
          title: `Ride · ${from} → ${to}`,
          island: plan.island,
          kind: "mobility_booking",
          summary: `Ride request ${bookingId} is ${status}. Continue to secure payment and trip tracking.`,
          bookingHref: `/checkout/${encodeURIComponent(bookingId)}`,
          mobility: {
            from,
            to,
            mode: "taxi",
          },
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    upsertJourneyPlan(updated);
    window.sessionStorage.removeItem(PENDING_MOBILITY_TRIP_KEY);
  }, [booking, bookingId]);

  return null;
}