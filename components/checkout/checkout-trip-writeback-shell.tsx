"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CheckoutTripWriteback } from "@/components/checkout/checkout-trip-writeback";

type CheckoutTripBooking = {
  journeyPlanId?: string | null;
  island?: string;
  origin?: { estateName?: string };
  destination?: { estateName?: string };
  status?: string;
};

export function CheckoutTripWritebackShell() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = params.bookingId;
  const [booking, setBooking] = useState<CheckoutTripBooking | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    const controller = new AbortController();

    fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!controller.signal.aborted && response.ok && payload?.booking) {
          setBooking(payload.booking as CheckoutTripBooking);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [bookingId]);

  return <CheckoutTripWriteback bookingId={bookingId} booking={booking} />;
}
