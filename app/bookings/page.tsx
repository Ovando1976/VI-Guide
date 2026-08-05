import { Suspense } from "react";

import { BookingStatusLookup } from "@/components/booking/booking-status-lookup";
import { CommercePaymentReturnNotice } from "@/components/booking/commerce-payment-return-notice";

export const metadata = {
  title: "My Bookings | VI Guide",
  description: "Check the status of a VI Guide accommodation, tour, or experience request.",
};

export default function BookingsPage() {
  return (
    <Suspense fallback={null}>
      <CommercePaymentReturnNotice />
      <BookingStatusLookup />
    </Suspense>
  );
}
