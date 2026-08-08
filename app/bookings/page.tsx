import { Suspense } from "react";
import { Route } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { BookingStatusLookup } from "@/components/booking/booking-status-lookup";
import { CommercePaymentReturnNotice } from "@/components/booking/commerce-payment-return-notice";
import { RememberedBookingsPanel } from "@/components/booking/remembered-bookings-panel";

export const metadata = {
  title: "My Bookings | VI Guide",
  description:
    "Review remembered booking requests and securely check the live status of a VI Guide accommodation, tour, or experience request.",
};

export default function BookingsPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ea] pb-32 text-[#043331]">
      <div className="px-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref="/planner"
          actionLabel="Open My Trip"
          actionIcon={Route}
          secondaryHref="/places"
          secondaryLabel="Explore"
        />
      </div>
      <Suspense fallback={null}>
        <CommercePaymentReturnNotice />
      </Suspense>
      <RememberedBookingsPanel />
      <Suspense fallback={null}>
        <BookingStatusLookup />
      </Suspense>
    </main>
  );
}
