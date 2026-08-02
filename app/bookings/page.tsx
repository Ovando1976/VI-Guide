import { Suspense } from "react";

import { BookingStatusLookup } from "@/components/booking/booking-status-lookup";

export const metadata = {
  title: "My Bookings | VI Guide",
  description: "Check the status of a VI Guide accommodation, tour, or experience request.",
};

export default function BookingsPage() {
  return (
    <Suspense fallback={null}>
      <BookingStatusLookup />
    </Suspense>
  );
}
