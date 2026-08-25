"use client";

import { useEffect } from "react";

import {
  readJourneyPlans,
  upsertJourneyPlan,
  type JourneyPlan,
} from "@/lib/journey-planner";
import {
  clearPendingMobilityTripPlanId,
  readPendingMobilityTripPlanId,
} from "@/lib/mobility-trip-continuity";

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

    const tripId = readPendingMobilityTripPlanId();
    if (!tripId) return;

    const plan = readJourneyPlans().find((candidate) => candidate.id === tripId);
    if (!plan) {
      clearPendingMobilityTripPlanId();
      return;
    }

    const stopId = `mobility_booking_${bookingId}`.slice(0, 160);
    if (plan.plan.some((stop) => stop.id === stopId)) {
      // Keep the trip context until checkout finishes so Stripe can return to
      // this exact JourneyPlan even when the ride stop was already written.
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
    // CheckoutForm clears the pending trip only after successful payment.
    // Until then it is needed to build Stripe's exact My Trip return URL.
  }, [booking, bookingId]);

  return null;
}
